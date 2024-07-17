const crypto=require('crypto')
const Razorpay=require('razorpay');
const walletModel = require('../model/walletModel')
const Cart = require('../model/cartModel')
const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env

var instance = new Razorpay({
    key_id: RAZORPAY_ID_KEY,
    key_secret: RAZORPAY_SECRET_KEY,
  });
 
  async function getAmount(body,id){
    if(body.id){
        const reOrder= await Order.findById(body.id)
        return amount=reOrder.billTotal*100
    }else{
        const cart=await Cart.findOne({owner:id})
        return amount=cart.billTotal*100
    }
}
  
  const createOrder = async(req,res)=>{
    try {    

        const id=req.session.userid;
        const amount= await getAmount(req.body,id)

        const options = {
            amount: amount,
            currency: 'INR',
            receipt:'',
            notes:''
        }

        instance.orders.create(options, 
            async(err, order)=>{
                if(!err){
                    res.status(200).send({
                        success:true,
                        msg:'Order Created',
                        order_id:order.id,
                        amount:amount
                    });
                }
                else{
                    res.status(400).send({success:false,msg:'Something went wrong!'});
                }
            }
        );

    } catch (error) {
        console.log(error.message);
    }
}

function verifySignature(orderId, paymentId, razorpaySignature) {
    const message = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256',RAZORPAY_SECRET_KEY)
      .update(message)
      .digest('hex');
  
    return generatedSignature === razorpaySignature;
  }

module.exports={
    createOrder,
    verifySignature,
}