const mongoose = require('mongoose')
const Product = require('./productModel')
const ObjectID = mongoose.Schema.Types.ObjectId

const cartSchema = new mongoose.Schema({
    owner:{
        type: ObjectID,
        ref: 'User',
        required: true
    },

    items:[{
        ProductId:{
            type:ObjectID,
            ref:'Product',
            required:true
        },
        
        quantity:{
            type:Number,
            required:true,
            min:[1,'Quantity cannot be less than one'],
            default:1
        },

        price:{
            type:Number,
            required:true,
        },

       
    }],

    billTotal:{
        type:Number,
        required:true,
        default:0
    },

    shipping:{
        type:Number,
        default:0
    },

    
},
{
    timestamps:true
    
})

const Cart = mongoose.model('Cart',cartSchema)
module.exports = Cart
    
       
