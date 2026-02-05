import { Wallet } from "../../src/models/wallets";

export const seedWallets = async () => {
  const sender = await Wallet.create({
    id: "3a7c6c2c-8a4f-4c1b-9c4b-3e6e2d3f3c01",
    userId: "e7c8a0a0-7a11-4db2-a6c2-6dba9dfbb111",
    currency: "NGN",
    balance: "500000",
    accruedInterest: "0.00",
  } as any);

  const receiver = await Wallet.create({
    id: "cfd2f4d1-7c90-4b1d-9d8a-3f0d7e1a2222",
    userId: "b1b2c3d4-1111-2222-3333-444455556666",
    currency: "NGN",
    balance: "200000",
        accruedInterest: "0.00",

  } as any);

  return { sender, receiver };
};
