// import { WalletRepo } from "../repository/wallets.repo";
// import { TransactionLogRepo } from "../repository/transactionLog.repo";
// import { sequelize } from "../config/database";
// import { TransactionLog } from "../models/transactionlog";

// interface TransferInput {
//   fromWalletId: string;
//   toWalletId: string;
//   amount: number; // in kobo
//   idempotencyKey: string;
// }

// export const TransferService = {
//   async transfer(input: TransferInput) {
//     const { fromWalletId, toWalletId, amount, idempotencyKey } = input;

//     // 1️⃣ Check idempotency
//     const existingLog = await TransactionLogRepo.findByIdempotencyKey(idempotencyKey);
//     if (existingLog) return existingLog;

//     // 2️⃣ Start DB transaction
//     return sequelize.transaction(async (t) => {
//       // Lock wallets
//       const fromWallet = await WalletRepo.findById(fromWalletId, t);
//       const toWallet = await WalletRepo.findById(toWalletId, t);

//       if (!fromWallet || !toWallet) {
//         throw new Error("One or both wallets not found");
//       }

//       if (fromWallet.balance < amount) {
//         const failedLog = await TransactionLogRepo.create(
//           {
//             senderId: fromWalletId,
//             recepientId: toWalletId,
//             amount,
//             status: "FAILED",
//             failureReason: "Insufficient balance",
//             idempotencyKey: idempotencyKey,
//           },
//           t
//         );
//         return failedLog;
//       }

//       // 3️⃣ Create PENDING transaction log
//       const pendingLog = await TransactionLogRepo.create(
//         {
//           senderId: fromWalletId,
//           recepientId: toWalletId,
//           amount,
//           status: "PENDING",
//           idempotencyKey: idempotencyKey,
//         },
//         t
//       );

//       // 4️⃣ Update balances
//       await WalletRepo.updateBalance(fromWalletId, fromWallet.balance - amount, t);
//       await WalletRepo.updateBalance(toWalletId, toWallet.balance + amount, t);

//       // 5️⃣ Mark log as SUCCESS
//       await TransactionLogRepo.updateStatus(pendingLog.id, "SUCCESS", t);

//       return pendingLog;
//     });
//   },
// };



// import { sequelize } from "../config/database";
// import { WalletRepo } from "../repository/wallets.repo";
// import { TransactionLogRepo } from "../repository/transactionLog.repo";
// import { IdempotencyRepo } from "../repository/redis.repo";

// interface TransferInput {
//   fromWalletId: string;
//   toWalletId: string;
//   amount: number;
//   idempotencyKey: string;
// }

// export const TransferService = {
//   async transfer(input: TransferInput) {
//     const { fromWalletId, toWalletId, amount, idempotencyKey } = input;

//     // ✅ 1) Check Redis first (fast path)
//     const cached = await IdempotencyRepo.get(idempotencyKey);
//     if (cached?.transactionLogId) {
//       const tx = await TransactionLogRepo.findById(cached.transactionLogId);
//       if (tx) return tx;
//     }

//     // ✅ 2) DB-level idempotency (safe path)
//     try {
//       const result = await sequelize.transaction(async (t) => {
//         // Create PENDING log FIRST (as required by test)
//         const pendingLog = await TransactionLogRepo.create(
//           {
//             idempotencyKey,
//             senderId: fromWalletId,
//             recepientId: toWalletId,
//             amount,
//             status: "PENDING",
//           },
//           t
//         );

//         // Lock wallets to prevent double spend
//         const fromWallet = await WalletRepo.findById(fromWalletId, t);
//         const toWallet = await WalletRepo.findById(toWalletId, t);

//         if (!fromWallet || !toWallet) {
//           await TransactionLogRepo.markFailed(pendingLog.id, "Wallet not found", t);
//           return pendingLog;
//         }

//         if (Number(fromWallet.balance) < amount) {
//           await TransactionLogRepo.markFailed(
//             pendingLog.id,
//             "Insufficient balance",
//             t
//           );
//           return pendingLog;
//         }

//         // Update balances
//         await WalletRepo.updateBalance(fromWalletId, Number(fromWallet.balance) - amount, t);
//         await WalletRepo.updateBalance(toWalletId, Number(toWallet.balance) + amount, t);

//         // Mark SUCCESS
//         await TransactionLogRepo.updateStatus(pendingLog.id, "SUCCESS", t);



//         return pendingLog;
//       });

//       // ✅ 3) Cache result in Redis
//       await IdempotencyRepo.set(idempotencyKey, {
//         transactionLogId: result.id,
//         status: result.status,
//       });

//       return result;
//     } catch (err: any) {
//       // ✅ If duplicate key error happens, it means another request already created it
//       if (err?.name === "SequelizeUniqueConstraintError") {
//         const existing = await TransactionLogRepo.findByIdempotencyKey(idempotencyKey);

//         if (existing) {
//           await IdempotencyRepo.set(idempotencyKey, {
//             transactionLogId: existing.id,
//             status: existing.status,
//           });
//           return existing;
//         }
//       }

//       throw err;
//     }
//   },
// };


// import { sequelize } from "../config/database";
// import { WalletRepo } from "../repository/wallets.repo";
// import { TransactionLogRepo } from "../repository/transactionLog.repo";
// import { IdempotencyRepo } from "../repository/redis.repo";

