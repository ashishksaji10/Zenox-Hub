const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const categorySchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim: true,
        unique: true
    },

    description:{
        type:String,
        required:true,
        trim:true
    },

    is_Active :{
        type:Boolean,
        default:true
    }
})

const Category = mongoose.model("Category", categorySchema)

module.exports= Category