const express = require('express')
const admin_route = express()
const adminController = require('../controller/adminController')
const productController = require('../controller/productController')
const categoryController = require('../controller/categoryController')
const offerController = require('../controller/OfferController')
const couponController = require('../controller/couponController')
const adminAuth = require('../midddleware/adminAuth')
const multer = require("multer")
const path = require("path")


admin_route.use(express.json())
admin_route.use(express.urlencoded({ extended: true }))


admin_route.use(express.static('public'))
admin_route.set('views', './views/admin')


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/webp') {
            cb(null, path.join(__dirname, "../public/productImages"));
        } else {
            cb(new Error('Invalid file type'), false);
        }
    },
    filename: function (req, file, cb) {
        const name = Date.now() + "-" + file.originalname;
        cb(null, name);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === "images") {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/webp') {
            cb(null, true);
        } else {
            cb(null, false);
        }
    } else {
        cb(null, false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter
}).array('images', 3);

admin_route.get('/', adminAuth.isLoggedOut, adminAuth.preventCache, adminController.loadAdminLogin)
admin_route.post('/', adminController.verifyLogin)

// Dashboaard
admin_route.get('/dashboard', adminAuth.isLoggedIn, adminAuth.preventCache, adminController.loadDashboard)
admin_route.get("/bestselling",adminAuth.isLoggedIn,adminController.getBestSelling)
admin_route.get("/chart",adminAuth.isLoggedIn,adminController.getChartData);

// Userlist
admin_route.get('/userlist', adminAuth.isLoggedIn, adminAuth.preventCache, adminController.loadUserlist)
admin_route.get('/block-user', adminAuth.isLoggedIn, adminAuth.preventCache, adminController.blockUser)
admin_route.get('/unblock-user', adminAuth.isLoggedIn, adminAuth.preventCache, adminController.unBlockUser)


// Product
admin_route.get('/product', adminAuth.isLoggedIn, adminAuth.preventCache, productController.loadProduct)
admin_route.get('/productlist', adminAuth.isLoggedIn, adminAuth.preventCache, productController.loadProductlist)
admin_route.post('/product', upload, productController.insertProduct)

admin_route.get('/editproduct', adminAuth.isLoggedIn, adminAuth.preventCache, productController.loadEditProduct)
admin_route.post('/editproduct', upload, productController.editProduct)
admin_route.delete('/editproduct/delete-image', productController.deleteImage)

admin_route.get('/active', adminAuth.isLoggedIn, adminAuth.preventCache, productController.activeProduct)



// Category
admin_route.get('/category', adminAuth.isLoggedIn, adminAuth.preventCache, categoryController.loadCategory)
admin_route.post('/category', categoryController.insertCategory)

admin_route.get('/edit-cate', adminAuth.isLoggedIn, adminAuth.preventCache, categoryController.loadEditCategory)
admin_route.post('/edit-cate', categoryController.editCategory)

admin_route.get('/delete-cate', adminAuth.isLoggedIn, adminAuth.preventCache, categoryController.deleteCategory)


// Order
admin_route.get('/order', adminAuth.isLoggedIn, adminAuth.preventCache, adminController.loadOrders)
admin_route.get('/order-details', adminAuth.isLoggedIn, adminAuth.preventCache, adminController.loadOrderDetails)
admin_route.post('/acceptcancel', adminController.requestAccept);
admin_route.post('/rejectcancel', adminController.requestCancel);

admin_route.post('/updateorderstatus', adminController.updateOrder)

// Category Offer
admin_route.get('/categoryoffer', adminAuth.isLoggedIn, adminAuth.preventCache, offerController.loadCategoryOffer)
admin_route.get('/addCategoryOffer', adminAuth.isLoggedIn, adminAuth.preventCache, offerController.loadAddCategoryOffer)
admin_route.post('/addCategoryOffer', adminAuth.isLoggedIn, adminAuth.preventCache, offerController.addCategoryOffer)
admin_route.get('/editCategoryOffer', adminAuth.isLoggedIn, adminAuth.preventCache, offerController.loadEditCategoryOffer)
admin_route.post('/editCategoryOffer', adminAuth.isLoggedIn, adminAuth.preventCache, offerController.editCategoryOffer)
admin_route.get('/delete-cateOff', adminAuth.isLoggedIn, adminAuth.preventCache, offerController.deleteCategoryOffer)
admin_route.get('/restore-cateOff', adminAuth.isLoggedIn, adminAuth.preventCache, offerController.restoreCategoryOffer)

// Product Offer
admin_route.get('/productoffer', adminAuth.isLoggedIn, adminAuth.preventCache, offerController.loadProductOffer)
admin_route.get('/addProductOffer', adminAuth.isLoggedIn, adminAuth.preventCache, offerController.loadAddProductOffer)
admin_route.post('/addProductOffer', adminAuth.isLoggedIn, adminAuth.preventCache, offerController.addProductOffer)
admin_route.get('/editProductOffer', adminAuth.isLoggedIn, adminAuth.preventCache, offerController.loadEditProductOffer)
admin_route.post('/editProductOffer', adminAuth.isLoggedIn, adminAuth.preventCache, offerController.editProductOffer)
admin_route.post('/block-prdOff/:id', adminAuth.isLoggedIn, adminAuth.preventCache, offerController.blockProductOffer)
admin_route.post('/unblock-prdOff/:id', adminAuth.isLoggedIn, adminAuth.preventCache, offerController.unblockProductOffer)

// Coupon
admin_route.get('/coupon', adminAuth.isLoggedIn, adminAuth.preventCache, couponController.loadCoupon)
admin_route.get('/createcoupon', adminAuth.isLoggedIn, adminAuth.preventCache, couponController.loadCreateCoupon)
admin_route.post('/createcoupon', adminAuth.isLoggedIn, adminAuth.preventCache, couponController.createCoupon)
admin_route.post('/togglecoupon', adminAuth.isLoggedIn, adminAuth.preventCache, couponController.toggleCoupon)

// Sales Report
admin_route.get('/salesReport', adminAuth.isLoggedIn, adminAuth.preventCache, adminController.loadSalesReport)
admin_route.post('/salesReportSelectFilter', adminAuth.isLoggedIn, adminAuth.preventCache, adminController.filterReport)
admin_route.post('/fileterDateRange', adminAuth.isLoggedIn, adminAuth.preventCache, adminController.filterCustomDateOrder)

// Logout
admin_route.get('/logout', adminAuth.isLoggedIn, adminAuth.preventCache, adminController.logout)


module.exports = admin_route
