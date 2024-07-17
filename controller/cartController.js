const cartModel = require('../model/cartModel')
const userModel = require('../model/userModel')
const productModel = require('../model/productModel');
const wishlistModel = require('../model/wishlistModel')
const couponModel = require('../model/couponModel')
const { text } = require('body-parser');
const { Schema } = require('mongoose');
const productOfferModel = require('../model/productOfferModel');
const categoryOfferModel = require('../model/categoryOfferModel')

const addProduct = async(req,res)=>{
    try {
        
        const productId = req.body.productId
        var product = await productModel.findById({_id:productId})

        if(product.countInStock === 0){
            return res.status(408).json({ success: false, message: 'Out of stock' });
        }

        const existingCart = await cartModel.findOne({owner:req.session.userid})
        if (!existingCart) {
            const insertCart = new cartModel({
                owner:req.session.userid,
                items:[{
                ProductId:productId,
                quantity:1,
                price:product.price,
                }]
            })
            await insertCart.save();
        } else {
            let productExistsInCart = false;
            existingCart.items.forEach(item=>{
                if (item.ProductId == productId) {
                item.quantity+=1
                productExistsInCart = true
            }})
            if (!productExistsInCart) {
            existingCart.items.push({
                ProductId:productId,
                quantity:1,
                price:product.price,
            })}

            await existingCart.save()
        }
        return res.status(200).json({message:text})
        
    } catch (error) {
        console.log(error.message);
    }
}

const loadCart = async (req, res) => {
    try {
        const product = await productModel.find();
        const currentDate = new Date();
        let cartdata = await cartModel.findOne({ owner: req.session.userid }).populate({ path: 'items.ProductId', model: 'Product' });
        const cDiscount = cartdata.coupon
        const allCoupon =  await couponModel.find({expirationDate: { $gt: currentDate },isActive:true})
        const coupon = await couponModel.findOne({code:cDiscount})
        let couponDiscount = coupon?coupon.discountPercentage:0

    
        if (cartdata) {
            let total = 0;
            for(let i = 0; i< cartdata.items.length ; i++){

                let proOffer = await productOfferModel.aggregate([
                    {
                      $match: {
                        'productOffer.product': cartdata.items[i].ProductId._id,
                        'productOffer.offerStatus': true,
                        startingDate: { $lte: new Date() },
                        endingDate: { $gte: new Date() }
                      }
                    },
                    {
                      $group: {
                        _id: null,
                        totalDiscount: { $sum: "$productOffer.discount" }
                      }
                    }
                  ]);

                  let proOfferDiscount = (proOffer.length > 0) ? proOffer[0].totalDiscount : 0;
                 
        
                  let catOffer = await categoryOfferModel.aggregate([
                    {
                      $match: {
                        'categoryOffer.category': cartdata.items[i].ProductId.category._id,
                        is_active: true,
                        "categoryOffer.offerStatus": true,
                        startingDate: { $lte: new Date() },
                        endingDate: { $gte: new Date() },
                      }
                    },
                    {
                      $group: {
                        _id: null,
                        totalDiscount: { $sum: "$categoryOffer.discount" }
                      }
                    }
                  ]);
                
        
                  let catOfferDis = (catOffer.length > 0) ? catOffer[0].totalDiscount : 0;
                  

                  let offerAssign = proOfferDiscount > catOfferDis ? proOfferDiscount : catOfferDis

                  cartdata.items[i].ProductId.price *= (1-(offerAssign/100))
                  cartdata.items[i].ProductId.price = Math.round(cartdata.items[i].ProductId.price)

                total += cartdata.items[i].ProductId.price * cartdata.items[i].quantity;
               
        }

            cartdata.billTotal = Math.round(total);

            if(cartdata.isApplied === true) {
                cartdata.billTotal -= Math.round((cartdata.billTotal * coupon.discountPercentage) / 100);
            }
            await cartdata.save(); 
        } else {
            cartdata = null;
        }
        res.render('shopping-cart', { cart: cartdata,coupon:coupon, couponDiscount, allCoupon});
    } catch (error) {
        console.log(error.message);
    }
}

