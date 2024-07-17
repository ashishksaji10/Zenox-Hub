const adminModel = require('../model/userModel')
const cartModel = require('../model/cartModel')
const userModel = require('../model/userModel')
const productModel = require('../model/productModel');
const addressModel = require('../model/addressModel');
const orderModel = require('../model/orderModel');
const bcrypt = require('bcrypt');
const bestSelling = require('../controller/statisticsController')
const walletModel = require('../model/walletModel')


// Login and Verify
const loadAdminLogin = async(req, res)=>{
    res.render('adminLogin')
}

const verifyLogin = async(req, res)=>{
    const email = req.body.email
    const password = req.body.password
    const adminData = await adminModel.findOne({email:email,is_admin:1})
    if(adminData){
        const passwordMatch = await bcrypt.compare(password,adminData.password)
        if (passwordMatch) {
            req.session.adminid = adminData._id;
            res.redirect('/admin/dashboard')
        } else {
            res.render('adminLogin',{message : 'Check your Email and Password'})
        }
    }else{
        res.render('adminLogin',{message : 'Check your Email and Password'})
    }
}

const loadDashboard = async(req,res)=>{
    try {
        const userData = await userModel.find({is_admin:1})
        const users=  await userModel.find({})
        const products = await productModel.find({})
        const usersCount = await userModel.find().countDocuments()
        const productsCount = await productModel.find().countDocuments()

        const confirmedOrders = await orderModel.aggregate([
            { $match:{status:"Delivered"}},
            {
            $group:{
                _id:null,
                count:{$sum:1},
                totalRevenue:{$sum:"$billTotal"}

            }
        }
        ]).exec()

        const ordersCount= await orderModel.find({
            status:"Pending",
        }).countDocuments()

        //bestSelling

        let bestSellingProducts = await bestSelling.getBestSellingProducts()
        let bestSellingBrands = await bestSelling.getBestSellingBrands()
        let bestSellingCategories = await bestSelling.getBestSellingCategories()
        res.render('adminhome',
            {
            // username : userData.name,
            users,
            products,
            usersCount,
            ordersCount,
            productsCount,
            bestSellingBrands,
            bestSellingProducts,
            bestSellingCategories,
            totalRevenue: confirmedOrders[0] ? confirmedOrders[0].totalRevenue : 0,
            admin: userData,
            }
        )
    } catch (error) {
        console.log("Error whiler rendering admin Home",error.message)
    }
}

const getBestSelling = async(req,res)=>{
    try {
        const userData = await userModel.findById(req.session.userid)
        const users=  await userModel.find({})
        const products = await productModel.find({})
        const usersCount = await userModel.find().countDocuments()
        const productsCount = await productModel.find().countDocuments()

        const confirmedOrders = await  orderModel.aggregate([
            { $match:{status:"Delivered"}},
            {
            $group:{
                _id:null,
                count:{$sum:1},
                totalRevenue:{$sum:"$billTotal"}

            }
        }
        ]).exec()

        const ordersCount= await orderModel.find({
            status:"Pending",
        }).countDocuments()

        //bestSelling

        let bestSellingProducts = await bestSelling.getBestSellingProducts()
        let bestSellingBrands = await bestSelling.getBestSellingBrands()
        let bestSellingCategories = await bestSelling.getBestSellingCategories()
        res.render('bestSelling',
            {
            // username : userData.name,
            users,
            products,
            usersCount,
            ordersCount,
            productsCount,
            bestSellingBrands,
            bestSellingProducts,
            bestSellingCategories,
            totalRevenue: confirmedOrders[0] ? confirmedOrders[0].totalRevenue : 0,
            admin: userData,
            }
        )
    } catch (error) {
        console.log("Error whiler rendering admin Home",error.message)
    }
}

