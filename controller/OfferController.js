const productOfferModel = require('../model/productOfferModel');
const categoryOfferModel = require('../model/categoryOfferModel')
const categoryModel = require('../model/categoryModel');
const productModel = require('../model/productModel');


// Category Offer
const loadCategoryOffer = async(req, res)=>{
    try {
        const itemsPerPage = 10;
        const currentPage = parseInt(req.query.page) || 1;
        const categoryOfferData = await categoryOfferModel.aggregate([
            {
                $lookup: {
                    from:'categories',
                    localField:'categoryOffer.category',
                    foreignField:'_id',
                    as:'categoryDetails'
                }
            },
                {
                    $unwind :"$categoryDetails"   
                }
        ])

        const totalcategoryOffers = categoryOfferData.length;
        const totalPages = Math.ceil(totalcategoryOffers / itemsPerPage);

        // Slice the product offer data based on pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = currentPage * itemsPerPage;
        const categoryOfferDataPerPage = categoryOfferData.slice(startIndex, endIndex);
        res.render('categoryOffer',{categoryOfferData: categoryOfferDataPerPage, currentPage, totalPages})
    } catch (error) {
        console.log(error.message)
    }
}

const loadAddCategoryOffer = async(req, res)=>{
    try {
        const categoryData = await categoryModel.find({})
        res.render('addCategoryOffer',{categoryData:categoryData})
    } catch (error) {
        console.log(error.message)
    }
}

const addCategoryOffer = async(req, res)=>{
    try {
        const {name, startingDate, endingDate, category, categoryDiscount} = req.body

        let discount = parseFloat(categoryDiscount)

        const newCategoryOffer = new categoryOfferModel({
            name,
            startingDate,
            endingDate,
            categoryOffer:{
                category,
                discount
            }
        })
        await newCategoryOffer.save()
        res.redirect('/admin/categoryoffer')
    } catch (error) {
        console.log(error.message)
    }
}

const loadEditCategoryOffer = async(req, res)=>{
    try {
        const categoryData = await categoryModel.find({})
        const catId = req.query.catId
        const offerId = req.query.id
        const offerDetails = await categoryOfferModel.findById(offerId)
        res.render('editCategoryOffer',{categoryData,offerDetails})
    } catch (error) {
        console.log(error.message)
    }
}

const editCategoryOffer = async(req, res)=>{
    try {

            
        const catId = req.query.catId
        const {name, startingDate, endingDate, category, categoryDiscount} = req.body
        
        const updateOffer = await categoryOfferModel.findByIdAndUpdate(catId,{$set: {
            name:name,
            startingDate:new Date(startingDate),
            endingDate:new Date(endingDate),
            'categoryOffer.discount':categoryDiscount,
            'categoryOffer.category':category,
            
        }},{new:true})
            res.redirect('/admin/categoryoffer')

        
    } catch (error) {
        console.log(error.message)
    }
}

const deleteCategoryOffer = async(req, res)=>{
    try {
        const offerId = req.query.id
        const catOfferStatus = await categoryOfferModel.findByIdAndUpdate(offerId,{$set:{is_active:false}})
        res.redirect('/admin/categoryOffer')
    } catch (error) {
        console.log(error.message)
    }
}

const restoreCategoryOffer = async(req, res)=>{
    try {
       const offerId = req.query.id
       const catOfferStatus = await categoryOfferModel.findByIdAndUpdate(offerId,{$set:{is_active:true}})
        res.redirect('/admin/categoryOffer')
    } catch (error) {
        console.log(error.message)
    }
}

// Product Offer

const loadProductOffer = async(req, res)=>{
    try {
        const itemsPerPage = 10;
        const currentPage = parseInt(req.query.page) || 1;

        const productOfferData = await productOfferModel.aggregate([
            {
                $lookup:{
                    from:'products',
                    localField:'productOffer.product',
                    foreignField:'_id',
                    as:'productDetails'
                }
            },
            {
                $unwind : '$productDetails'
            },
            
        ])

        const totalProductOffers = productOfferData.length;
        const totalPages = Math.ceil(totalProductOffers / itemsPerPage);

        // Slice the product offer data based on pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = currentPage * itemsPerPage;
        const productOfferDataPerPage = productOfferData.slice(startIndex, endIndex);
        res.render('productOffer',{productOfferData: productOfferDataPerPage, currentPage, totalPages})
       
    } catch (error) {
        console.log(error.message)
    }
}


const loadAddProductOffer = async(req, res)=>{
    try {
        const productData = await productModel.find({})
        res.render('addProductOffer',{productData:productData})
    } catch (error) {
        console.log(error.message)
    }
}

const addProductOffer = async(req, res)=>{
    try {
       
        const {name,startingDate,endingDate,products,productDiscount} = req.body
        const discount = parseFloat(productDiscount)

        const newProdOffer = new productOfferModel({
            name,
            startingDate,
            endingDate,
            productOffer:{
                product:products,
                discount
            }
        })
        await newProdOffer.save()
        res.redirect('/admin/productOffer')
    } catch (error) {
        console.log(error.message)
    }
}

const loadEditProductOffer = async(req, res)=>{
    try {
        const productData = await productModel.find({})
        const offerId = req.query.id
        const prdOfferData = await productOfferModel.findById(offerId)
        res.render('editProductOffer',{productData,prdOfferData})
    } catch (error) {
        console.log(error.message)
    }
}

const editProductOffer = async(req, res)=>{
    try {
        const {name,startingDate,endingDate,product,discount} = req.body
        const offerId = req.query.offerId

        const updatePrdOffer = await productOfferModel.findByIdAndUpdate(offerId,
            {
                $set: {
                    name:name,
                    startingDate:new Date(startingDate),
                    endingDate:new Date(endingDate),
                    'productOffer.discount':discount,
                    'productOffer.product':product
                }},{new: true})
       res.redirect('/admin/productOffer')
    } catch (error) {
        console.log(error.message)
    }
}

const blockProductOffer = async(req, res)=>{
    try {
       const prdId = req.params.id
       const value = await productOfferModel.findByIdAndUpdate(prdId,{$set:{'productOffer.offerStatus': false}})
       res.redirect('/admin/ProductOffer');
    } catch (error) {
        console.log(error.message)
    }
}

const unblockProductOffer = async(req, res)=>{
    try {
        const prdId = req.params.id
        const value = await productOfferModel.findByIdAndUpdate(prdId,{$set:{'productOffer.offerStatus': true}})
        res.redirect('/admin/ProductOffer');
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = {
    loadCategoryOffer,
    loadAddCategoryOffer,
    addCategoryOffer,
    loadEditCategoryOffer,
    editCategoryOffer,
    deleteCategoryOffer,
    restoreCategoryOffer,
    loadProductOffer,
    loadAddProductOffer,
    addProductOffer,
    loadEditProductOffer,
    editProductOffer,
    blockProductOffer,
    unblockProductOffer,
}