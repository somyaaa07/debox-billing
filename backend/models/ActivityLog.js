import {DataTypes} from 'sequelize'

const ActivityLogModel = (Sequelize)=>{
    return Sequelize.define(
        'ActivityLog',{
            id:{
                type:DataTypes.UUID,
                defaultValue:DataTypes.UUIDV4,
                primaryKey:true,
            },
            userId:{
                type:DataTypes.UUID,
                allowNull:true,
            },
            action:{
                type:DataTypes.STRING(200),
                allowNull:false,
            },
            module:{
                type:DataTypes.STRING(50),
                allowNull:false,
            },
            moduleId:{
                type:DataTypes.UUID,
                allowNull:true,
            },
            description:{
                type:DataTypes.TEXT,
                allowNull:true,
            },
            ipAddress:{
                type:DataTypes.STRING(50),
                allowNull:true
            },
            userAgent:{
                type:DataTypes.STRING(500),
                allowNull:true,
            },
            metaData:{
                type:DataTypes.JSON,
                allowNull:true,
            },
        },
        {
            tableName:'activity_logs',
            paranoid:false,
        }
    );
    
}
export default ActivityLogModel