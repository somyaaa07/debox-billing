import { DataTypes } from "sequelize";

const Payment =(Sequelize)=>{
    return Sequelize.define(
        'Payment',{
            id:{
                type:DataTypes.UUID,
                defaultValue:DataTypes.UUIDV4,
                primaryKey:true,
            },
            paymentNumber:{
                type:DataTypes.STRING(50),
                allowNull:false,
                unique:true,
            },
            clientId:{
                type:DataTypes.UUID,
                allowNull:false,
            },
            finalInvoiceId:{
              type:DataTypes.UUID,
              allowNull:false,  
            },
            amount:{
                type:DataTypes.DECIMAL(15,2),
                allowNull:false,
            },
            paymentDate:{
                type:DataTypes.DATEONLY,
                allowNull:false,
            },
            paymentMode:{
                type:DataTypes.ENUM(
                        'cash',
                        'upi',
                        'bank_transfer',
                        'credit_card',
                        'cheque',
                        'other'
                ),
                allowNull:false,
            },
            referenceNumber:{
                type:DataTypes.STRING(200),
                allowNull:true,
            },
            bankName:{
                type:DataTypes.STRING(200),
                allowNull:true,
            },
            note:{
                type:DataTypes.TEXT,
                allowNull:true,
            },
            isAdvance:{
                type:DataTypes.BOOLEAN,
                defaultValue:false,
            },
            receiptPath:{
                type:DataTypes.STRING(200),
                allowNull:true,
            },
        },
        {
            tableName:'payments',
            paranoid:true,
        }
    );
    
}

export default Payment
