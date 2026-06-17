import { DataTypes } from "sequelize";

export default(sequelize)=>{
    const FinalInvoiceItem = sequelize.define(
        'FinalInvoiceItem',{
            id:{
                type:DataTypes.UUID,
                defaultValue:DataTypes.UUIDV4,
                primaryKey:true
            },
            finalInvoiceId:{
                type:DataTypes.UUID,
                allowNull:false
            },
            productId:{
                type:DataTypes.UUID,
                allowNull:true
            },
            description:{
                type:DataTypes.STRING(500),
                allowNull:false
            },
            hsnCode:{
                type:DataTypes.STRING(20),
                allowNull:true
            },
            quantity:{
                type:DataTypes.DECIMAL(15,2),
                allowNull:false,
                defaultValue:1
            },
            unit:{
                type:DataTypes.STRING(50),
                defaultValue:'Nos'
            },
            unitPrice:{
                type:DataTypes.DECIMAL(15,2),
                allowNull:false
            },
            gstRate:{
                type:DataTypes.DECIMAL(5,2),
                defaultValue:18
            },
            cgstAmount:{
                type:DataTypes.DECIMAL(15,2),
                defaultValue:0
            },
            sgst:{
                type:DataTypes.DECIMAL(15,2),
                defaultValue:0
            },
            igst:{
                type:DataTypes.DECIMAL(15,2),
                defaultValue:0
            },
            totalPrice:{
                type:DataTypes.DECIMAL(15,2),
                allowNull:false
            },
            sortOrder:{
                type:DataTypes.INTEGER,
                defaultValue:0
            }


        },
        {
            tableName:'final_invoice_items',
            paranoid:true
        }
    )
    return FinalInvoiceItem
}