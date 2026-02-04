import { Wallet } from "../models/wallets";
import { Transaction } from "sequelize";

export const WalletRepo = {
  async findById(id: string, t?: Transaction) {
    return Wallet.findByPk(id, { transaction: t, lock: t?.LOCK.UPDATE });
  },

  async updateBalance(id: string, newBalance: number, t: Transaction) {
    return Wallet.update(
      { balance: newBalance },
      { where: { id }, transaction: t }
    );
  },
};
