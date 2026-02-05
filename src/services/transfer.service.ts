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
      let pendingTransactionLog;

      try {
        // Create PENDING log FIRST

        pendingTransactionLog = await TransactionLogRepo.create(
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
          const existingTransaction =
            await TransactionLogRepo.findByIdempotencyKey(idempotencyKey);
          if (!existingTransaction) throw new Error("Idempotency conflict");

          // If transaction already finished, return the result
          if (existingTransaction.status !== "PENDING") {
            return existingTransaction;
          }
          pendingTransactionLog = existingTransaction;
        } else {
          throw err;
        }
      }

      const fromWallet = await WalletRepo.findById(senderWalletId, t);
      const toWallet = await WalletRepo.findById(recipientWalletId, t);

      if (!fromWallet || !toWallet) {
        await TransactionLogRepo.markAsFailed(
          pendingTransactionLog.id,
          "Wallet not found",
          t,
        );
        return pendingTransactionLog;
      }

      // update wallets
      const convertedAmount = new Big(amount);
      const senderBalance = new Big(fromWallet.balance);
      const receiverBalance = new Big(toWallet.balance);

      if (senderBalance.lt(convertedAmount)) {
        await TransactionLogRepo.markAsFailed(
          pendingTransactionLog.id,
          "Insufficient balance",
          t,
        );
        const failedTransaction = await TransactionLogRepo.findById(
          pendingTransactionLog.id,
          t,
        );

        if (!failedTransaction) {
          throw new Error("Transaction log missing");
        }

        return failedTransaction;
      }

      //update accounts
      const newSenderBalance = senderBalance.minus(convertedAmount).toFixed(2);
      const newReceiverBalance = receiverBalance
        .plus(convertedAmount)
        .toFixed(2);

      await WalletRepo.updateBalance(senderWalletId, newSenderBalance, t);
      await WalletRepo.updateBalance(recipientWalletId, newReceiverBalance, t);

      // Finalize status
      await TransactionLogRepo.updateStatus(
        pendingTransactionLog.id,
        "SUCCESS",
        t,
      );

      const finalTransactionLog = await TransactionLogRepo.findById(
        pendingTransactionLog.id,
        t,
      );

      if (!finalTransactionLog) {
        throw new Error("Transaction log missing");
      }

      return finalTransactionLog;
    });

    // Update Redis
    await IdempotencyRepo.set(idempotencyKey, {
      transactionLogId: result.id,
      status: result.status,
    });

    return result;
  },
};
