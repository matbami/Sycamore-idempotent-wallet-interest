import { Router } from "express";
import { transferController } from "../controller/transfer.controller";
import { validate } from "../middlewares/validate";
import { transferSchema } from "../validators/transfer.validator";

const router = Router();

router.post("/transfer", validate(transferSchema), transferController);

export default router;
