import Big from "big.js";
import { sequelize } from "../config/database";
import { Wallet } from "../models/wallets";
import { InterestLedger } from "../models/interestLedger";

const ANNUAL_RATE = 0.275;

const isLeapYear = (year: number) => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

//this handles the leap year constraint
const getDaysInYear = (date: Date) => {
  return isLeapYear(date.getFullYear()) ? 366 : 365;
};

export const InterestService = {
  async accrueDailyInterest(walletId: string) {
    return sequelize.transaction(async (t) => {
      const wallet = await Wallet.findByPk(walletId, { transaction: t });

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      const today = new Date();
      const daysInYear = getDaysInYear(today);

      //Calculate simple interest using Principal (balance) * Rate * Time (1 day = 1/365 or 1/366)
      const dailyInterest = new Big(wallet.balance)
        .times(ANNUAL_RATE)
        .div(daysInYear)
        .round(4, Big.roundDown)

      // Update wallet accrued interest
      const newTotalAccrued = new Big(wallet.accruedInterest).plus(
        dailyInterest
      );

      wallet.accruedInterest = newTotalAccrued.toFixed(2);
      await wallet.save({ transaction: t });

      // Create interest ledger record
      await InterestLedger.create(
        {
          walletId: wallet.id,
          interestAmount: dailyInterest.toFixed(10),
          rateUsed: ANNUAL_RATE.toString(),
          accruedOn: today,
        },
        { transaction: t }
      );

      return {
        walletId: wallet.id,
        dailyInterest: dailyInterest.toFixed(10),
        totalAccruedInterest: wallet.accruedInterest,
        rateUsed: ANNUAL_RATE,
        daysInYear,
        date: today,
      };
    });
  },
};
