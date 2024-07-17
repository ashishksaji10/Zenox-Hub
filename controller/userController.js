const userModel = require('../model/userModel')
const productModel = require('../model/productModel')
const categoryModel = require('../model/categoryModel')
const addressModel = require('../model/addressModel');
const orderModel = require('../model/orderModel');
const cartModel = require('../model/cartModel')
const passport = require("../config/auth");
const productOfferModel = require('../model/productOfferModel');
const categoryOfferModel = require('../model/categoryOfferModel')
const easyinvoice = require('easyinvoice')


const bcrypt = require('bcrypt')
const otpGenerator = require('otp-generator')
const nodemailer = require('nodemailer')
const flash = require('express-flash');
const { session } = require('passport');
const { name } = require('ejs');
const Category = require('../model/categoryModel');
const randomstring = require('randomstring');
const walletModel = require('../model/walletModel');

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
    const success = await sentOTP(email,generateOTP);
        
            res.redirect('/verifyOTP') 
            setTimeout(() => {
                delete req.session.userData.generateOTP
                req.session.save()
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
            return false;
        } else {
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

        sentOTP(req.session.userData.email,OTP)
    
         req.session.userData.generateOTP=OTP
         req.session.save()
    

    } catch (error) {
        console.log(error.message)
    }
    

    
}

