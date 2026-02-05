import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class InterestLedger extends Model {
  declare id: string;
  declare walletId: string;
  declare accruedOn: Date;

  // DECIMAL values are returned as strings to preserve precision
  declare interestAmount: string;
  declare rateUsed: string;

  declare createdAt: Date;
  declare updatedAt: Date;
}

InterestLedger.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    walletId: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    accruedOn: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    interestAmount: {
      type: DataTypes.DECIMAL(20, 4),
      allowNull: false,
    },

    rateUsed: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: "27.50",
    },

    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "interest_ledger",
    modelName: "InterestLedger",
  },
);
