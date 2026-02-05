import Joi from "joi";

export const transferSchema = Joi.object({
  senderWalletId: Joi.string()
    .uuid()
    .required(),

  recipientWalletId: Joi.string()
    .uuid()
    .required()
    .disallow(Joi.ref("senderWalletId")),

  amount: Joi.string()
    .pattern(/^\d+(\.\d{1,2})?$/)
    .required(),

  idempotencyKey: Joi.string()
    .min(10)
    .max(255)
    .required(),
});
