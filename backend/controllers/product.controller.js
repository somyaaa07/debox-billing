import {Op}  from 'sequelize'
import {Product} from '../models/index.js'
import { paginateResponse } from '../middleware/paginate.js'

//Get Product
export const getProducts= async(req,res,next)=>{
    try{
        const{
            page,limit,offset,search,sortBy,sortOrder
        }= req.pagination;

        const where={};

        if(search){
            where[Op.or] =[
                {
                    name:{
                        [Op.like]:`%${search}%`
                    }
                },
                {
                    sku:{
                        [Op.like]:`%${search}$`
                    },
                }
            ];

        }
        const{ count,rows} = await Product.findAndCountAll({
            where,limit,offset,
            order:[
                [
                    sortBy,sortOrder
                ]
            ]
        });
        res.json({
            success:true,
            ...paginateResponse(
                rows,
                count,
                req.pagination
            )
        });
    }
    catch(error){
        next(error)
    }
}

//Create Product

export const createProduct = async(req,res,next)=>{
    try{
        const product= await Product.create(req.body)
        res.status(201).json({
            success:true,
            message:"product create successfully",
            data:product
        })
    }catch(error){
        next(error)
    }
}

// Update Product

export const updateProduct =async(req,res,next)=>{
    try{
        const product = await Product.findByPk(req.params.id)
        if(!product){
            return res.status(404).json({
                success:false,
                message:"Product not found"
            })
        }
        await product.update(req.body)

        res.json({
            success:true,
            message:"product updated successfully",
            data:product
        })
    }catch(error){
        next(error)
    }
}

//Delete Product
export const deleteProduct = async (req,res,next)=>{
    try{
        const product = await Product.findByPk(req.params.id)
        if(!product){
            return res.status(404).json({
                success:false,
                message:"product not found"
            })
        }
        await product.destroy()

        res.json({
            success:true,
            message:"product deleted successfully"
        })
    }catch(error){
        next(error)
    }
}