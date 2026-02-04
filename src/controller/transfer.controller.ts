import { Request, Response } from "express";
import { TransferService } from "../services/transfer.service";

export const transferController = async (req: Request, res: Response) => {
  try {
    const { fromWalletId, toWalletId, amount, idempotencyKey } = req.body;

    if (!fromWalletId || !toWalletId || !amount || !idempotencyKey) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const transaction = await TransferService.transfer({
      fromWalletId,
      toWalletId,
      amount,
      idempotencyKey,
    });

    return res.status(200).json(transaction);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
