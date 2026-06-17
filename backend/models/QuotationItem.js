// models/QuotationItem.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const QuotationItem = sequelize.define(
    'QuotationItem',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      quotationId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      productId: {
        type: DataTypes.UUID,
        allowNull: true,
      },

      description: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },

      hsnCode: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },

      quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1,
      },

      unit: {
        type: DataTypes.STRING(50),
        defaultValue: 'Nos',
      },

      unitPrice: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },

      gstRate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 18,
      },

      gstAmount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },

      discount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },

      totalPrice: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },

      sortOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      tableName: 'quotation_items',
      paranoid: false,
    }
  );

  return QuotationItem;
};