const couponModel = require("../model/couponModel")
const cartModel = require("../model/cartModel")
const Coupon = require("../model/couponModel")
const orderModel = require("../model/orderModel")

const loadCoupon = async(req, res)=>{
    try {
        const itemsPerPage = 10;
        const currentPage = parseInt(req.query.page) || 1;
        const coupon = await couponModel.find({})

        const totalcoupon = coupon.length;
        const totalPages = Math.ceil(totalcoupon / itemsPerPage);

        // Slice the product offer data based on pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = currentPage * itemsPerPage;
        const couponPerPage = coupon.slice(startIndex, endIndex);
        res.render('coupon',{coupon:couponPerPage,currentPage, totalPages})
    } catch (error) {
        console.log(error.message)
    }
}

const loadCreateCoupon = async(req, res)=>{
    try { 
        res.render('createCoupon')
    } catch (error) {
        console.log(error.message)
    }
}

const createCoupon = async(req, res)=>{
    try {
        const { name,
                code,
                description,
                discountPercentage,
                minPurchaseAmount,
                maxPurchaseAmount,
                expirationDate,
                maxUsers } = req.body

        const createCoupon = new Coupon({
                name:name,
                code:code,
                description:description,
                minimumAmount:minPurchaseAmount,
                maximumAmount:maxPurchaseAmount,
                discountPercentage:discountPercentage,
                expirationDate:expirationDate,
                maxUsers:maxUsers
        })
        await createCoupon.save()
        res.status(200).send({success:true,message:"Coupon created successfully"})
    } catch (error) {
        console.log(error.message)
    }
}


const toggleCoupon = async(req, res)=>{
    try { 
        const { couponId, isActive } = req.body
        const updateCoupon = await couponModel.findByIdAndUpdate(couponId,{isActive:isActive})
        updateCoupon.save();
        res.status(200).json({success:true,message:"Coupon status toggled successfully."})
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to toggle coupon status." });
    }
}

const applyCoupon = async(req, res)=>{
    try {
        const userCart = await cartModel.findOne({owner:req.session.userid});
        if(!userCart || !userCart.items.length){
            return res.status(400).json({success:false, message:"Your cart is empty and cannot add Coupon"});
        }
        if(userCart.isApplied){
            return res.status(400).json({success:false, message:"A coupon is already applied to your cart"});
        }

        const coupon = await couponModel.findOne({code: req.body.coupon, isActive: true});
        if(!coupon){
            return res.status(400).json({success:false, message:"Coupon not found"});
        }

        const userId = req.session.userid.toString();
        if(coupon.usersUsed.includes(userId)){
            return res.status(400).json({success:false, message:"Coupon already used"});
        }

        if(userCart.billTotal < coupon.minimumAmount){
            return res.status(400).json({success:false, message:"You are not eligible for this coupon code"});
        }

        if (coupon.maxUsers > 0) {
        const discountAmount = Math.round(userCart.billTotal * (coupon.discountPercentage / 100));
        userCart.billTotal -= Math.round(discountAmount);
        userCart.coupon = req.body.coupon;
        userCart.isApplied = true;

        await userCart.save();

        coupon.maxUsers -=1
        await coupon.save();
        res.status(200).json({success:true, message: "Coupon applied successfully"});
    } else {
        console.log('Coupon is no longer valid.');
        res.status(400).send('Coupon is no longer valid.');
    }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({success:false, message: "Server error"});
    }
}

const removeCoupon = async(req, res)=>{
    try {
        const userCart = await cartModel.findOne({owner: req.session.userid});
        if (!userCart || !userCart.isApplied) {
            return res.status(400).json({success:false, message: "No coupon is applied to your cart."});
        }

        const coupon = await couponModel.findOne({code: req.body.coupon});
        if(!coupon){
            return res.status(400).json({success:false, message: "Coupon not found"});
        }

        userCart.billTotal /= Math.round(1 - (coupon.discountPercentage / 100));
        userCart.coupon = null;
        userCart.isApplied = false;
        await userCart.save();

        coupon.maxUsers +=1
        await coupon.save();

        res.status(200).json({success:true, message: "Removed coupon successfully"});
    } catch (error) {
        console.log("Error while removing the coupon", error.message);
        res.status(500).json({success:false, message: "Server error"});
    }
}



module.exports = {
    loadCoupon,
    loadCreateCoupon,
    createCoupon,
    toggleCoupon,
    applyCoupon,
    removeCoupon
}