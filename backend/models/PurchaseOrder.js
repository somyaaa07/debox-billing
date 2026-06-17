import { DataTypes } from "sequelize";

export default (sequelize) => {
    const PurchaseOrder = sequelize.define(
        'PurchaseOrder', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        poNumber: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
        internalPoNumber: {
            type: DataTypes.STRING(20),
            allowNull: true
        },
        clientId: {
            type: DataTypes.UUID,
            allowNull: false
        },
        quotationId: {
            type: DataTypes.UUID,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM(
                'pending',
                'approved',
                'rejected',
                'converted',
                'completed'
            ),
            defaultValue: 'pending'
        },
        poDate: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        delivertDate: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        subtotal: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0
        },
        gstAmount: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0
        },
        totalAmount: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0
        },
        currency: {
            type: DataTypes.STRING(20),
            defaultValue: 'INR'
        },
        attachmentPath: {
            type: DataTypes.STRING(200),
            allowNull: true
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        approvedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        convertedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        isManual: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    },
        {
            tableName: 'purchase_orders',
            paranoid: true
        }
    );
    return PurchaseOrder;
};