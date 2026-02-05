import { InterestService } from '../src/services/interest.service';
import { Wallet } from '../src/models/wallets';
import { InterestLedger } from '../src/models/interestLedger';
import { resetDb } from './helpers/db';
import { seedWallets } from './helpers/seed';

describe('InterestService Simplified', () => {
  let walletId: string;

  beforeEach(async () => {
    await resetDb();
    const wallets = await seedWallets();
    walletId = wallets.sender.id;
    
    // Set a clean balance for easy testing: 100,000
    // Interest = (100,000 * 0.275) / 365 = 75.3424...
    await Wallet.update({ balance: "100000" }, { where: { id: walletId } });
  });

  it('accrues interest for a normal year', async () => {
    // 1. Arrange: Fix the date
    jest.useFakeTimers().setSystemTime(new Date('2025-01-01'));

    // 2. Act: Run the service
    await InterestService.accrueDailyInterest(walletId);

    // 3. Assert: Check Wallet & Ledger
    const wallet = await Wallet.findByPk(walletId);
    const ledger = await InterestLedger.findOne({ where: { walletId } });

    // We expect roughly 75.34 (100k * 0.275 / 365)
    // Convert to Number and round to 2 decimals to keep it simple
    expect(Number(wallet?.accruedInterest).toFixed(2)).toBe("75.34");
    expect(Number(ledger?.interestAmount).toFixed(2)).toBe("75.34");

    jest.useRealTimers();
  });

  it('accrues interest for a leap year', async () => {
    // 1. Arrange: Fix the date to a leap year
    jest.useFakeTimers().setSystemTime(new Date('2024-02-29'));

    // 2. Act
    await InterestService.accrueDailyInterest(walletId);

    // 3. Assert
    const wallet = await Wallet.findByPk(walletId);
    // (100k * 0.275 / 366) = 75.136...
    expect(Number(wallet?.accruedInterest).toFixed(2)).toBe("75.14");

    jest.useRealTimers();
  });

  it('fails if wallet ID is missing', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    await expect(InterestService.accrueDailyInterest(fakeId))
      .rejects.toThrow('Wallet not found');
  });
});