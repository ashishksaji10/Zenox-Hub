const cartModel = require('../model/cartModel')
const userModel = require('../model/userModel')
const productModel = require('../model/productModel');
const addressModel = require('../model/addressModel');
const orderModel = require('../model/orderModel');
const payment = require('../controller/paymentController')
const randomString = require('randomstring');
const Razorpay = require('razorpay');
const walletModel = require('../model/walletModel');
const walletPay = require('../controller/walletController')

const loadCheckOut = async (req, res) => {
    try {
        const userid = req.session.userid;
        const userdata = await userModel.findById(userid);
        const addressData = await addressModel.findOne({ user: userid });
        const orderData = await cartModel.findOne({ owner: userid }).populate({ path: 'items.ProductId', model: 'Product' });
        const wallet = await walletModel.findOne({user:userid})

        if (!orderData) {
            // Handle case where there is no order data
            return res.render('checkout', { cart: { items: [] }, user: userdata, address: addressData });
        }

        return res.render('checkout', { cart: orderData, user: userdata, address: addressData ,wallet});
    } catch (error) {
        console.log(error.message);
        res.status(500).send("An error occurred");
    }
};


const loadAddress = async(req,res)=>{
    try {
        const addressData = await addressModel.findById(req.session.user)
        if(req.query.id ==  1){
            req.session.add = 1
        }
        res.render('addAddress',{address:addressData})
    } catch (error) {
        console.log(error.message);
    }
}


const addAddress = async(req, res) => {
    try {
        const { houseNo, street, landmark, pincode, city, district, state, country, addressType } = req.body;
        const userid = req.session.userid;
        const userData = await userModel.findById(userid);
        const userAddress = await addressModel.findOne({user:userid});
        const addressData = await addressModel.findOne({ user: req.session.userid });
        const cartData = await cartModel.findOne({ owner: req.session.userid }).populate({ path: 'items.ProductId', model: 'Product' });
        const wallet = await walletModel.findOne({user:userid}).populate('orders')

        
        const page = 1; 
        const limit = 10; 
        const skip = (page - 1) * limit;

        const totalOrders = await orderModel.countDocuments({ user: userid });
        const totalPages = Math.ceil(totalOrders / limit);

        const orderData = await orderModel.find({ user: userid }).sort({ orderDate: -1 }).skip(skip).limit(limit);

        if(!userAddress){
            let newAddress = new addressModel({
                user: userid,
                addresses: []
            });
            await newAddress.save();
            res.redirect('/user-profile');
        } else {
            const existtype = userAddress.addresses.find((address) => address.addressType === addressType);
            if(existtype){
                return res.render('userprofile', {
                    message: 'AddressType already exists',
                    user: userData,
                    orders: orderData,
                    address: addressData,
                    currentPage: page,
                    totalPages: totalPages,
                    limit: limit,
                    wallet:wallet
                });
            } else {
                const newAddress = {
                    addressType: addressType,
                    houseNo: houseNo,
                    street: street,
                    landmark: landmark,
                    pincode: pincode,
                    city: city,
                    district: district,
                    state: state,
                    country: country,
                };

                userAddress.addresses.push(newAddress);
                await userAddress.save();

                if(req.session.add == 1){
                    delete req.session.add;
                    res.redirect('/checkOut');
                } else {
                    res.redirect('/user-profile');
                }
            }
        }
    } catch(error) {
        console.log(error.message);
        res.status(500).send('An error occurred');
    }
};


const loadEditAddress = async(req,res)=>{
    try {
        const user = req.session.userid
        if(req.query.id ==  1){
            req.session.eid = 1
        }
        const AddressData = await addressModel.findOne({user:user})
        const addressType= req.query.addressType
        const address= AddressData.addresses.find(address=>address.addressType===addressType
        )
        res.render('editAddress',{address:address})
    } catch (error) {
        console.log(error.message);
    }
}

