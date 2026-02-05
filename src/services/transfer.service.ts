import Big from "big.js";
import { sequelize } from "../config/database";
import { WalletRepo } from "../repository/wallets.repo";
import { TransactionLogRepo } from "../repository/transactionLog.repo";
import { IdempotencyRepo } from "../repository/redis.repo";

interface TransferBody {
  senderWalletId: string;
  recipientWalletId: string;
  amount: string;
  idempotencyKey: string;
}

export const TransferService = {
  async transfer(body: TransferBody) {
    const { senderWalletId, recipientWalletId, amount, idempotencyKey } = body;

    // Prevent self-transfers to yourself
    if (senderWalletId === recipientWalletId) {
      throw new Error("Cannot transfer to the same wallet");
    }

    //check Redis first (Cache-aside pattern)
    const cachedData = await IdempotencyRepo.get(idempotencyKey);
    if (cachedData?.transactionLogId) {
      const transaction = await TransactionLogRepo.findById(
        cachedData.transactionLogId,
      );
      if (transaction) return transaction;
    }

    //DB-level transaction
    const result = await sequelize.transaction(async (t) => {
      let pendingLog;

      try {
        // Create PENDING log FIRST

        pendingLog = await TransactionLogRepo.create(
          {
            idempotencyKey,
            senderId: senderWalletId,
            recipientId: recipientWalletId,
            amount,
            status: "PENDING",
          },
          t,
        );
      } catch (err: any) {
        if (err?.name === "SequelizeUniqueConstraintError") {
          const existing =
            await TransactionLogRepo.findByIdempotencyKey(idempotencyKey);
          if (!existing) throw new Error("Idempotency conflict detected.");

          // If transaction already finished, return the result
          if (existing.status !== "PENDING") return existing;
          pendingLog = existing;
        } else {
          throw err;
        }
      }

      const fromWallet = await WalletRepo.findById(senderWalletId, t);
      const toWallet = await WalletRepo.findById(recipientWalletId, t);

      if (!fromWallet || !toWallet) {
        await TransactionLogRepo.markAsFailed(
          pendingLog.id,
          "Wallet not found",
          t,
        );
        return pendingLog;
      }

      // update wallets
      const bigAmount = new Big(amount);
      const senderBalance = new Big(fromWallet.balance);
      const receiverBalance = new Big(toWallet.balance);

      if (senderBalance.lt(bigAmount)) {
        await TransactionLogRepo.markAsFailed(
          pendingLog.id,
          "Insufficient balance",
          t,
        );
        return (await TransactionLogRepo.findById(pendingLog.id, t))!;
      }

      //update accounts
      const newSenderBalance = senderBalance.minus(bigAmount).toFixed(2);
      const newReceiverBalance = receiverBalance.plus(bigAmount).toFixed(2);

      await WalletRepo.updateBalance(senderWalletId, newSenderBalance, t);
      await WalletRepo.updateBalance(recipientWalletId, newReceiverBalance, t);

      // Finalize status
      await TransactionLogRepo.updateStatus(pendingLog.id, "SUCCESS", t);

      // Fresh fetch to ensure all hooks/timestamps are current
      const finalLog = await TransactionLogRepo.findById(pendingLog.id, t);
      return finalLog!;
    });

    // Update Redis 
    await IdempotencyRepo.set(idempotencyKey, {
      transactionLogId: result.id,
      status: result.status,
    });

    return result;
  },
};
