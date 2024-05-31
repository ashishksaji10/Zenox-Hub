const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        
    },
    mobile:{
        type:String,
        
    },
    image:{
        type:String,
    },
    password:{
        type:String,
        
    },
    is_admin:{
        type:Number,
        default: 0
    },
    is_verified:{
        type:Number,
        default: 0
    },
    is_Blocked:{
        type:Number,
        default: 0
    },
    cart:{
        type:Array
    },
    wishlist:{
        type:Array
    },
    wallet:{
        type:Number,
        default: 0
    },
    history:{
        type:Array
    },
    address:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Address'
    },
    token:{
        type:String,
        default:''
    }
    
})

module.exports = mongoose.model("User",userSchema)