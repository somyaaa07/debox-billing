import {DataTypes} from 'sequelize';
import bcrypt from 'bcryptjs';

const UserModel =(sequelize)=>{
    const User =  sequelize.define(
        'User',{
        id:{
            type:DataTypes.UUID,
            defaultValue: DataTypes.UUID4,
            primaryKey:true,
        },
        name:{
            type:DataTypes.STRING(150),
            allowNull:false,
        },
        email:{
            type:DataTypes.STRING(100),
            allowNull:false,
            unique:true,
            validate:{
                isEmail:true,
            },
        },
        isActive:{
            type:DataTypes.BOOLEAN,
            defaultValue:true
        },
        password:{
            type:DataTypes.STRING(100),
            allowNull:false,
        },
        resetPasswordToken:{
            type:DataTypes.STRING(255),
            allowNull:true,
        },
        resetPasswordExpires:{
            type:DataTypes.DATE(),
            allowNull:true,
        },
        lastLogin:{
            type:DataTypes.DATE(),
            allowNull:true,
        },
    },

   {
      tableName: 'users',
      paranoid: true,

      hooks: {
        beforeCreate: async (user) => {
          user.password =
            await bcrypt.hash(user.password, 12);
        },

        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            user.password =
              await bcrypt.hash(user.password, 12);
          }
        },
      },
    },
 )
    
User.prototype.validatePassword =
    async function (password) {
      return bcrypt.compare(
        password,
        this.password
      );
    };

  User.prototype.toSafeObject =
    function () {
      const {
        password,
        resetPasswordToken,
        resetPasswordExpires,
        ...safe
      } = this.toJSON();

      return safe;
    };

  return User;
};

export default UserModel;