const EditAddress = async(req, res) => {
    try {
        const user = req.session.userid;
        const userData = await userModel.findById(user);
        const addressData = await addressModel.findOne({ user: req.session.userid });
        const { houseNo, street, landmark, pincode, city, district, state, country, addressType } = req.body;
        const AddressType = req.query.addressType;
        const wallet = await walletModel.findOne({user:user}).populate('orders')


        const page = 1; 
        const limit = 10; 
        const skip = (page - 1) * limit;

        const totalOrders = await orderModel.countDocuments({ user: user });
        const totalPages = Math.ceil(totalOrders / limit);

        const orderData = await orderModel.find({ user: user }).sort({ orderDate: -1 }).skip(skip).limit(limit);

        const AddressData = await addressModel.findOne({ user: user });
        const Address = AddressData.addresses.find(address => address.addressType === AddressType);

        if (!Address) {
            res.status(404).json({ message: "Address can't be edited" });
        } else {
            // Check if the new addressType already exists
            const existingAddress = AddressData.addresses.find(address => address.addressType === addressType && address.addressType !== AddressType);
            
            if (existingAddress) {
                res.render('userprofile', {
                    message: 'AddressType already exists',
                    user:userData,
                    orders: orderData,
                    address: addressData,
                    currentPage: page,
                    totalPages: totalPages,
                    limit: limit,
                    wallet:wallet
                });
            } else {
                Address.addressType = addressType;
                Address.houseNo = houseNo;
                Address.street = street;
                Address.landmark = landmark;
                Address.pincode = pincode;
                Address.city = city;
                Address.district = district;
                Address.state = state;
                Address.country = country;

                await AddressData.save();
                
                if (req.session.eid == 1) {
                    delete req.session.eid;
                    res.redirect('/checkOut');
                } else {
                    res.redirect('/user-profile');
                }
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}


const deleteAddress = async(req,res)=>{
    try {
        const addressType = req.query.addressType
        if(req.query.id ==  1){
            req.session.rid = 1
        }
        const findAddress = await addressModel.findOne({user:req.session.userid})
        // const Address = findAddress.addresses.find(address=>address.addressType===addressType)

        // if(Address){
        //     await findAddress.updateOne({$pull:{ 'addresses':{'addressType':addressType}}})
        //     res.redirect('/checkOut')
        // }else{
        //     res.status(400).json({message:'Error Occurs Refresh your page'})
        // }
            if(findAddress){
                await findAddress.updateOne({$pull:{ 'addresses':{'addressType':addressType}}})
                if(req.session.rid == 1){
                    delete req.session.rid
                    res.redirect('/checkOut')
                }else{
                    res.redirect('/user-profile')
                }
                
            }

    } catch (error) {
        console.log(error.message)
    }
}

const loadOrder = async(req,res)=>{
    try {
        const order_id = req.query.id
        const orderData = await orderModel.findOne({oId:order_id})
   
        

        if(!orderData){
            return res.status(404).json({message:'No order found'})
        }else{
            res.render('orderconfirmed',{order:orderData})
        }
    } catch (error) {
        console.log('Error Retrieving order Details',error.message);
    }
}

async function generateUniqueOrderId(){
    const randomPart = randomString.generate({
        length:6,
        charset:'numeric'
    })

    const currentDate = new Date()
    const datePart = currentDate.toISOString().slice(0,10).replace(/-/g,"");
    const order_id = `ID_${randomPart}${datePart}`
    return order_id
}

async function paymentCheck(body,id,amount){
    if(body.response!=null){
    
 
        const isValid=payment.verifySignature(body.response.razorpay_order_id,body.response.razorpay_payment_id,body.response.razorpay_signature)
        if(isValid){
       return {paymentOption:'Razorpay',
         addressType:body.data.addressType}
        }
        else{
            return  {paymentOption: null,
            addressType:null}
        }
    }else if(body.error != null){
        return {paymentOption:'Razorpay-Failed',
            addressType:body.data.addressType}
    }else if(body.paymentOption==='wallet'){
       const isValid = await walletPay.walletPay(amount,id)
       console.log(isValid);
           if(isValid===true){
               return {paymentOption:body.paymentOption,
                   addressType:body.addressType}
           }
           else{
               return {paymentOption: null,
                   addressType:null}
           }
        }

    else{
        return {paymentOption:body.paymentOption,
        addressType:body.addressType}
    }
}
const orderConfirmation = async(req,res)=>{
    try {
       
        const id = req.session.userid
        const cart = await cartModel.findOne({ owner: id }).populate({ path: 'items.ProductId', model: 'Product' });
        const amount = cart.billTotal
        const {paymentOption,addressType}= await paymentCheck(req.body,id,amount);
       
       if(paymentOption==null){
            return res.status(400)
        }
        if(!addressType){
            return res.status(400)
        }
   
     
        const userid = req.session.userid
        const userData = await userModel.findById(userid)
        const cartData = await cartModel.findOne({owner:userid}).populate({path:'items.ProductId',model:'Product'})
        if(!cartData){
            return res.render('checkout', { cart: cartData, user: userData, address: addressData, message:'Cart is Empty'});
        }

        const addressData = await addressModel.findOne({user:userid})
        if(!addressData){
            return res.render('checkout', { cart: cartData, user: userData, address: addressData, message:'Address not Found'});
        }

        const addressDetails = addressData.addresses.find(address=> address.addressType === addressType)
        if(!addressDetails){
            return res.render('checkout', { cart: cartData, user: userData, address: addressData, message:'AddressType not Found'});
        }

        if(paymentOption == 'COD'){
            if(cartData.billTotal > 1000){
                return res.status(405).json({message:'COD Maximum Limit is Rs 1000'});
            }
        }

        const selectedItems = cartData.items

        for(const item of selectedItems){
            const product = await productModel.findOne({_id:item.ProductId})


            if(product.countInStock === 0){
                return res.render('checkout', { cart: cartData, user: userData, address: addressData, message:'Stock Out'});
            }

            if(product.countInStock >= item.quantity){
                product.countInStock -= item.quantity
                await product.save();
            }else{
                return res.render('checkout', { cart: cartData, user: userData, address: addressData, message:'Stock Out'});
            }
        }

        const order_id = await generateUniqueOrderId()

        const orderData = new orderModel({
            user:userData._id,
            cart:cartData._id,
            oId:order_id,
            billTotal:cartData.billTotal,
            paymentStatus:"Success",
            paymentMethod:paymentOption,
            coupon:cartData.coupon,
            deliveryAddress:addressDetails
        });
        
        for(const item of selectedItems){
            orderData.items.push({
                productId:item.ProductId._id,
                image:item.ProductId.images[0],
                name:item.ProductId.name,
                productPrice:item.ProductId.price,
                quantity:item.quantity,
                price:item.price
            })
        }

        if(paymentOption === 'Razorpay-Failed'){
            orderData.paymentStatus = 'Pending'
        }
        await orderData.save()
           if(paymentOption == 'wallet'){
                const wallet = await walletModel.findOne({user:id})
                wallet.orders.push(orderData._id)
                await wallet.save()
           }
        cartData.items = []
        cartData.coupon = null
        cartData.isApplied = false
        await cartData.save()

        res.status(200).json({order_id})
    } catch (error) {
        console.log('Post Checkout Error',error.message);
        res.redirect('/checkOut')
    }
}


const loadOrderDetials = async(req,res)=>{
    try {
        const id = req.query.id
        const orderData = await orderModel.findById(id)
        res.render('orderdetails',{order:orderData})
    } catch (error) {
        console.log('Error Retrieving order Details',error.message);
    }
}

const cancelOrder = async(req,res)=>{
    try {
        const userId = req.session.userid
        const id = req.body.oId
        const orderData = await orderModel.findOneAndUpdate({oId:id},{
            $set:{
                status:"Cancelled"
            }
        },{new:true})


        if(orderData.status === "Cancelled"){
            for(item of orderData.items){
            const productid = item.productId
            const productData = await productModel.findById(productid)
            productData.countInStock += item.quantity
            await productData.save()
          
        }
    }

    if(orderData.paymentMethod==='Razorpay'|| orderData.paymentMethod==='wallet'){
        let wallet=await walletModel.findOne({user:userId});
        if(!wallet){
           wallet=new walletModel({
            user:userId,
            amount:0,
            orders:[]
          });
        }
          wallet.amount+=orderData.billTotal;
          if(orderData.paymentMethod==='Razorpay'){
          wallet.orders.push(orderData._id);
        }
        await wallet.save()
        }
        res.status(200).json({success:true,message:""})
    } catch (error) {
        console.log('Error Retrieving order Details',error.message);
    }
}

const deleteOrder = async (req, res) => {
    try {
        const { productId, orderId } = req.body;

       
        const orderData = await orderModel.findById(orderId).populate('items.productId');
        if (!orderData) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        if (orderData.items.length === 1) {
            return res.status(400).json({ message: "Cannot remove the only product in the order" });
        }

        const itemToRemove = orderData.items.find(item => item.productId._id.toString() === productId);
        if (!itemToRemove) {
            return res.status(404).json({ success: false, message: "Product not found in order" });
        }

        if (itemToRemove.status !== 'Cancelled') {
            // Update the item status to 'Cancelled'
            await orderModel.updateOne(
                { _id: orderId, 'items.productId': itemToRemove.productId._id },
                {
                    $set: { 'items.$.status': 'Cancelled' }
                }
            );
        
            // After cancelling, update the product stock and order total
            const productData = await productModel.findById(productId);
            productData.countInStock += itemToRemove.quantity;
            await productData.save();
        
            orderData.billTotal -= itemToRemove.price * itemToRemove.quantity;
            await orderData.save();
        }

        res.status(200).json({ success: true, message: "Product removed successfully" });
    } catch (error) {
        console.log('Error removing product from order:', error.message);
        res.status(500).json({ success: false, message: "An error occurred while removing the product" });
    }
};

const returnOrder = async (req, res) => {
    try {
        const userId = req.session.userid;
        const orderId = req.body.oId;
        const reason = req.body.reason;

        const order = await orderModel.findOne({oId:orderId})

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.status !== 'Delivered') {
            return res.status(400).json({ success: false, error: "Cannot cancel a delivered order" });
        }

        const newReturnRequest = {
            type: 'Return',
            status: 'Pending',
            reason: reason
        };

        order.requests.push(newReturnRequest);
        await order.save();

        res.status(200).json({ success: true, message: "Return Request Proceeded" });
    } catch (error) {
        console.log('Error processing return request:', error.message);
        res.status(500).json({ success: false, message: "An error occurred while processing the return request" });
    }
};

const repayment = async(req,res)=>{
    try {
      
        const id=req.body.id
        const isValid=payment.verifySignature(req.body.response.razorpay_order_id,req.body.response.razorpay_payment_id,req.body.response.razorpay_signature)
 
        if(isValid){
        await orderModel.findByIdAndUpdate(id,{$set:{paymentMethod:'Razorpay',paymentStatus:'Success'}});
        return res.status(200).json({message:'Payment updated'})
        }
        else{
            return res.status(400).json({message:'payment error'});
        }
    } catch (error) {
        console.log(error);
        return res.status(400).json({message:error});
    }
}

module.exports = {
    loadCheckOut,
    loadAddress,
    addAddress,
    loadEditAddress,
    EditAddress,
    deleteAddress,
    loadOrder,
    orderConfirmation,
    loadOrderDetials,
    cancelOrder,
    deleteOrder,
    returnOrder,
    repayment
}