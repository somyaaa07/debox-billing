import { DataTypes } from "sequelize";

export default (sequelize)=>{
    const Product = sequelize.define(
        'Product',
        {
            id:{
                type:DataTypes.UUID,
                defaultValue:DataTypes.UUIDV4,
                primaryKey:true
                
            },
            name:{
                type:DataTypes.STRING(200),
                allowNull:false
            },
            description:{
                type:DataTypes.STRING(200),
                allowNull:true
            },
            sku:{
                type:DataTypes.STRING(200),
                allowNull:true,
                defaultValue:0
            },
            unit:{
                type:DataTypes.STRING(50),
                defaultValue:'Nos'
            },
            price:{
                type:DataTypes.DECIMAL(15,2),
                allowNull:false,
                defaultValue:0
            },
            gstRate:{
                type:DataTypes.DECIMAL(5,2),
                defaultValue:18
            },
            hsnCode:{
                type:DataTypes.STRING(20),
                allowNull:true
            },
            isActive:{
                type:DataTypes.BOOLEAN,
                defaultValue:true
            }
        },
        {
            tableName:'products',
            paranoid:true
        }
    );
    return Product
};