const getChartData = async (req, res) => {
    try {
        const timeBaseForSalesChart = req.query.salesChart;
        const timeBaseForOrderNoChart = req.query.orderChart;
        const timeBaseForOrderTypeChart = req.query.orderType;
        const timeBaseForCategoryBasedChart = req.query.categoryChart;

        function getDatesAndQueryData(timeBaseForChart, chartType) {
            let startDate, endDate;
            let groupingQuery, sortQuery;

            if (timeBaseForChart === "yearly") {
                startDate = new Date(new Date().getFullYear(), 0, 1);
                endDate = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999);

                groupingQuery = {
                    _id: {
                        month: { $month: { $toDate: "$createdAt" } },
                        year: { $year: { $toDate: "$createdAt" } }
                    },
                    totalSales: { $sum: "$billTotal" },
                    totalOrder: { $sum: 1 }
                };
                sortQuery = { "_id.year": 1, "_id.month": 1 };
            }

            if (timeBaseForChart === "weekly") {
                startDate = new Date();
                endDate = new Date();

                const timeZoneOffset = startDate.getTimezoneOffset();

                startDate.setDate(startDate.getDate() - 6);
                startDate.setUTCHours(0, 0, 0, 0);
                startDate.setUTCMinutes(startDate.getUTCMinutes() + timeZoneOffset);

                endDate.setUTCHours(0, 0, 0, 0);
                endDate.setDate(endDate.getDate() + 1);
                endDate.setUTCMinutes(endDate.getUTCMinutes() + timeZoneOffset);

                groupingQuery = {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    totalSales: { $sum: "$billTotal" },
                    totalOrder: { $sum: 1 }
                };

                sortQuery = { _id: 1 };
            }

            if (timeBaseForChart === "daily") {
                startDate = new Date();
                endDate = new Date();

                const timezoneOffset = startDate.getTimezoneOffset();

                startDate.setUTCHours(0, 0, 0, 0);
                endDate.setUTCHours(0, 0, 0, 0);
                endDate.setDate(endDate.getDate() + 1);

                startDate.setUTCMinutes(startDate.getUTCMinutes() + timezoneOffset);
                endDate.setUTCMinutes(endDate.getUTCMinutes() + timezoneOffset);

                groupingQuery = {
                    _id: { $hour: "$createdAt" },
                    totalSales: { $sum: "$billTotal" },
                    totalOrder: { $sum: 1 }
                };

                sortQuery = { "_id.hour": 1 };
            }

            if (chartType === "sales") {
                return { groupingQuery, sortQuery, startDate, endDate };
            } else if (chartType === "orderType") {
                return { startDate, endDate };
            } else if (chartType === "categoryBasedChart") {
                return { startDate, endDate };
            } else if (chartType === "orderNoChart") {
                return { groupingQuery, sortQuery, startDate, endDate };
            }
        }

        const salesChartInfo = getDatesAndQueryData(timeBaseForSalesChart, "sales");
        const orderChartInfo = getDatesAndQueryData(timeBaseForOrderTypeChart, "orderType");
        const categoryBasedChartInfo = getDatesAndQueryData(timeBaseForCategoryBasedChart, "categoryBasedChart");
        const orderNoChartInfo = getDatesAndQueryData(timeBaseForOrderNoChart, "orderNoChart");
        
        const salesChartData = await orderModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: salesChartInfo.startDate, $lte: salesChartInfo.endDate },
                    status: { $nin: ["Canceled", "Failed", "Refunded"] },
                    paymentStatus: { $nin: ["Pending", "Processing", "Canceled", "Returned"] }
                }
            },
            { $group: salesChartInfo.groupingQuery },
            { $sort: salesChartInfo.sortQuery }
        ]).exec();

        const orderNoChartData = await orderModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: orderNoChartInfo.startDate, $lte: orderNoChartInfo.endDate },
                    status: { $nin: ["Canceled", "Returned"] },
                    paymentStatus: { $nin: ["Pending", "Failed", "Refunded", "Cancelled"] }
                }
            },
            { $group: orderNoChartInfo.groupingQuery },
            { $sort: orderNoChartInfo.sortQuery }
        ]).exec();

        const orderChartData = await orderModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: orderChartInfo.startDate, $lte: orderChartInfo.endDate },
                    status: { $nin: ["Pending", "Processing", "Canceled", "Returned"] },
                    paymentStatus: { $nin: ["Pending", "Refunded", "Cancelled", "Failed"] }
                }
            },
            { $group: { _id: "$paymentMethod", totalOrder: { $sum: 1 } } }
        ]).exec();

        const categoryWiseChartData = await orderModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: categoryBasedChartInfo.startDate, $lte: categoryBasedChartInfo.endDate },
                    status: { $nin: ["Pending", "Processing", "Canceled", "Returned"] },
                    paymentStatus: { $nin: ["Pending", "Failed"] }
                }
            },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "productInfo"
                }
            },
            { $unwind: "$productInfo" },
            {
                $lookup: {
                    from: "categories",
                    localField: "productInfo.category",
                    foreignField: "_id",
                    as: "catInfo"
                }
            },
            { $addFields: { categoryInfo: { $arrayElemAt: ["$catInfo", 0] } } },
            { $addFields: { catName: "$categoryInfo.name" } },
            { $group: { _id: "$catName", count: { $sum: 1 } } }
        ]).exec();

        let saleChartInfo = {
            timeBasis: timeBaseForSalesChart,
            data: salesChartData
        };

        let orderTypeChartInfo = {
            timeBasis: timeBaseForOrderTypeChart,
            data: orderChartData
        };

        let categoryChartInfo = {
            timeBasis: timeBaseForCategoryBasedChart,
            data: categoryWiseChartData
        };

        let orderQuantityChartInfo = {
            timeBasis: timeBaseForOrderNoChart,
            data: orderNoChartData
        };

        return res.status(200).json({
            saleChartInfo,
            orderTypeChartInfo,
            categoryChartInfo,
            orderQuantityChartInfo
        });
        
    } catch (error) {
        console.log("error while getting chart Data", error.message);
        return res.status(500).json({ error: "Something went wrong" });
    }
}


