import { DataTypes } from "sequelize";

export default (sequelize)=>{
    const Setting = sequelize.define(
        'Setting',{
            id:{
                type:DataTypes.UUID,
                defaultValue:DataTypes.UUIDV4,
                primaryKey:true
                },
            key:{
                type:DataTypes.UUID,
                allowNull:false,
                unique:true
            },
            value:{
                type:DataTypes.TEXT,
                allowNull:true
            },
            type:{
                type:DataTypes.ENUM('string','number','boolean','json'),
                defaultValue:'string'
            },
            group:{
                type:DataTypes.STRING(50),
                defaultValue:'genral'
            },
            label:{
                type:DataTypes.STRING(200),
                allowNull:true
            },

        },
        {
            tableName:'setting',
            paranoid:true
        }
    )
    return Setting
    
}