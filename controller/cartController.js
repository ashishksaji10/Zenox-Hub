const cartModel = require('../model/cartModel')
const userModel = require('../model/userModel')
const productModel = require('../model/productModel');
const { text } = require('body-parser');

const addProduct = async(req,res)=>{
    try {
        
        const productId = req.body.productId
        var product = await productModel.findById({_id:productId})

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
            insertCart.save();
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

const loadCart = async(req,res)=>{
    try {
        const product = await productModel.find();
        let cartdata = await cartModel.findOne({owner:req.session.userid}).populate({path:'items.ProductId',model:'Product'});
        console.log(cartdata)
        if(cartdata){
            let total = 0;
            cartdata.items.forEach(item=>{
                total +=item.price * item.quantity;
            })
    
            cartdata.billTotal =total;
            cartdata.save();
        }
        else{
            cartdata=null
        }
        
        
       
        res.render('shopping-cart',{cart:cartdata})
    } catch (error) {
        console.log(error.message);
    }
}

const increaseQty = async(req,res)=>{
    try {
        const {productId}=req.body
        const userid= req.session.userid
        const productData = await productModel.findById()
        const userCart = await cartModel.findOne({owner:userid}).populate({path:'items.ProductId',model:'Product'})
        console.log(userCart)
        
        const item = userCart.items.find(item=>item.ProductId._id.toString()===productId)
        if(!item){
            console.log('error1');
            return res.status(404).json({message:"Cart not found"})
            
        }

        if(item.quantity>=5){
            console.log('error2');
            return res.status(400).json({message:"Maximum quantity reached"})
        }

        if(item.quantity+1 >item.ProductId.countInStock){
            console.log('error3');
            return res.status(409).json({message:"Stock limit exceeded"})
        }
     
        item.quantity+=1;
        

        userCart.billTotal = userCart.items.reduce((total,item)=>
            total+(item.price*item.quantity),0)
        console.log(userCart);
        await userCart.save()

        return res.status(200).json({message:"quantity increased",userCart})

        
    } catch (error) {
        console.log("error while increase the quantity",error.message)
    }
}

const decreaseQty = async(req,res)=>{
    try {
        const userid = req.session.userid
        const {productId} = req.body
        const userCart = await cartModel.findOne({owner:userid}).populate({path:'items.ProductId',model:'Product'})

        const item = userCart.items.find(item=> item.ProductId._id.toString() === productId)
        if (!item) {
            return res.status(404).json({message:"Cart not found"})
        } 
        
        if (item.quantity <= 1){
            return res.status(400).json({message:"Minimum quantity reached"})
        }
     
        item.quantity-=1;

        userCart.billTotal = userCart.items.reduce((total,item)=>
        total+(item.quantity*item.price),0)
        await userCart.save()

        return res.status(200).json({message:"quantity increased",userCart})

    } catch (error) {
        console.log(error.message);
    }
}


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


module.exports =   {
    addProduct,
    loadCart,
    increaseQty,
    decreaseQty,
    deleteCart
}