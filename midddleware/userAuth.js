const userModel = require('../model/userModel'); // Adjust the path accordingly
const isLoggedin = async(req,res,next)=>{
    try {
        const id =req.session.passport?req.session.passport.user:req.session.userid
        const userData = await userModel.findById(id)
        if(req.session.passport){
            if(!userData){
                req.session.destroy()
                return res.redirect('/login');
            }
            if (userData.is_Blocked === 1) {
                req.session.destroy();
                return res.redirect('/login');
              }
          next()
        }
        else if (req.session.userid ) {
            if(!userData){
                req.session.destroy()
                return res.redirect('/login');
            }
            if (userData.is_Blocked === 1) {
                req.session.destroy();
                return res.redirect('/login');
              }
                next(); // Allow non-admin users to proceed
        } else {
            res.redirect('/login'); // Redirect to user login if not logged in
        }
    } catch (error) {
        console.log("Error", error.message);
        res.redirect('/login'); // Redirect to user login if error occurs
    }
}


const isLoggedout = async(req,res,next)=>{
    try {
        if(req.session.passport){
            res.redirect('/home') 
        }
        else if(req.session.userid ){
            res.redirect('/home')
        }else{
            next()
        }
    } catch (error) {
        console.log("Error abc",error.message)
    }
}

const preventCache = (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
}

module.exports={
    isLoggedin,
    isLoggedout,
    preventCache
}