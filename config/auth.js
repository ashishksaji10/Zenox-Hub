require('dotenv').config({path:'./config/.env'})
const passport = require('passport')
const userModel = require('../model/userModel')
const GoogleStrategy = require( 'passport-google-oauth20' ).Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:8100/google/callback",
  },
  async function(request, accessToken, refreshToken, profile, done) {
    try {
        const name = profile.displayName
        const email = profile.emails[0].value;
        const mobile = profile.phoneNumbers ? profile.phoneNumbers[0].value:null

        let user = await userModel.findOne({email:email})

        if(user){
            return done(null,user);
        }else{
            // Create a new user if they don't exist
            const user = new userModel({
                name: name,
                email: profile.emails[0].value,
                mobile: mobile,
                is_verified: 1,
                is_admin: 0,
            })

            const userData = await user.save()

            if(userData){
                return done(null,userData)
               }
               else{
                return done(null,false,{message:'Failed to save user'})
               }
        }
    } catch (error) {
        console.log("Error iserting user details",error.message)
        return done(error)
    }
  }
));

passport.serializeUser((user, done)=>{
    done(null, user.id)
})
passport.deserializeUser(async(id, done)=>{
    try {
        const user = await userModel.findById(id)
    done(null, user);
    
    } catch (error) {
        console.log("Error deserializing user", error.message);
        done(error);
    }
})