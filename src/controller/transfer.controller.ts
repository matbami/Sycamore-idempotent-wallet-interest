import { Request, Response } from "express";
import { TransferService } from "../services/transfer.service";

export const transferController = async (req: Request, res: Response) => {
  try {
    const transaction = await TransferService.transfer(req.body);
    return res.status(200).json(transaction);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
