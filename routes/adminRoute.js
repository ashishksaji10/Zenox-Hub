const express = require('express')
const admin_route = express()
const adminController = require('../controller/adminController')
const productController = require('../controller/productController')
const categoryController = require('../controller/categoryController')
const adminAuth = require('../midddleware/adminAuth')
const multer = require("multer")
const path = require ("path")


admin_route.use(express.json())
admin_route.use(express.urlencoded({extended: true}))


admin_route.use(express.static('public'))
admin_route.set('views','./views/admin')


// Multer Config
const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname,"../public/productImages"))
    },

    filename:function(req,file,cb){
        console.log('llllllllllllllllllllllllllllllllllllllllllll',file);
        const name=Date.now()+"-"+file.originalname
        cb(null,name)
    }
})

const upload = multer({storage:storage}).array('images',3)  //mimetype cheching

admin_route.get('/',adminAuth.isLoggedOut,adminAuth.preventCache,adminController.loadAdminLogin)
admin_route.post('/',adminController.verifyLogin)

admin_route.get('/dashboard',adminAuth.isLoggedIn,adminAuth.preventCache,adminController.loadDashboard)

// Userlist
admin_route.get('/userlist',adminAuth.isLoggedIn,adminAuth.preventCache,adminController.loadUserlist)
admin_route.get('/block-user',adminAuth.isLoggedIn,adminAuth.preventCache,adminController.blockUser)
admin_route.get('/unblock-user',adminAuth.isLoggedIn,adminAuth.preventCache,adminController.unBlockUser)


// Product
admin_route.get('/product',adminAuth.isLoggedIn,adminAuth.preventCache,productController.loadProduct)
admin_route.get('/productlist',adminAuth.isLoggedIn,adminAuth.preventCache,productController.loadProductlist)
admin_route.post('/product',upload,productController.insertProduct)

admin_route.get('/editproduct',adminAuth.isLoggedIn,adminAuth.preventCache,productController.loadEditProduct)
admin_route.post('/editproduct',upload,productController.editProduct)

admin_route.get('/active',adminAuth.isLoggedIn,adminAuth.preventCache,productController.activeProduct)



// Category
admin_route.get('/category',adminAuth.isLoggedIn,adminAuth.preventCache,categoryController.loadCategory)
admin_route.post('/category',categoryController.insertCategory)

admin_route.get('/edit-cate',adminAuth.isLoggedIn,adminAuth.preventCache,categoryController.loadEditCategory)
admin_route.post('/edit-cate',categoryController.editCategory)

admin_route.get('/delete-cate',adminAuth.isLoggedIn,adminAuth.preventCache,categoryController.deleteCategory)


// Order
admin_route.get('/order',adminAuth.isLoggedIn,adminAuth.preventCache,adminController.loadOrders)
admin_route.get('/order-details',adminAuth.isLoggedIn,adminAuth.preventCache,adminController.loadOrderDetails)
admin_route.post('/updateorderstatus',adminController.updateOrder)



// Logout
admin_route.get('/logout',adminAuth.isLoggedIn,adminAuth.preventCache,adminController.logout)



module.exports = admin_route
