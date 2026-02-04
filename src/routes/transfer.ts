import { Router } from "express";
import { transferController } from "../controller/transfer.controller";

const router = Router();

router.post("/transfer", transferController);

export default router;
