import { InterestService } from "../src/services/interest.service";
import { Wallet } from "../src/models/wallets";
import { InterestLedger } from "../src/models/interestLedger";
import { resetDb } from "./helpers/db";
import { seedWallets } from "./helpers/seed";

describe("InterestService", () => {
  let walletId: string;

  beforeEach(async () => {
    await resetDb();
    const wallets = await seedWallets();
    walletId = wallets.sender.id;

    await Wallet.update({ balance: "100000" }, { where: { id: walletId } });
  });

  it("accrues interest for a normal year", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2025-01-01"));

    await InterestService.accrueDailyInterest(walletId);

    const wallet = await Wallet.findByPk(walletId);
    const ledger = await InterestLedger.findOne({ where: { walletId } });

    expect(Number(wallet?.accruedInterest).toFixed(2)).toBe("75.34");
    expect(Number(ledger?.interestAmount).toFixed(2)).toBe("75.34");

    jest.useRealTimers();
  });

  it("accrues interest for a leap year", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2024-02-29"));

    await InterestService.accrueDailyInterest(walletId);

    const wallet = await Wallet.findByPk(walletId);
    expect(Number(wallet?.accruedInterest).toFixed(2)).toBe("75.14");

    jest.useRealTimers();
  });

  it("fails if wallet ID is missing", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    await expect(InterestService.accrueDailyInterest(fakeId)).rejects.toThrow(
      "Wallet not found",
    );
  });
});
