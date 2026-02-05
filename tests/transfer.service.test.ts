import { TransferService } from "../src/services/transfer.service";
import { resetDb } from "./helpers/db";
import { seedWallets } from "./helpers/seed";
import { Wallet } from "../src/models/wallets";
import { TransactionLog } from "../src/models/transactionLog"

// mock redis for tests 
const mockRedis = new Map(); 

jest.mock("../src/repository/redis.repo", () => ({

IdempotencyRepo: {
    get: jest.fn(async (key) => mockRedis.get(key) || null),
    set: jest.fn(async (key, value) => {
      mockRedis.set(key, value);
      return true;
    }),
  },
}));

describe("TransferService", () => {
  beforeEach(async () => {
    await resetDb();
    await seedWallets();
  });

  it("should transfer successfully, create PENDING log, update balances and write ledgers", async () => {
    const idempotencyKey = "test-key-1";

    const result = await TransferService.transfer({
      senderWalletId: "3a7c6c2c-8a4f-4c1b-9c4b-3e6e2d3f3c01",
      recipientWalletId: "cfd2f4d1-7c90-4b1d-9d8a-3f0d7e1a2222",
      amount: "1000",
      idempotencyKey,
    });

    expect(result.status).toBe("SUCCESS");

    const sender = await Wallet.findByPk("3a7c6c2c-8a4f-4c1b-9c4b-3e6e2d3f3c01");
    const receiver = await Wallet.findByPk("cfd2f4d1-7c90-4b1d-9d8a-3f0d7e1a2222");

    expect(Number(sender?.balance)).toBe(499000);
    expect(Number(receiver?.balance)).toBe(201000);

    const transactionLog = await TransactionLog.findOne({ where: { idempotencyKey } });
    expect(transactionLog).toBeTruthy();
    expect(transactionLog?.status).toBe("SUCCESS");


  });

  it("should enforce idempotency: same key should not double spend", async () => {
    const idempotencyKey = "test-key-2";

    await TransferService.transfer({
      senderWalletId: "3a7c6c2c-8a4f-4c1b-9c4b-3e6e2d3f3c01",
      recipientWalletId: "cfd2f4d1-7c90-4b1d-9d8a-3f0d7e1a2222",
      amount: "1000",
      idempotencyKey,
    });

    await TransferService.transfer({
      senderWalletId: "3a7c6c2c-8a4f-4c1b-9c4b-3e6e2d3f3c01",
      recipientWalletId: "cfd2f4d1-7c90-4b1d-9d8a-3f0d7e1a2222",
      amount: "1000",
      idempotencyKey,
    });

    const sender = await Wallet.findByPk("3a7c6c2c-8a4f-4c1b-9c4b-3e6e2d3f3c01");
    const receiver = await Wallet.findByPk("cfd2f4d1-7c90-4b1d-9d8a-3f0d7e1a2222");

    // only deducted once
    expect(Number(sender?.balance)).toBe(499000);
    expect(Number(receiver?.balance)).toBe(201000);

    const logs = await TransactionLog.findAll({ where: { idempotencyKey } });
    expect(logs.length).toBe(1);


  });

  it("should handle race condition: two parallel transfers should not overspend", async () => {
    const idempotencyKey1 = "race-key-1";
    const idempotencyKey2 = "race-key-2";

    //Sender has 500000,  try to spend 400000 twice concurrently -> only one should succeed
     await Promise.allSettled([
      TransferService.transfer({
        senderWalletId: "3a7c6c2c-8a4f-4c1b-9c4b-3e6e2d3f3c01",
        recipientWalletId: "cfd2f4d1-7c90-4b1d-9d8a-3f0d7e1a2222",
        amount: "400000",
        idempotencyKey: idempotencyKey1,
      }),
      TransferService.transfer({
        senderWalletId: "3a7c6c2c-8a4f-4c1b-9c4b-3e6e2d3f3c01",
        recipientWalletId: "cfd2f4d1-7c90-4b1d-9d8a-3f0d7e1a2222",
        amount: "400000",
        idempotencyKey: idempotencyKey2,
      }),
    ]);

    const sender = await Wallet.findByPk("3a7c6c2c-8a4f-4c1b-9c4b-3e6e2d3f3c01");
    const receiver = await Wallet.findByPk("cfd2f4d1-7c90-4b1d-9d8a-3f0d7e1a2222");

    // Sender should never go negative
    expect(Number(sender?.balance)).toBeGreaterThanOrEqual(0);

    // One success means receiver increased by 400000 once
    // Expected balances: sender=100000, receiver=600000
    // OR if one fails and no other changes.
    expect([100000, 500000]).toContain(Number(sender?.balance));
    expect([600000, 200000]).toContain(Number(receiver?.balance));
  });
});
