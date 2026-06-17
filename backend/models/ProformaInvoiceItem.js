import { DataTypes, UUIDV4 } from "sequelize";

const ProformaInvoiceItem = (sequelize) => {
    return sequelize.define(
        'ProformaInvoiceItem', {
            id: {
                type: DataTypes.UUID,
                defaultValue: UUIDV4,
                primaryKey: true,
            },
            proformaInvoiceId: {              // FIX 1: ProformaInvoiceId -> proformaInvoiceId (matches association)
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
                type: DataTypes.STRING(20),
                defaultValue: 'Nos',
            },
            unitPrice: {
                type: DataTypes.DECIMAL(15, 2),
                allowNull: false,
            },
            gstRate: {
                type: DataTypes.DECIMAL(5, 2),
                defaultValue: 18,             // FIX 2: dafaultValue -> defaultValue
            },
            cgstAmount: {
                type: DataTypes.DECIMAL(15, 2),
                defaultValue: 0,
            },
            sgstAmount: {
                type: DataTypes.DECIMAL(15, 2),
                defaultValue: 0,              // FIX 3: defaulValue -> defaultValue
            },
            igstAmount: {                     // FIX 4: isgstAmount -> igstAmount
                type: DataTypes.DECIMAL(15, 2),
                defaultValue: 0,              // FIX 5: dafaultValue -> defaultValue
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
            tableName: 'proforma_invoice_items',
            paranoid: false,
        }
    );
};

export default ProformaInvoiceItem;