// interface TransferInput {
//   fromWalletId: string;
//   toWalletId: string;
//   amount: number;
//   idempotencyKey: string;
// }

// export const TransferService = {
//   async transfer(input: TransferInput) {
//     const { fromWalletId, toWalletId, amount, idempotencyKey } = input;

//     // 1️⃣ Fast path: check Redis first
//     const cached = await IdempotencyRepo.get(idempotencyKey);
//     if (cached?.transactionLogId) {
//       const tx = await TransactionLogRepo.findById(cached.transactionLogId);
//       if (tx) return tx;
//     }

//     // 2️⃣ Safe path: DB-level transaction
//     const result = await sequelize.transaction(async (t) => {
//       // ✅ Create PENDING log first
//       const pendingLog = await TransactionLogRepo.create(
//         {
//           idempotencyKey,
//           senderId: fromWalletId,
//           recepientId: toWalletId,
//           amount,
//           status: "PENDING",
//         },
//         t
//       );

//       // ✅ Lock wallets
//       const fromWallet = await WalletRepo.findById(fromWalletId, t);
//       const toWallet = await WalletRepo.findById(toWalletId, t);

//       if (!fromWallet || !toWallet) {
//         await TransactionLogRepo.markFailed(pendingLog.id, "Wallet not found", t);
//         return await TransactionLogRepo.findById(pendingLog.id, t);
//       }

//       if (Number(fromWallet.balance) < amount) {
//         await TransactionLogRepo.markFailed(pendingLog.id, "Insufficient balance", t);
//         return await TransactionLogRepo.findById(pendingLog.id, t);
//       }

//       // ✅ Update balances
//       await WalletRepo.updateBalance(fromWalletId, Number(fromWallet.balance) - amount, t);
//       await WalletRepo.updateBalance(toWalletId, Number(toWallet.balance) + amount, t);

//       // ✅ Update log to SUCCESS
//       await TransactionLogRepo.updateStatus(pendingLog.id, "SUCCESS", t);

//       // ⚡ Fetch fresh log so status is up-to-date
//       const updatedLog = await TransactionLogRepo.findById(pendingLog.id, t);
//       return updatedLog;
//     });
// if (!result) throw new Error("Transaction log was not created");

//     // 3️⃣ Cache result in Redis
//     await IdempotencyRepo.set(idempotencyKey, {
//       transactionLogId: result.id,
//       status: result.status,
//     });

//     return result;
//   },
// };


import { sequelize } from "../config/database";
import { WalletRepo } from "../repository/wallets.repo";
import { TransactionLogRepo } from "../repository/transactionLog.repo";
import { IdempotencyRepo } from "../repository/redis.repo";

interface TransferInput {
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  idempotencyKey: string;
}

export const TransferService = {
  async transfer(input: TransferInput) {
    const { fromWalletId, toWalletId, amount, idempotencyKey } = input;

    // 1️⃣ Fast path: check Redis first
    const cached = await IdempotencyRepo.get(idempotencyKey);
    if (cached?.transactionLogId) {
      const tx = await TransactionLogRepo.findById(cached.transactionLogId);
      if (tx) return tx;
    }

    // 2️⃣ Safe path: DB-level transaction
    const result = await sequelize.transaction(async (t) => {
      // ✅ Try to create a PENDING log first
      let pendingLog;
      try {
        pendingLog = await TransactionLogRepo.create(
          {
            idempotencyKey,
            senderId: fromWalletId,
            recepientId: toWalletId,
            amount,
            status: "PENDING",
          },
          t
        );
      } catch (err: any) {
        if (err?.name === "SequelizeUniqueConstraintError") {
          // idempotency key already exists → fetch existing log
          const existing = await TransactionLogRepo.findByIdempotencyKey(
            idempotencyKey
          );
          if (!existing)
            throw new Error(
              "Idempotency key exists but transaction log not found"
            );
          pendingLog = existing;

          // If this log is already SUCCESS or FAILED, return early
          if (pendingLog.status !== "PENDING") return pendingLog;
        } else {
          throw err;
        }
      }

      // ✅ Lock wallets
      const fromWallet = await WalletRepo.findById(fromWalletId, t);
      const toWallet = await WalletRepo.findById(toWalletId, t);

      if (!fromWallet || !toWallet) {
        await TransactionLogRepo.markFailed(
          pendingLog.id,
          "Wallet not found",
          t
        );
        return pendingLog;
      }

      if (Number(fromWallet.balance) < amount) {
        await TransactionLogRepo.markFailed(
          pendingLog.id,
          "Insufficient balance",
          t
        );
        return pendingLog;
      }

      // ✅ Update balances
      await WalletRepo.updateBalance(
        fromWalletId,
        Number(fromWallet.balance) - amount,
        t
      );
      await WalletRepo.updateBalance(
        toWalletId,
        Number(toWallet.balance) + amount,
        t
      );



      // ✅ Mark SUCCESS
      await TransactionLogRepo.updateStatus(pendingLog.id, "SUCCESS", t);

      // ⚡ Fetch fresh log so status is up-to-date
      const updatedLog = await TransactionLogRepo.findById(pendingLog.id, t);
      return updatedLog!;
    });

    // 3️⃣ Cache result in Redis
    await IdempotencyRepo.set(idempotencyKey, {
      transactionLogId: result.id,
      status: result.status,
    });

    return result;
  },
};
