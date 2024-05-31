const User = require('../model/userModel'); 
const isLoggedIn = async (req, res, next) => {
    try {
        if (req.session.adminid) {
            const userId = req.session.adminid;
            console.log(userId);
            const user = await User.findById(userId);
                if (user.is_admin === 1) {
                    next(); // Allow admin users to proceed
                } else {
                    req.session.destroy()
                    res.redirect('/login'); // Redirect non-admin users to user index page
                }
            } else {
                
                res.redirect('/admin/'); // Redirect to admin login if user not found
            }
    } catch (error) {
        console.log("Error", error.message);
        res.redirect('/admin/'); // Redirect to admin login if error occurs
    }
}

const isLoggedOut = async (req, res, next) => {
    try {
        if (req.session.adminid) {
            res.redirect('/admin/dashboard');
        } else {
            next();
        }
    } catch (error) {
        console.log("Error abc", error.message);
    }
}

const preventCache = (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
}

module.exports = {
    isLoggedIn,
    isLoggedOut,
    preventCache
}