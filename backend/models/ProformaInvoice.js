import { DataTypes, UUIDV4 } from "sequelize";

export default(sequelize)=>{
    const ProformaInvoice = sequelize.define(
        'ProformaInvoice',{
            id:{
                type:DataTypes.UUID,
                defaultValue:DataTypes.UUIDV4,
                primaryKey:true
            },
            piNumber:{
                type:DataTypes.STRING(50),
                allowNull:false,
                unique:true
            },
            clientId:{
                type:DataTypes.UUID,
                allowNull:false
            },
            purchaseOrderId:{
                type:DataTypes.UUID,
                allowNull:true
            },
            status:{
                type:DataTypes.ENUM(
                    'draft',
                    'sent',
                    'approved',
                    'partially_paid',
                    'converted'
                ),

            defaultValue:'draft'
            },
            piDate:{
                type:DataTypes.DATEONLY,
                allowNull:false
            },
            validUntil:{
                type:DataTypes.DATEONLY,
                allowNull:false
            },
        
           subtotal: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },

      gstAmount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },

      cgst: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },

      sgst: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },

      igst: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },

      discount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },

      totalAmount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },

      advancePaid: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },

      dueAmount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },

      currency: {
        type: DataTypes.STRING(10),
        defaultValue: 'INR',
      },

      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      termsAndConditions: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      sentAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      convertedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
        },
        {
            tableName:'proforma_invoices',
            paranoid:true
        }
    );
    return ProformaInvoice;
}