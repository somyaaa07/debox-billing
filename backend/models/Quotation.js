import {DataTypes} from 'sequelize'
const QuotationModel = (sequelize)=>{
   const Quotation = sequelize.define(
     'Quotation',{
        id:{
            type:DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey:true,
        },
        quotationNumber:{
            type:DataTypes.STRING(50),
            allowNull:true,
            unique:true,
        },
        clientId:{
            type:DataTypes.UUID,
            allowNull:false,
        },
        status:{
            type:DataTypes.ENUM(
                'draft',
                'sent',
                'approved',
                'rejected',
            ),
            defaultValue:'draft',
        },
        quotationDate:{
            type:DataTypes.DATEONLY,
            allowNull:false,
        },
        validUntil:{
            type:DataTypes.DATEONLY,
            allowNull:true,
        },
        subTotal:{
            type:DataTypes.DECIMAL(15,2),
            defaultValue:0,
        },
        getAmount:{
            type:DataTypes.DECIMAL(15,2),
            defaultValue:0,
        },
        discount:{
            type:DataTypes.DECIMAL(15,2),
            defaultValue:0,
        },
        totalAmount:{
            type:DataTypes.DECIMAL(15,2),
            defaultValue:0,
        },
        currency:{
            type:DataTypes.STRING(10),
            defaultValue:'INR',
        },
        notes:{
            type:DataTypes.TEXT,
            allowNull:true,
        },
        termAndConditions:{
          type:DataTypes.TEXT,
            allowNull:true,
        },
        approvedAt:{
            type:DataTypes.DATE,
            allowNull:true,
        },
        sendAt:{
            type:DataTypes.DATE,
            allowNull:true,
        },

    },
    {
        tableName:'quotations',
        paranoid:true,
    },

   );
   return Quotation;
}
export default QuotationModel;