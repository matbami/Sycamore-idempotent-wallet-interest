import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface TransactionLogAttributes {
  id: string;
  idempotencyKey: string;
  senderId: string;
  recipientId: string;
  amount: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  failureReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

//Optional fields when creating a new TransactionLog
export interface TransactionLogCreationAttributes extends Optional<
  TransactionLogAttributes,
  "id" | "failureReason"
> {}

export class TransactionLog
  extends Model<TransactionLogAttributes, TransactionLogCreationAttributes>
  implements TransactionLogAttributes
{
  declare id: string;
  declare idempotencyKey: string;
  declare senderId: string;
  declare recipientId: string;
  declare amount: string;
  declare status: "PENDING" | "SUCCESS" | "FAILED";
  declare failureReason?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

TransactionLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    idempotencyKey: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "idempotencyKey",
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "senderId",
    },
    recipientId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "recipientId",
    },
    amount: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("PENDING", "SUCCESS", "FAILED"),
      allowNull: false,
      defaultValue: "PENDING",
    },
    failureReason: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "failureReason",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "createdAt",
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "updatedAt",
    },
  },
  {
    sequelize,
    modelName: "TransactionLog",
    tableName: "transaction_logs",
  },
);