// block and Unblock User
const loadUserlist = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 8;
        const skip = (page - 1) * limit;

        const users = await adminModel.find({ is_admin: 0 }).skip(skip).limit(limit);
        const totalUsers = await adminModel.countDocuments({ is_admin: 0 });

        res.render('userlist', {
            users: users,
            currentPage: page,
            totalPages: Math.ceil(totalUsers / limit),
            limit
        });
    } catch (error) {
        console.log(error.message);
    }
};



const blockUser = async(req,res)=>{
    try {
        const id = req.query.id
        const user = await adminModel.findById(id)
        if(user){
            user.is_Blocked = 1
            user.save()
            res.redirect('/admin/userlist')
        }
    } catch (error) {
        console.log(error.message);
    }
}
const unBlockUser = async(req,res)=>{
  try {
    const id = req.query.id
    const user = await adminModel.findById(id)
    if(user){
        user.is_Blocked = 0
        user.save()
        res.redirect('/admin/userlist')  
    }
  } catch (error) {
    console.log(error)
  }
}
  
// Orders Section
const loadOrders = async(req, res) => {
    try {
        const itemsPerPage = 10; 
        const currentPage = parseInt(req.query.page) || 1; 

        const orderData = await orderModel.find({})
            .populate('user')
            .sort({orderDate:-1})
            .skip((currentPage - 1) * itemsPerPage)
            .limit(itemsPerPage);

        const totalOrders = await orderModel.countDocuments();

        const totalPages = Math.ceil(totalOrders / itemsPerPage);

        res.render('orders', { order : orderData, currentPage, totalPages });
    } catch (error) {
        console.log(error.message);
    }
};



const loadOrderDetails = async(req, res)=>{
    try {
        const order_id = req.query.id
        
        const orderData = await orderModel.findById(order_id).populate('user')
        
        
        res.render('adminorderdetails',{orders:orderData})
    } catch (error) {
        console.log(error.message);
    }
}

