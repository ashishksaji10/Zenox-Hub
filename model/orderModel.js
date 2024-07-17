const mongoose = require('mongoose')
const ObjectID = mongoose.Schema.Types.ObjectId

const orderSchema = new mongoose.Schema({

    user:{
        type:ObjectID,
        ref:'User',
        required:true
    },
    cart:{
        type:ObjectID,
        ref:'Cart',
        required:true
    },
    oId:{
        type:String,
        required:true
    },
    coupon: {
        type: String
    },

    items:[{

        productId:{
            type:ObjectID,
            ref:'Product',
            required:true
        },
        image:{
            type:String,
            required:true
        },
        name:{
            type:String,
            required:true
        },
        productPrice:{
            type:Number,
            required:true
        },
        quantity:{
            type:Number,
            required:true,
            min:[1,'Quantity can not be less than 1.'],
            default:1
        },
        price:{
            type:Number,
            required:true  
        },
        status:{
        type:String,
        enum:['Pending','Processing','Shipped','Delivered','Cancelled','Returned'],
        default:'Pending'
        }
    }],

    billTotal:{
        type:Number,
        required:true
    },
    DiscountPercentage:{
        type: Number,
        default: 0,
    },
    paymentMethod:{
        type:String
    },
    paymentStatus:{
        type:String,
        enum:['Pending','Success','Failed'],
        default:'Pending'
    },

    deliveryAddress:{
        type:{
            addressType:String,
            houseNo:String,
            street:String,
            landmark:String,
            pincode:Number,
            city:String,
            district:String,
            state:String,
            country:String
        },
        required:true
    },

    orderDate:{
        type:Date,
        default:Date.now
    },

    status:{
        type:String,
        enum:['Pending','Processing','Shipped','Delivered','Cancelled','Returned'],
        default:'Pending'
    },

    reason:{
        type:String
    },

    requests:[{
        type:{
            type:String,
            enum:['Cancel','Return']
        },
        status:{
            type:String,
            enum:['Pending','Accepted','Rejected'],
            default:'Pending'
        },
        reason:String
    }],

    coupon:{
        type:String
    },
    discountPrice:{
        type:Number,
        default:0
    },
},
{
    timestamps:true,
    strictPopulate: false
})

const Order = mongoose.model('Order',orderSchema)
module.exports = Order