const updateQuantity = async (req, res) => {
    try {
        const userId = req.session.userid;
        const { quantity } = req.body;
        const productId = req.params.id;

        if (quantity <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid quantity' });
        }

        if (quantity > 5) {
            return res.json({ success: false, message: "Maximum quantity reached" });
        }

        const productData = await productModel.findById(productId);

        if (!productData) {
            return res.status(404).json({ success: false, message: 'Product not found', curr: productData.countInStock });
        }

        if (quantity > productData.countInStock) {
            return res.status(400).json({ success: false, message: 'Out of stock' });
        }

        const cartData = await cartModel.findOne({ owner: userId }).populate({ path: 'items.ProductId', model: 'Product' });

        const productIndex = cartData.items.findIndex(item => item.ProductId._id.toString() === productId);
        if (productIndex === -1) {
            return res.status(404).json({ success: false, message: 'Product not found in cart' });
        }

        cartData.items[productIndex].quantity = quantity;

        if (quantity === 0) {
            cartData.items.splice(productIndex, 1);
        }
        
        let total = 0;
        for (let i = 0; i < cartData.items.length; i++) {
            let proOffer = await productOfferModel.aggregate([
                {
                    $match: {
                        'productOffer.product': cartData.items[i].ProductId._id,
                        'productOffer.offerStatus': true,
                        startingDate: { $lte: new Date() },
                        endingDate: { $gte: new Date() }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalDiscount: { $sum: "$productOffer.discount" }
                    }
                }
            ]);

            let proOfferDiscount = (proOffer.length > 0) ? proOffer[0].totalDiscount : 0;

            let catOffer = await categoryOfferModel.aggregate([
                {
                    $match: {
                        'categoryOffer.category': cartData.items[i].ProductId.category._id,
                        is_active: true,
                        "categoryOffer.offerStatus": true,
                        startingDate: { $lte: new Date() },
                        endingDate: { $gte: new Date() },
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalDiscount: { $sum: "$categoryOffer.discount" }
                    }
                }
            ]);

            let catOfferDis = (catOffer.length > 0) ? catOffer[0].totalDiscount : 0;

            let offerAssign = proOfferDiscount > catOfferDis ? proOfferDiscount : catOfferDis;

            let discountedPrice = cartData.items[i].price * (1 - (offerAssign / 100));
            discountedPrice = Math.round(discountedPrice);

            total += discountedPrice * cartData.items[i].quantity;
        }

        cartData.billTotal = Math.round(total);

        if (cartData.isApplied == true) {
            const coupon = await couponModel.findOne({ code: cartData.coupon, isActive: true });
            const discountAmount = cartData.billTotal * (coupon.discountPercentage / 100);
            cartData.billTotal -= Math.round(discountAmount);
        }

        await cartData.save();

        res.json({ success: true, message: 'Quantity updated successfully' });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const deleteCart = async(req, res)=>{
    try {
        const userid = req.session.userid
        const {productId} = req.body
        const userCart = await cartModel.findOne({owner:userid}).populate({path:'items.ProductId',model:'Product'})

        if(userCart)
            await userCart.updateOne(
                { $pull: { "items": { "ProductId":productId  } } } 
              )
              return res.status(200).json({cart:userCart,success:true})
                  } catch (error) {
        console.log(error.message);
    }
}

const addToWishlist = async (req, res) => {
    try {
        const productid = req.body.productId;
      
        
        const product = await productModel.findById(productid);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
       

        let existingWishlist = await wishlistModel.findOne({ user: req.session.userid });

        if (!existingWishlist) {
            existingWishlist = new wishlistModel({
                user: req.session.userid,
                product: [productid]
            });
            await existingWishlist.save();
        } else {
            let userProduct = existingWishlist.product.find(item => item.toString() === productid);
          

            if (userProduct) {
                return res.status(409).json({ message: 'Product already in wishlist' });
            } else {
                existingWishlist.product.push(productid);
                await existingWishlist.save();
            }
        }

        return res.status(200).json({ message: 'Product added to wishlist' });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: 'Something went wrong. Please try again' });
    }
};



const loadWishlist = async(req,res)=>{
    try {
        const productData = await productModel.find({})
        const wishlistData = await wishlistModel.findOne({user:req.session.userid}).populate('user').populate('product')
        res.render('wishlist',{product:productData,wish:wishlistData})
    } catch (error) {
        console.log(error.message)
    }
}

const deleteWishlist = async(req,res)=>{
    try {
        const userid = req.session.userid
        const productid = req.query.id
    
        const userWishlist = await wishlistModel.findOne({user:userid}).populate('product')

        if (userWishlist) {
            await userWishlist.updateOne({ $pull: { product: productid } });
            res.status(200).json({ success: true });
        } else {
            res.status(404).json({ success: false, message: "Wishlist not found" });
        }

    } catch (error) {
        console.log(error.message)
    }
}

module.exports =   {
    addProduct,
    loadCart,
    updateQuantity,
    deleteCart,
    loadWishlist,
    addToWishlist,
    deleteWishlist
}