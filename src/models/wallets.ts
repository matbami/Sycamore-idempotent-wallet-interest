import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface WalletAttributes {
  id: string;
  userId: string;
  balance: number; // stored in kobo as BIGINT
  currency: string;
  // status: "ACTIVE" | "SUSPENDED";
  createdAt?: Date;
  updatedAt?: Date;
}

// Optional fields when creating a Wallet
interface WalletCreationAttributes
  extends Optional<WalletAttributes, "id" | "currency"> {}

export class Wallet extends Model<WalletAttributes, WalletCreationAttributes>
  implements WalletAttributes {
  declare id: string;
  declare userId: string;
  declare balance: number;
  declare currency: string;
  // declare status: "ACTIVE" | "SUSPENDED";
  declare createdAt: Date;
  declare updatedAt: Date;
}

Wallet.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: "userId",
    },
    balance: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: "NGN",
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
    modelName: "Wallet",
    tableName: "wallets",
    underscored: true,
  }
);
