const userModel = require('../model/userModel')
const productModel = require('../model/productModel')
const categoryModel = require('../model/categoryModel')
const addressModel = require('../model/addressModel');
const orderModel = require('../model/orderModel');
const cartModel = require('../model/cartModel')
const passport = require("../config/auth");


const bcrypt = require('bcrypt')
const otpGenerator = require('otp-generator')
const nodemailer = require('nodemailer')
const flash = require('express-flash');
const { session } = require('passport');
const { name } = require('ejs');
const Category = require('../model/categoryModel');
const randomstring = require('randomstring')

const securePassword = async(password)=>{
    try {
        const passwordHash = await bcrypt.hash(password,10)
        return passwordHash
    } catch (error) {
        console.log(error.message);
    }
}

const loadRegister = async(req, res)=> {
    try {
        
       
        res.render('Register',{message:""})
       
        
    } catch (error) {
        console.log(error.message)
    }
}


/* function generateOTP (){
    return Math.floor(100000 + Math.random() * 900000)
}
 */
const loadVerifyOtp = async(req,res)=>{
    try {
        res.render('verifyOTP',{message:""})
    } catch (error) {
        
    }
}
const getOTP = async(req,res)=>{
    try{
        const email = req.body.email;
        console.log("email in getOTP ",email)
        const verifyEmail = await userModel.findOne({email : email})
        if (verifyEmail) {
            res.render('Register',{message : 'This Email is already Registered.Try again with another Email'})
        }else{

        const sPassword = await securePassword(req.body.password);
        const generateOTP = otpGenerator.generate(6,{
        digits:true,
        lowerCaseAlphabets:false,
        upperCaseAlphabets:false,
        specialChars:false
    });

    const timestamp = Date.now();
    req.session.userData = {...req.body,generateOTP,timestamp};
    req.session.userData.password = sPassword;
    req.session.userData.confirmpassword = sPassword;
    req.session.save();
    console.log("hii body name :",req.body.name);
    console.log("user data from session:",req.session.userData);
    const success = await sentOTP(email,generateOTP);
        
            res.redirect('/verifyOTP') 
            console.log("deleting otp after 30 seconds")
            setTimeout(() => {
                delete req.session.userData.generateOTP
                req.session.save()
                console.log(req.session.userData)
            }, 30000);
            
    }
            }catch(err){
                console.log(err);
    }
}



const sentOTP = async (email,OTP)=>{

    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.email,
            pass: process.env.password
            
        }     
    })
    
    const mailOptions = {
        from: process.env.email,
        to: email,
        subject: 'Your OTP for Verification',
        text: `Dear,\n Your OTP for verification is: ${OTP}\n\nThis OTP will expire in 5 minutes.\n\nRegards,\nYour Application`
    }

    transporter.sendMail(mailOptions,function(error, info){
        if (error) {
            console.log(error)
            return false;
        } else {
            console.log('Email sent' + info.response);
            return true;
        }
    })
}

const resendOtp = async(req,res)=>{
    try {
        const OTP = otpGenerator.generate(6,{
            digits:true,
            lowerCaseAlphabets:false,
            upperCaseAlphabets:false,
            specialChars:false
        });
        console.log(OTP)
        sentOTP(req.session.userData.email,OTP)
    
         req.session.userData.generateOTP=OTP
         req.session.save()
    

    } catch (error) {
        console.log(error.message)
    }
    

    
}

const insertUser = async( req, res)=>{
    try {
        console.log(req.session.userData.generateOTP)
        console.log(req.body.otp)
        if(req.session.userData.generateOTP === req.body.otp){
        const user = new userModel({
            name: req.session.userData.name,
            email: req.session.userData.email,
            mobile: req.session.userData.mobile,
            password: req.session.userData.password
        })
      
       const userDa = await user.save();
       console.log("userdata saved",userDa);
       res.redirect('/login');
    }else{
        res.render('verifyOTP',{ message: ('Enter valid OTP') })
    }

}catch (error) {
    console.log(error.message)
}
}


const loadLogin = async(req, res)=>{    
    res.render('login',{message: 'Email Registered'})
}

const verifyLogin = async(req, res)=>{
   try {
    const email = req.body.email
    const password = req.body.password
    const userData = await userModel.findOne({email:email,is_admin:0})

    if(userData){
        if(userData.is_Blocked === 0){
        const passwordMatch = await bcrypt.compare(password,userData.password)
        if (passwordMatch) {
            req.session.userid = userData._id
            console.log('session-----------',req.session.userid)
            res.redirect('/home')
        } else {
            res.render('login',{message : 'Incorrect Email and Password.'})
        }
    }else{
        res.render('login',{message : 'This Account is Blocked'}) 
    }
        
    }else{
        res.render('login',{message : 'Incorrect Email and Password.'})
    }
   } catch (error) {
    console.log(error.message)
   }
}

const loadHome = async(req, res)=>{
    console.log("passport",req.session.passport);
    if(req.session.passport){
        req.session.userid = req.session.passport.user;
    }
    console.log("userid",req.session.userid);

    res.render('index')
}


// UserProfile Details

const loadUserProfile = async(req, res)=>{
    try {
        const id = req.session.userid
        const user = await userModel.findById(req.session.userid)
        console.log(user.name)
        const addressData = await addressModel.findOne({ user: req.session.userid });
        const cartData = await cartModel.findOne({ owner: req.session.userid }).populate({ path: 'items.ProductId', model: 'Product' });
        const orderData = await orderModel.find({user: req.session.userid}).sort({orderDate:-1})
        console.log('OrderDataaaaa',orderData);
        res.render('userprofile',{user:user, address:addressData, orders:orderData})
    } catch (error) {
        console.log(error.message);
    }
}

