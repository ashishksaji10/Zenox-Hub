const cartModel = require('../model/cartModel')
const userModel = require('../model/userModel')
const productModel = require('../model/productModel');
const addressModel = require('../model/addressModel');
const orderModel = require('../model/orderModel');
const randomString = require('randomstring');


const loadCheckOut = async (req, res) => {
    try {
        const userid = req.session.userid;
        const userdata = await userModel.findById(userid);
        const addressData = await addressModel.findOne({ user: userid });
        const orderData = await cartModel.findOne({ owner: userid }).populate({ path: 'items.ProductId', model: 'Product' });

        if (!orderData) {
            // Handle case where there is no order data
            return res.render('checkout', { cart: { items: [] }, user: userdata, address: addressData });
        }

        return res.render('checkout', { cart: orderData, user: userdata, address: addressData });
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
        const userid = req.session.userid
        const userData = await userModel.findById(userid)
        const userAddress = await addressModel.findOne({user:userid})
        const addressData = await addressModel.findOne({ user: req.session.userid });
        const orderData = await cartModel.findOne({ owner: req.session.userid }).populate({ path: 'items.ProductId', model: 'Product' });

        if(!userAddress){
            console.log(userid);
            let newAddress = new addressModel({
                user:userid,
                addresses:[]
                 })
                 newAddress.save();
                 res.redirect('/user-profile')
        }else{
            const existtype =   userAddress.addresses.find((address)=>address.addressType === addressType)
            if(existtype){
                return res.render('userprofile',{message:'AddressType is alredy Existed',user:userData,orders:orderData,address:addressData})
            }
            else{
            const newAddress= {
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

            userAddress.addresses.push(newAddress)

            await userAddress.save()
            console.log(req.session);
            if(req.session.add == 1){
                delete req.session.add
                res.redirect('/checkOut')
            }else{
                res.redirect('/user-profile')
                console.log('if existing typee',existtype);
            }
          
        } 
    }  
        }catch(error) {
        console.log(error.message);
    }
};


const loadEditAddress = async(req,res)=>{
    try {
        const user = req.session.userid
        if(req.query.id ==  1){
            req.session.eid = 1
        }
        const AddressData = await addressModel.findOne({user:user})
        console.log(AddressData)
        const addressType= req.query.addressType
        const address= AddressData.addresses.find(address=>address.addressType===addressType
        )
        res.render('editAddress',{address:address})
    } catch (error) {
        console.log(error.message);
    }
}

const EditAddress = async(req,res)=>{
    try {
        const user = req.session.userid
        const { houseNo, street, landmark, pincode, city, district, state, country, addressType } = req.body;
        const AddressType = req.query.addressType
        const AddressData = await addressModel.findOne({user:user})
        const Address = AddressData.addresses.find(address=>address.addressType === AddressType)
        
        if(!Address){
        res.status(404).json({message:"can't be edited"})
        }else{
           Address.houseNo = houseNo
           Address.street = street
           Address.landmark = landmark
           Address.pincode = pincode
           Address.city = city
           Address.district = district
           Address.state = state
           Address.country = country
           
           await AddressData.save()
           if(req.session.eid == 1){
            delete req.session.eid
            res.redirect('/checkOut')
        }else{
            res.redirect('/user-profile')
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
        console.log('order Dataaaaa',orderData)
        

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

const orderConfirmation = async(req,res)=>{
    try {
        console.log('hai')
        const paymentOption = req.body.paymentOption
        const userid = req.session.userid
        console.log(userid);
        const userData = await userModel.findById(userid)
        console.log(userData);
        const addressType = req.body.addressType
        console.log(addressType);
        const cartData = await cartModel.findOne({owner:userid}).populate({path:'items.ProductId',model:'Product'})
        console.log(cartData);
        if(!cartData){
            console.log('1');
            return res.render('checkout', { cart: cartData, user: userData, address: addressData, message:'Cart is Empty'});
        }

        const addressData = await addressModel.findOne({user:userid})
        if(!addressData){
            console.log('2');
            return res.render('checkout', { cart: cartData, user: userData, address: addressData, message:'Address not Found'});
        }

        const addressDetails = addressData.addresses.find(address=> address.addressType === addressType)
        if(!addressDetails){
            console.log('3');
            return res.render('checkout', { cart: cartData, user: userData, address: addressData, message:'AddressType not Found'});
        }

        const selectedItems = cartData.items
        console.log(selectedItems);

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
        console.log('order id ........',order_id);

        const orderData = new orderModel({
            user:userData._id,
            cart:cartData._id,
            oId:order_id,
            billTotal:cartData.billTotal,
            paymentStatus:"Success",
            paymentMethod:paymentOption,
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

        await orderData.save()

        cartData.items = []
        await cartData.save()

        res.status(200).json({order_id})
    } catch (error) {
        console.log('Post Cheout Error',error.message);
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
        const id = req.body.oId
        console.log(id,',,,,,.............................................................................id');
        const orderData = await orderModel.findOneAndUpdate({oId:id},{
            $set:{
                status:"Cancelled"
            }
        },{new:true})

        if(orderData.status === "Cancelled"){
            console.log(orderData.items,'items...........................')
            for(item of orderData.items){
            const productid = item.productId
            console.log(productid,'.............................................................productid');
            const productData = await productModel.findById(productid)
            productData.countInStock += item.quantity
            await productData.save()
          
        }
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

        const productData = await productModel.findById(productId);
        productData.countInStock += itemToRemove.quantity;
        await productData.save();

        orderData.billTotal -= itemToRemove.price * itemToRemove.quantity;

        await orderModel.updateOne(
            { _id: orderId },
            { $pull: { items: { productId: itemToRemove.productId._id } } }
        );

        await orderData.save();

        res.status(200).json({ success: true, message: "Product removed successfully" });
    } catch (error) {
        console.log('Error removing product from order:', error.message);
        res.status(500).json({ success: false, message: "An error occurred while removing the product" });
    }
};


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
    deleteOrder

}