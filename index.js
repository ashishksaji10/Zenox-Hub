require('dotenv').config({path:'./config/.env'})
const express = require('express')
const app = express();
const logger = require('morgan')
const mongoose = require('mongoose')
const session = require('express-session')
const flash = require('connect-flash')
const nocache = require('nocache')
const passport = require('passport');
const auth = require('./config/auth')

const {initializingPassport} = require("./config/passportConfig")
initializingPassport(passport)
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(nocache())


app.use(session({
    secret: process.env.sessionSecret,
    resave: false,
    saveUninitialized: true
}))
app.use(passport.initialize());
app.use(passport.session())

app.set('view engine', 'ejs')

app.use(flash())

mongoose.connect(process.env.mongourl)

const port = process.env.PORT || 4500
app.use(logger('dev'))


// Importing Route
const userRoute = require('./routes/userRoute')
const adminRoute = require('./routes/adminRoute');


app.use('/',userRoute)
app.use('/admin',adminRoute)

app.get('/auth/google',passport.authenticate('google',{ scope : ['email', 'profile']}))

app.get('/google/callback',passport.authenticate('google',{
    successRedirect:'/home',
    failureRedirect:'/login'
}))

app.listen(port,()=>{
    console.log(`http://localhost:${port}/login`)
})