const requestAccept = async (req, res) => {
    try {
      const { orderId, userId } = req.body;

      const canceledOrder = await orderModel.findOne({ oId: orderId });

      if (!canceledOrder) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
  
      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
  
      for (const orderItem of canceledOrder.items) {
        let product = await productModel.findById(orderItem.productId).exec();
  
        if (product) {
          product.countInStock += Number(orderItem.quantity);
          await product.save();
        }
      }
  
  
    for (let request of canceledOrder.requests) {
        if (request.status === 'Pending' && request.type === 'Cancel') {
          const newStatus = 'Cancelled';
          

        const value = await orderModel.findOne({ oId: orderId });
        value.status = newStatus;
        
        value.requests.forEach(request=>{
          request.status = 'Accepted';
        })

        await value.save();
        }
        if (request.status === 'Pending' && request.type === 'Return') {
          const newStatus = 'Returned';

        const value = await orderModel.findOne({ oId: orderId });
        value.status = newStatus;
        
        value.requests.forEach(request=>{
          request.status = 'Accepted';
          
        })
        await value.save();

        const orderData = await orderModel.findOne({oId: orderId})

        if(orderData.paymentMethod==='Razorpay'|| orderData.paymentMethod==='wallet'){
            let wallet=await walletModel.findOne({user:userId});
            if(!wallet){
               wallet=new walletModel({
                user:userId,
                amount:0,
                orders:[]
              });
            }
              wallet.amount+=orderData.billTotal;
              if(orderData.paymentMethod==='Razorpay'){
              wallet.orders.push(orderData._id);
            }
            await wallet.save()
            }
        
        }
      }
  
       return res.status(200).json({ success: true, message: 'Order status updated successfully' });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const requestCancel = async(req,res)=>{
  try {
      const { orderId} = req.body;
      const Order = await orderModel.findOne({oId:orderId});


          if (!Order) {
              return res.status(404).json({ success: false, message: 'Order not found' });
          }
      
      for (const orderItem of Order.items) {
          const product = await productModel.findById(orderItem.productId);

          if (product &&product.countInStock>0 ) {
              await product.save();
          }
      }

      Order.requests.forEach(request=>{
        request.status = 'Rejected';
      })
      
      await Order.save();

      
  if (Order) {
    return res.status(200).json({ success: true, message: 'Order status rejected'})
  }
  return res.status(201).json({ success: true, message: 'Order status updated successfully' });
 
   }catch (error) {
      console.error(error);
      res.status(500).json({ status: false, message: 'Internal server error' });
  }
}

const updateOrder = async(req, res)=>{
    try {
        const {orderId, newStatus}=req.body
        const orderDetails = await orderModel.findOne({oId:orderId})
        if (newStatus === 'Shipped') {
            for (const orderItem of orderDetails.items) {
                const product = await productModel.findById(orderItem.productId);
    
                if (product) {
                    product.countInStock -= orderItem.quantity;
                    await product.save();
                }
            }
        } else if(newStatus==='Canceled' || newStatus === 'Returned'){
              for (const orderItem of orderDetails.items) {
                  let product = await productModel.findById(orderItem.productId);
      
                  if (product) {
                      product.countInStock += orderItem.quantity;
                      await product.save();
                  }
              }}

        const updateOrderDetail = await orderModel.findOneAndUpdate({oId:orderId},{
            $set:{ status: newStatus } },
            {new:true}) 
             
            updateOrderDetail.save();

            if(!updateOrderDetail){
                return res.status(500).json({ success: false, message: "Failed to update order status" });
            }

            return res.status(200).json({success:true,message:'The order status has been updated successfully',updateOrderDetail})
    } catch (error) {
        console.log(error.message);
    }
}

const loadSalesReport = async (req, res) => {
    try {

        const itemsPerPage = 10; 
        const currentPage = parseInt(req.query.page) || 1

        const salesData = await orderModel.aggregate([
            {
                $match: { status: "Delivered" }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "productNew"
                }
            },
            {
                $unwind: "$items"
            },
            {
                $unwind: "$productNew"
            },
            {
                $group: {
                    _id: "$_id",
                    oId: { $first: "$oId" },
                    user: { $first: "$user.name" },
                    orderDate: { $first: "$orderDate" },
                    paymentMethod: { $first: "$paymentMethod" },
                    status: { $first: "$status" },
                    coupon: { $first: "$coupon" },
                    products: { 
                        $push: {
                            name: "$productNew.name",
                            quantity: "$items.quantity",
                            price: "$productNew.price",
                            discountPrice: "$productNew.discountPrice"
                        }
                    },
                    billTotal: { $first: "$billTotal" },
                    totalDiscount: { $sum: "$productNew.discountPrice" }
                }
            },
            { $sort: { orderDate: -1 } }
        ]);

        let totalRegularPrice = 0
        let totalSalesPrice = 0;
        

        salesData.forEach((sale) => {
            sale.products.forEach((product) => {
                totalRegularPrice += product.price * product.quantity;
            });
        });

        const totalDiscount = salesData.reduce((sum, order) => sum + order.totalDiscount, 0);
        salesData.forEach((sale) => {
            totalSalesPrice += sale.billTotal;
        });

        const totalDiscountPrice = totalRegularPrice - totalSalesPrice;

        const totalSales = salesData.length;
        const totalPages = Math.ceil(totalSales / itemsPerPage);

      
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = currentPage * itemsPerPage;
        const salesDataPerPage = salesData.slice(startIndex, endIndex);

        res.render("salesReport", {totalSalesPrice, totalRegularPrice, totalDiscountPrice,salesData: salesDataPerPage, totalPages, currentPage });
    } catch (error) {
        console.log(error.message);
    }
};

const filterReport = async (req, res, next) => {
  try {

        const itemsPerPage = 10; 
        const currentPage = parseInt(req.query.page) || 1  

        const receivedData = req.body.timePeriod;
        
        let startDate, endDate;

      if (receivedData === 'week') {
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0); 
          startDate.setDate(startDate.getDate() - startDate.getDay());

          endDate = new Date();
          endDate.setHours(23, 59, 59, 999);
          endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
      } else if (receivedData === 'month') {
          startDate = new Date();
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);

          endDate = new Date();
          endDate.setMonth(endDate.getMonth() + 1);
          endDate.setDate(0);
          endDate.setHours(23, 59, 59, 999);
      } else if (receivedData === 'year') {
          startDate = new Date();
          startDate.setMonth(0);
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);

          endDate = new Date();
          endDate.setMonth(11);
          endDate.setDate(31);
          endDate.setHours(23, 59, 59, 999);
      } else if (receivedData === 'day') {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          startDate = new Date(today);
          endDate = new Date(today);
          endDate.setDate(today.getDate() + 1);
      } else if (receivedData === 'all') {
          startDate = new Date(0);
          endDate = new Date();
      } else {
          throw new Error('Invalid time period');
      }

      const salesData = await orderModel.aggregate([
          {
              $match: { 
                  orderDate: { $gte: startDate, $lte: endDate },
                  status: "Delivered"
              }
          },
          {
              $lookup: {
                  from: "users",
                  localField: "user",
                  foreignField: "_id",
                  as: "user"
              }
          },
          { $unwind: "$user" },
          {
              $lookup: {
                  from: "products",
                  localField: "items.productId",
                  foreignField: "_id",
                  as: "productNew"
              }
          },
          { $unwind: "$items" },
          { $unwind: "$productNew" },
          {
              $group: {
                  _id: "$_id",
                  oId: { $first: "$oId" },
                  user: { $first: "$user.name" },
                  orderDate: { $first: "$orderDate" },
                  paymentMethod: { $first: "$paymentMethod" },
                  status: { $first: "$status" },
                  coupon: { $first: "$coupon" },
                  products: {
                      $push: {
                          name: "$productNew.name",
                          quantity: "$items.quantity",
                          price: "$productNew.price",
                          discountPrice: "$productNew.discountPrice"
                      }
                  },
                  billTotal: { $first: "$billTotal" },
                  totalDiscount: { $sum: "$productNew.discountPrice" }
              }
          },
          { $sort: { orderDate: -1 } }
      ]);

      let totalRegularPrice = 0
        let totalSalesPrice = 0;
        

        salesData.forEach((sale) => {
            sale.products.forEach((product) => {
                totalRegularPrice += product.price * product.quantity;
            });
        });

        const totalDiscount = salesData.reduce((sum, order) => sum + order.totalDiscount, 0);
        salesData.forEach((sale) => {
            totalSalesPrice += sale.billTotal;
        });

        const totalDiscountPrice = totalRegularPrice - totalSalesPrice;

        const totalSales = salesData.length;
        const totalPages = Math.ceil(totalSales / itemsPerPage);

      
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = currentPage * itemsPerPage;
        const salesDataPerPage = salesData.slice(startIndex, endIndex);

        res.render("salesReport", {totalSalesPrice, totalRegularPrice, totalDiscountPrice,salesData: salesDataPerPage, totalPages, currentPage });
  } catch (error) {
      console.error("Error in filter report: ", error);
      next(error);
  }
};

  
  const filterCustomDateOrder = async (req, res, next) => {
    try {

        const itemsPerPage = 10; 
        const currentPage = parseInt(req.query.page) || 1  

        const { startingDate, endingDate } = req.body;

        const startDate = new Date(startingDate);
        const endDate = new Date(endingDate);
        
        endDate.setDate(endDate.getDate() + 1);

        const salesData = await orderModel.aggregate([
            {
                $match: {
                    orderDate: { $gte: startDate, $lt: endDate },
                    status: "Delivered"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "productNew"
                }
            },
            { $unwind: "$items" },
            { $unwind: "$productNew" },
            {
                $group: {
                    _id: "$_id",
                    oId: { $first: "$oId" },
                    user: { $first: "$user.name" },
                    orderDate: { $first: "$orderDate" },
                    paymentMethod: { $first: "$paymentMethod" },
                    status: { $first: "$status" },
                    coupon: { $first: "$coupon" },
                    products: {
                        $push: {
                            name: "$productNew.name",
                            quantity: "$items.quantity",
                            price: "$productNew.price",
                            discountPrice: "$productNew.discountPrice"
                        }
                    },
                    billTotal: { $first: "$billTotal" },
                    totalDiscount: { $sum: "$productNew.discountPrice" }
                }
            },
            { $sort: { orderDate: -1 } }
        ]);

        let totalRegularPrice = 0
        let totalSalesPrice = 0;
        

        salesData.forEach((sale) => {
            sale.products.forEach((product) => {
                totalRegularPrice += product.price * product.quantity;
            });
        });

        const totalDiscount = salesData.reduce((sum, order) => sum + order.totalDiscount, 0);
        salesData.forEach((sale) => {
            totalSalesPrice += sale.billTotal;
        });

        const totalDiscountPrice = totalRegularPrice - totalSalesPrice;

        const totalSales = salesData.length;
        const totalPages = Math.ceil(totalSales / itemsPerPage);

      
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = currentPage * itemsPerPage;
        const salesDataPerPage = salesData.slice(startIndex, endIndex);

        res.render("salesReport", {totalSalesPrice, totalRegularPrice, totalDiscountPrice,salesData: salesDataPerPage, totalPages, currentPage });
    } catch (error) {
        console.error("Error in filterCustomDateOrder: ", error);
        next(error);
    }
};



// Logout
const logout = async(req,res)=>{
    try {
        req.session.destroy()
        res.redirect('/admin')
    } catch (error) {
        console.log(error.message);
    }
}


module.exports = {
    loadAdminLogin,
    verifyLogin,
    loadUserlist,
    blockUser,
    logout,
    unBlockUser,
    loadDashboard,
    loadOrders,
    loadOrderDetails,
    requestAccept,
    requestCancel,
    updateOrder,
    loadSalesReport,
    filterReport,
    filterCustomDateOrder,
    getBestSelling,
    getChartData 
}