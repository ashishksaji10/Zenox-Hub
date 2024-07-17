const mongoose=require('mongoose');
const objectId=mongoose.Schema.ObjectId;


const walletSchema=mongoose.Schema({
    user:{
        type:objectId,
        ref:'User',
        required:true
    },
    amount:{
        type:Number,
        required:true
    },
    orders:[{
        type:objectId,
        ref:'Order'
    }]
})

const Wallet = mongoose.model('Wallet',walletSchema);
module.exports=Wallet;