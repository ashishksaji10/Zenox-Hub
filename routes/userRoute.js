const express = require('express')
const user_route = express()
const userController = require('../controller/userController')
const cartController = require('../controller/cartController')
const checkOutController = require('../controller/checkOutController')
const userAuth = require('../midddleware/userAuth')



user_route.use(express.static('public/assets'))
user_route.use(express.static('public'))


user_route.set('views','./views/user')

user_route.get('/signup',userAuth.preventCache,userController.loadRegister)
user_route.post('/signup',userController.getOTP);
user_route.get('/verifyOTP',userController.loadVerifyOtp);
user_route.post('/resend-otp',userController.resendOtp);

user_route.post('/verifyOTP',userController.insertUser);

// Forgot and Reset password
user_route.get('/forgot-password',userController.loadForgotPassword);
user_route.post('/forgot-password',userController.ForgotVerify);

user_route.get('/reset-password',userController.loadResetPassword);
user_route.post('/reset-password',userController.resetPassword);


// Login and Home
user_route.get('/login',userAuth.isLoggedout,userAuth.preventCache,userController.loadLogin)
user_route.post('/login',userController.verifyLogin)
user_route.get('/home',userAuth.isLoggedin,userAuth.preventCache,userController.loadHome)

// User Profile
user_route.get('/user-profile',userAuth.isLoggedin,userAuth.preventCache,userController.loadUserProfile)
user_route.post('/user-profile',userAuth.isLoggedin,userAuth.preventCache,userController.editUserDetails)

// Shop and Shop Details
user_route.get('/shop',userAuth.isLoggedin,userAuth.preventCache,userController.loadShop)
user_route.get('/shop-details',userAuth.isLoggedin,userAuth.preventCache,userController.loadShopDetails)

// Cart Details
user_route.post('/add-to-cart',userAuth.isLoggedin,userAuth.preventCache,cartController.addProduct)
user_route.get('/cart',userAuth.isLoggedin,userAuth.preventCache,cartController.loadCart)
user_route.post('/increaseQty',userAuth.isLoggedin,userAuth.preventCache,cartController.increaseQty)
user_route.post('/decreaseQty',userAuth.isLoggedin,userAuth.preventCache,cartController.decreaseQty)
user_route.post('/cart-delete',userAuth.isLoggedin,userAuth.preventCache,cartController.deleteCart)

// CheckOut Details
user_route.get('/checkOut',userAuth.isLoggedin,userAuth.preventCache,checkOutController.loadCheckOut)

// Address Details
user_route.get('/add-address',userAuth.isLoggedin,userAuth.preventCache,checkOutController.loadAddress)
user_route.post('/add-address',checkOutController.addAddress)
user_route.get('/edit-address',userAuth.isLoggedin,userAuth.preventCache,checkOutController.loadEditAddress)
user_route.post('/edit-address',checkOutController.EditAddress)
user_route.get('/delete-address',userAuth.isLoggedin,userAuth.preventCache,checkOutController.deleteAddress)

// Order Route
user_route.get('/confirm-order',userAuth.isLoggedin,userAuth.preventCache,checkOutController.loadOrder)
user_route.post('/confirm-order',checkOutController.orderConfirmation)
user_route.get('/order-details',userAuth.isLoggedin,userAuth.preventCache,checkOutController.loadOrderDetials)
user_route.post('/order-details',checkOutController.cancelOrder)
user_route.post('/order-delete',userAuth.isLoggedin,userAuth.preventCache,checkOutController.deleteOrder)

user_route.get('/error',userController.error)


// Logout
user_route.get('/logout',userAuth.isLoggedin,userAuth.preventCache,userController.logout)

module.exports = user_route