const insertUser = async( req, res)=>{
    try {
        if(req.session.userData.generateOTP === req.body.otp){
        const user = new userModel({
            name: req.session.userData.name,
            email: req.session.userData.email,
            mobile: req.session.userData.mobile,
            password: req.session.userData.password
        })
      
       const userDa = await user.save();
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

    try {
        const ProductData = await productModel.find({})
        if(req.session.passport){
            req.session.userid = req.session.passport.user;
        }
        const user = req.session.userid ? req.session.userid : undefined;
        res.render('index', { user, product: ProductData })
    }
    catch (error) {
        console.log("Error while  rendering the Home-page", error.message)
    }

}


// UserProfile Details

const loadUserProfile = async (req, res) => {
    try {
        const id = req.session.userid;
        const user = await userModel.findById(id);
        const wallet = await walletModel.findOne({user:id}).populate('orders')
        const addressData = await addressModel.findOne({ user: id });
        const cartData = await cartModel.findOne({ owner: id }).populate({ path: 'items.ProductId', model: 'Product' });

        // Pagination logic
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const totalOrders = await orderModel.countDocuments({ user: id });
        const totalPages = Math.ceil(totalOrders / limit);

        const orderData = await orderModel.find({ user: id }).sort({ orderDate: -1 }).skip(skip).limit(limit);

        res.render('userprofile', {
            user: user,
            address: addressData,
            orders: orderData,
            wallet: wallet,
            currentPage: page ,
            totalPages: totalPages,
            limit
        });
    } catch (error) {
        console.log(error.message);
    }
};


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

    const loadShop = async(req, res) => {
    try {
        let query = { is_deleted: false };
        let categoryid = req.query.id;
        let searchQuery = req.query.search || '';
        const page = parseInt(req.query.page) || 1;
        const limit = 9;
        const skip = (page - 1) * limit;

        if (categoryid) {
            query.category = categoryid;
        }

        if (searchQuery) {
            query.$or = [
                { description: { $regex: searchQuery, $options: 'i' } },
                { name: { $regex: searchQuery, $options: 'i' } }
            ];
        }

        const totalProducts = await productModel.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);

        let sortOption = {};
        switch (req.query.sort) {
            case 'priceAsc':
                sortOption = { price: 1 };
                break;
            case 'priceDsc':
                sortOption = { price: -1 };
                break;
            case 'nameAsc':
                sortOption = { name: 1 };
                break;
            case 'nameDsc':
                sortOption = { name: -1 };
                break;
            default:
                sortOption = { name: 1 };
        }

        const productData = await productModel.find(query).skip(skip).sort(sortOption).limit(limit).populate('category');

        res.render('shop', {
            product: productData,
            category: await categoryModel.find({is_Active:true}),
            currentPage: page,
            search: searchQuery,
            totalPages,
            totalProducts,
            startIndex: skip,
            endIndex: skip + productData.length,
            category_id: categoryid,
            sort: req.query.sort
        });
    } catch (error) {
        console.log(error.message);
    }
};



const loadShopDetails = async(req, res)=>{
    try {

        const productid = req.query.productid
        const productData = await productModel.findById(productid)
        const proOffer = await productOfferModel.aggregate([
            {
              $match: {
                'productOffer.product': productData._id,
                'productOffer.offerStatus': true,
                startingDate: { $lte: new Date() },
                endingDate: { $gte: new Date() }
              }
            },
            {
              $group: {
                _id: null,
                totalDiscount: { $sum: "$productOffer.discount" }
              }
            }
          ]);
          const proOfferDiscount = (proOffer.length > 0) ? proOffer[0].totalDiscount : 0;

          const catOffer = await categoryOfferModel.aggregate([
            {
              $match: {
                'categoryOffer.category': productData.category._id,
                is_active: true,
                "categoryOffer.offerStatus": true,
                startingDate: { $lte: new Date() },
                endingDate: { $gte: new Date() },
              }
            },
            {
              $group: {
                _id: null,
                totalDiscount: { $sum: "$categoryOffer.discount" }
              }
            }
          ]);

          const catOfferDis = (catOffer.length > 0) ? catOffer[0].totalDiscount : 0;

        res.render('shop-details',{product:productData,catOfferDis,proOfferDiscount})
        
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

const loadInvoice = async (req, res) => {
    try {
        const id = req.query.id;

        const invoiceId = `ZS-2024-${Math.floor(100000 + Math.random() * 900000)}`;

        const findOrder = await orderModel.findById({ _id: id });

        if (!findOrder) {
            return res.status(404).send('Order not found');
        }

        const proId = [];
        var user = await userModel.findOne({ _id: findOrder.user });

        // Filter out cancelled items
        const activeItems = findOrder.items.filter(item => item.status !== 'Cancelled');

        for (let i = 0; i < activeItems.length; i++) {
            proId.push(activeItems[i].productId);
        }

        const proData = [];

        for (let i = 0; i < proId.length; i++) {
            proData.push(await productModel.findById({ _id: proId[i] }));
        }

        const date = new Date().toDateString();
        res.render("invoice", { proData, activeItems, user, invoiceId, date , findOrder});
    } catch (error) {
        console.log(error.message);
    }
};


const invoice = async (req, res) => {
    try {
      const id = req.query.id;
      const findOrder = await orderModel.findById({ _id: id }).populate({ path: 'items.productId', model: 'Product' });

      var user = await userModel.findOne({_id:findOrder.user});
  
      if (!findOrder) {
        return res.status(404).send('Order not found');
      }
  
      let pdttotal = 0;
      for (let i = 0; i < findOrder.items.length; i++) {
        pdttotal += findOrder.items[i].subTotal;
      }
      const discountAmount = (pdttotal * (findOrder.discount / 100)).toFixed(2);
      const discount = findOrder.discount;
      const vatRate = (discount / 100); 
      const vatAmount = pdttotal * vatRate;
      const totalWithVAT = pdttotal - vatAmount;
      const data = {
        "documentTitle": "INVOICE", 
        "currency": "INR",
        "taxNotation": "gst", 
        "marginTop": 25,
        "marginRight": 25,
        "marginLeft": 25,
        "marginBottom": 25,
        "logo": "adminassets/imgs/brands/7d02989082b082e58141cce8a7536ee3.jpg", 
        "background": "adminassets/imgs/brands/7d02989082b082e58141cce8a7536ee3.jpg", 
        "sender": {
            "company": "Zenox Hub",
            "address": "Brototype Hub, Maradu,Kochi,Ernakulam,Kerala",
            "zip": "682028",
            "city": "Kochi",
            "country": "India" 
        },
        "client": {
            "company": user.name,
            "address": findOrder.deliveryAddress[0].houseNo,
            "Landmark": findOrder.deliveryAddress[0].landmark,
            "district": findOrder.deliveryAddress[0].district,
            "zip": findOrder.deliveryAddress[0].pincode,
            "city": findOrder.deliveryAddress[0].city,
            "country": findOrder.deliveryAddress[0].country 
        },
        "products": findOrder.items.map(item => ({
            "quantity": item.quantity.toString(),
            "description": item.name,
            "price": item.price / item.quantity,
        })),
        "discountApplied": {
            "couponCode": findOrder.coupon        }
      };
  
      const result = await easyinvoice.createInvoice(data);    
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=myInvoice.pdf');
      res.send(Buffer.from(result.pdf, 'base64'));
    } catch (error) {
      console.error('Error generating invoice:', error.message);
      res.status(500).send('Error generating invoice');
    }
};


const loadContact = async(req,res)=>{
    try {
        res.render('contact')
    } catch (error) {
        console.log(error.message);
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
    loadInvoice,
    invoice,
    loadContact,
    logout
}