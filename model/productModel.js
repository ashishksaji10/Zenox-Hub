const mongoose = require('mongoose')

const productScehema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    
    brand:{
        type:String,

    },

    description: {
        type: String,
        required: true
    },

    images: [{
        type: String
    }],

    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    price: {
        type: Number,
        required: true,
        default: 0
    },
    discountPrice: {
        type: Number,
        default: 0
    },

    countInStock: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    rating: {
        type: Number,
        default: 0
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    is_deleted: {
        type: Boolean,
        default: false
    }
})

const Product = mongoose.model('Product',productScehema)

module.exports = Product