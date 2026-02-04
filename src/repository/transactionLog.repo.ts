import { TransactionLog, TransactionLogCreationAttributes } from "../models/transactionlog";
import { Transaction } from "sequelize";

export const TransactionLogRepo = {
  async create(log: TransactionLogCreationAttributes, t?: Transaction) {
    return TransactionLog.create(log, { transaction: t });
  },

async findById(id: string, t?: Transaction) {
    return TransactionLog.findByPk(id, { transaction: t });
  },


  async findByIdempotencyKey(key: string) {
    return TransactionLog.findOne({ where: { idempotencyKey: key } });
  },

  async updateStatus(id: string, status: "SUCCESS" | "FAILED", t: Transaction) {
    return TransactionLog.update({ status }, { where: { id }, transaction: t });
  },

  async markFailed(id: string, reason: string, t: Transaction) {
    return TransactionLog.update(
      { status: "FAILED", failureReason: reason },
      { where: { id }, transaction: t }
    );
  },
};
