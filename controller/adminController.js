const adminModel = require('../model/userModel')
const cartModel = require('../model/cartModel')
const userModel = require('../model/userModel')
const productModel = require('../model/productModel');
const addressModel = require('../model/addressModel');
const orderModel = require('../model/orderModel');
const bcrypt = require('bcrypt');


// Login and Verify
const loadAdminLogin = async(req, res)=>{
    res.render('adminLogin')
    console.log('req.session.adminid',req.session.adminid);
    console.log('req.session',req.session);

}

const verifyLogin = async(req, res)=>{
    const email = req.body.email
    const password = req.body.password
    const adminData = await adminModel.findOne({email:email,is_admin:1})
    if(adminData){
        const passwordMatch = await bcrypt.compare(password,adminData.password)
        if (passwordMatch) {
            req.session.adminid = adminData._id;
            res.redirect('/admin/dashboard')
        } else {
            res.render('adminLogin',{message : 'Check your Email and Password'})
        }
    }else{
        res.render('adminLogin',{message : 'Check your Email and Password'})
    }
}

const loadDashboard = async(req,res)=>{
    const adminData = await adminModel.findOne({_id:req.session.adminid})

    res.render('adminhome',{username : adminData.name})

}


// block and Unblock User
const loadUserlist = async(req,res)=>{
    try {
       const users = await adminModel.find({is_admin:0})
       if(users){
            res.render('userlist',{users: users})
       }else{
            res.render('userlist',{users: {}})  
       }
    } catch (error) {
        console.log(error.message);
    }
}

const blockUser = async(req,res)=>{
    try {
        const id = req.query.id
        const user = await adminModel.findById(id)
        if(user){
            user.is_Blocked = 1
            user.save()
            res.redirect('/admin/userlist')
        }else{
            console.log('Error While Consoling')
        }
    } catch (error) {
        console.log(error.message);
    }
}
const unBlockUser = async(req,res)=>{
  try {
    const id = req.query.id
    const user = await adminModel.findById(id)
    if(user){
        user.is_Blocked = 0
        user.save()
        res.redirect('/admin/userlist')  
    }else{
        console.log('Error While Consoling')
    }
  } catch (error) {
    console.log(error)
  }
}
  
// Orders Section
const loadOrders = async(req, res)=>{
    try {
        const orderData = await orderModel.find({}).populate('user').sort({orderDate:-1})
        res.render('orders',{order:orderData})
    } catch (error) {
        console.log(error.message);
    }
}


const loadOrderDetails = async(req, res)=>{
    try {
        const order_id = req.query.id
        console.log('orderid...',order_id);
        const orderData = await orderModel.findById(order_id).populate('user')
        
        
        res.render('adminorderdetails',{orders:orderData})
    } catch (error) {
        console.log(error.message);
    }
}

const updateOrder = async(req, res)=>{
    try {
        const {orderId, newStatus}=req.body
        const orderDetails = await orderModel.findOne({oId:orderId})
        if(newStatus === 'Cancelled') {
            for(const item of orderDetails.items){
            const productid = item.productId
            const product = await productModel.findById(productid)
            if(product){
                product.countInStock += item.quantity
                await product.save()
            }
        }
    }

        const updateOrderDetail = await orderModel.findOneAndUpdate({oId:orderId},{
            $set:{ status: newStatus } },
            {new:true})    

            if(!updateOrderDetail){
                return res.status(500).json({ success: false, message: "Failed to update order status" });
            }

            return res.status(200).json({success:true,message:'The order status has been updated successfully',updateOrderDetail})
    } catch (error) {
        console.log(error.message);
    }
}





// Logout
const logout = async(req,res)=>{
    try {
        req.session.destroy()
        res.redirect('/admin')
    } catch (error) {
        console.log(error.message);
    }
}


module.exports = {
    loadAdminLogin,
    verifyLogin,
    loadUserlist,
    blockUser,
    logout,
    unBlockUser,
    loadDashboard,
    loadOrders,
    loadOrderDetails,
    updateOrder
}