const editUserDetails = async(req,res)=>{
   try {
    const id = req.session.userid || req.session.passport
    const user = await userModel.findById(id)

    const editUserDetails = {
        name: req.body.name,
        mobile: req.body.mobile
    }

    const updatedUserDetails = await userModel.findByIdAndUpdate(id, editUserDetails, { new : true })

    if (!updatedUserDetails) {
        return res.status(404).send("Product not found");
    }

    res.redirect("/user-profile");
   } catch (error) {
        console.log(error.message)
   }
}


// Shop Details

const loadShop = async(req, res)=>{
    try {
        let query = { is_deleted : false}
        let category= req.query.category
        let searchQuery = req.query.search || '';
        const page = parseInt(req.query.page) || 1;
        console.log(page,'page...............');
        const limit = 9; 
        const skip = (page - 1) * limit;
        console.log(skip,'skip.............................')
        

        const totalProducts = await productModel.countDocuments();

        

        if (searchQuery) {
            query = {$or: [
                { "Category._id": { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } },
                { name: { $regex: searchQuery, $options: 'i' } }
            ]
        }
    }

        const totalPages = Math.ceil(totalProducts / limit);
    
        let sortOption = {}
        switch(req.query.sort){
            case 'priceAsc':
                sortOption = { price : 1}
                break;
            case 'priceDsc':
                sortOption = { price: -1 }
                break;
            case 'nameAsc':
                sortOption = { name: 1}
                break;
            case 'nameDsc':
                sortOption = { name: -1}
                break;
            default : 
                sortOption = { name: 1}
        } 
        const productData = await productModel.find(query).skip(skip).sort(sortOption).limit(limit).populate('category')
        console.log(productData,'propdudatat..............................');
        console.log(productData)
        res.render('shop', { 
            product: productData ,
            currentPage: page,
            search:searchQuery,
            totalPages,
            totalProducts,
            startIndex: skip,
            endIndex: skip + productData.length});
    } catch (error) {
        console.log(error.message);
    }
}


const loadShopDetails = async(req, res)=>{
    try {
        const productid = req.query.productid
        const productData = await productModel.findById(productid)
        console.log(productData);
        res.render('shop-details',{product:productData})
    } catch (error) {
        console.log(error.message);
    }
}


const loadForgotPassword = async(req, res)=>{
    try {
        res.render('forgot-password')
    } catch (error) {
        console.log(error.message);
    }
}

    const ForgotVerify = async(req, res)=>{
        try {
            const email = req.body.email
            const userData = await userModel.findOne({email:email})
            if(!userData){
                return res.render('forgot-password',{message:"Invalid Email"})
            }else{
            const randomString = randomstring.generate();
            const updateData = await userModel.updateOne({email:email},{$set:{token:randomString}})
            const mailSent = await sentResetLinkMail(userData.name, userData.email, randomString);
            if (mailSent) {
                res.render('forgot-password', { message: "Please Check Your Email to reset your password" });
            } else {
                res.render('forgot-password', { message: "Error sending reset email. Please try again." });
            }
            }
        } catch (error) {
            console.log(error.message);
        }
    }

    const sentResetLinkMail = async (name,email,token)=>{

        const transporter = nodemailer.createTransport({
            host:'smtp.gmail.com',
            port:587,
            secure:false,
            requireTLS:true,
            auth: {
                user: process.env.email,
                pass: process.env.password
                
            }     
        })
        
        const mailOptions = {
            from: process.env.email,
            to: email,
            subject: 'For Reset Password',
            html:'<p>Dear '+name+',<br>please click here to <a href="http://localhost:8100/reset-password?token='+token+'"</a>Reset your password.</P><br><p>from,<br>ZenoX Hub</p>'
        }

        return new Promise((resolve, reject) => {
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.error('Error sending email:', error);
                    resolve(false);
                } else {
                    console.log('Email sent:', info.response);
                    resolve(true);
                }
            });
        });
    }

const loadResetPassword = async(req, res)=>{
    try {
        const token = req.query.token
        const tokenData = await userModel.findOne({token:token})
        if(tokenData){
        res.render('reset-password',{user_id:tokenData._id})
        }
    } catch (error) {
        console.log(error.message);
    }
}

const resetPassword = async(req, res)=>{
    try {
       const password = req.body.password
       const user_id = req.body.user_id

       const sPassword = await securePassword(password)

       const updatePassword = await userModel.findByIdAndUpdate({_id:user_id},{$set:{password:sPassword, token:''}})
       res.redirect('/login')
    } catch (error) {
        console.log(error.message);
    }
}


const error = async(req,res)=>{
    try {
       const error = new Error()
       res.render('error')
    } catch (error) {
       console.log(error.message)
    }
}

const logout = async(req,res)=>{
    try {
       req.session.destroy()
       res.render('login',{message:'Logout Successfully'})
    } catch (error) {
       console.log(error.message)
    }
}

module.exports = {
    loadRegister,
    insertUser,
    getOTP,
    sentOTP,
    resendOtp,
    loadVerifyOtp,
    loadLogin,
    verifyLogin,
    loadHome,
    loadUserProfile,
    editUserDetails,
    loadShop,
    loadShopDetails,
    loadForgotPassword,
    ForgotVerify,
    loadResetPassword,
    resetPassword,
    error,
    logout
}