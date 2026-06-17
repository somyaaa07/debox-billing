import { DataTypes } from "sequelize";

const PurchaseOrderItemModel = (sequelize) => {
  const PurchaseOrderItem = sequelize.define(
    "PurchaseOrderItem",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      purchaseOrderId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      productId: {
        type: DataTypes.UUID,
        allowNull: true,
      },

      description: {
        type: DataTypes.STRING(200),
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
        defaultValue: "Nos",
      },

      unitPrice: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },

      gstRate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
      },

      gstAmount: {
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
      tableName: "purchase_order_items",
      paranoid: false,
    }
  );

  return PurchaseOrderItem;
};

export default PurchaseOrderItemModel;