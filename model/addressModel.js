const mongoose = require('mongoose')
const ObjectID = mongoose.Schema.Types.ObjectId;
const User = require('./userModel')

const addressSchema = new mongoose.Schema({

    user:{
        type:ObjectID,
        ref:'User',
        required:true
    },

    addresses:[{

        addressType:{
            type:String,
            required:true,
            enum:['work','home','temp']
        },
        houseNo:{
            type:String,
            required:true
        },
        street:{
            type:String,
            required:true
        },
        landmark:{
            type:String,
            required:true
        },
        city:{
            type:String,
            required:true
        },
        district:{
            type:String,
            required:true
        },
        pincode:{
            type:String,
            required:true
        },
        
        state:{
            type:String,
            required:true
        },
        country:{
            type:String,
            required:true
        }
    }],
})

const Address = mongoose.model('Address',addressSchema)
module.exports = Address