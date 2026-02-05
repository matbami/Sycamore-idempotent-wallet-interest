import { Wallet } from "../models/wallets";
import { Transaction } from "sequelize";

export const WalletRepo = {
  async findById(id: string, t?: Transaction) {
    // LOCK.UPDATE is crucial for "Double Spend" requirement
    return Wallet.findByPk(id, {
      transaction: t,
      lock: t ? t.LOCK.UPDATE : false,
    });
  },

  async updateBalance(id: string, newBalance: string, t: Transaction) {
    return Wallet.update(
      { balance: newBalance },
      { where: { id }, transaction: t },
    );
  },
};
