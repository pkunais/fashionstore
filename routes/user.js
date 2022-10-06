var express = require("express");
var router = express.Router();
var productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
const categoryHelper = require("../helpers/add-category")
const offerHelper = require('../helpers/offerHelpers')
var otpVarification = require("../helpers/otp-validation");
const { response } = require("../app");
const { CATEGORY_COLLECTION } = require("../config/collections");
const adminHelper = require("../helpers/admin-helper");
const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
};

/* GET home page. */
router.get("/",async function (req, res, next) {
  res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  let user = req.session.user;
let orderCount=null
  let cartCount=null
  let username=null
if(req.session.user){
 orderCount=await userHelpers.getOrderCount(req.session.user._id)
 username = await userHelpers.getUser(req.session.user._id);
cartCount=await userHelpers.getCartCount(req.session.user._id)

}

productHelpers.getCategory().then((category)=>{
categoryHelper.getAllBanners().then((banners)=>{
  productHelpers.getAllProducts().then((products) => {
   
    res.render("user/index", { username,user, products,cartCount,banners,orderCount,category});
    console.log(category);
  });
})
})
});

router.get("/login", (req, res) => {
  res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  if (req.session.loggedIn) {
    res.redirect("/");
  } else {
    res.render("user/login", {
      loginErr: req.session.loginErr,
      layout: "login-layout",
    });
    req.session.loginErr = false;
  }
});

router.get("/signup", (req, res) => {
  res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');

  res.render("user/signup", { layout: "login-layout" });
});
router.post("/signup",async(req, res) => {

  
// userHelpers.doSignUp(req.body).then((response)=>{
//   req.session.loggedIn=true
//   req.session.user=response
  req.session.userData = req.body;
  otpVarification.getotp(req.body.number).then((response) => {
  
    res.redirect("/otp")

  })


})

  // });


router.get("/otp", (req, res) => {
  res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  res.render("user/otppage", { otp_error: req.session.otpErr });
}),
  router.post("/otp", (req, res) => {
    console.log("post working");
    let userData = req.session.userData;
    console.log(userData);
    let number = userData.number;
    console.log(number + "number");
    otpVarification.otpVerify(req.body, number).then((data) => {
      if (data.status == "approved") {
        userHelpers.doSignUp(req.session.userData).then((response) => {
          req.session.loggedIn = true;
          req.session.user = response;
          res.redirect("/login");
        });
      } else {
        req.session.otpErr = "invalid otp";
        res.redirect(req.get("referer"));
      }
    });
  });

router.post("/login", (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true;
      req.session.user = response.user;
      res.redirect("/");
    } else {
      req.session.loginErr = "invalid user name or password";
      res.redirect("/login");
    }
  });
});

//all products
router.get("/all-products",verifyLogin,async(req,res)=>{
let products=await productHelpers.getAllProducts(req.session.user._id)
let  orderCount=await userHelpers.getOrderCount(req.session.user._id)
let cartCount=await userHelpers.getCartCount(req.session.user._id)
username = await userHelpers.getUser(req.session.user._id);
  res.render("user/all-products",{user:req.session.user,products,cartCount,orderCount,username})
})


//cart
router.get("/cart", verifyLogin,async(req, res) => {
  let user = req.session.user;
  let  orderCount=await userHelpers.getOrderCount(req.session.user._id)
  let cartCount=await userHelpers.getCartCount(req.session.user._id)
  let products = await userHelpers.getCartProducts(req.session.user._id)
  console.log(products);
  username = await userHelpers.getUser(req.session.user._id);
  let totalValue=await userHelpers.getTotalAmount(req.session.user._id)  
 
  res.render("user/cart",{user,products,totalValue,cartCount,orderCount,username});
});

router.get("/add-to-cart/:id",(req,res, next)=>{
  try {
    console.log("api call");
    userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
      
      res.json({status:true})
    })
    
  } catch (error) {
    next(error)
  }
})


router.post('/change-product-quantity',(req,res,next)=>{
  
  userHelpers.changeProductQuantity(req.body).then(async(response)=>{
    response.total=await userHelpers.getTotalAmount(req.body.user)
  res.json(response)
  })
})

router.post('/remove-from-cart', verifyLogin,(req,res)=>{
  console.log("remove",req.body);
  userHelpers.removeCartProduct(req.body).then((response)=>{
    res.redirect('user/cart')
  })
})


//wishlist
router.get("/add-to-wishlist/:id", (req, res) => {
  console.log("add wish list route initiated");
  userHelpers.addToWishlist(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true });
    // res.redirect('/')
  });
});

router.post("/remove-from-wishlist", (req, res, next) => {
  userHelpers.removeWishListProduct(req.body).then((response) => {
    res.json(response);
  });
});

router.get("/wishlist", async (req, res) => {
  let products = null;
  if (req.session.loggedIn) {
    products = await userHelpers.getWishListProducts(req.session.user._id);
    
    username = await userHelpers.getUser(req.session.user._id);
    let  orderCount=await userHelpers.getOrderCount(req.session.user._id)
    let cartCount = await userHelpers.getCartCount(req.session.user._id);
    console.log("prod  ", products);
    res.render("user/wishlist", {
      products,
      cartCount,
      orderCount,
      username,
      user: req.session.user,
    });
  } else {
    req.session.loginerr = true;
    res.redirect("/login");
  }
});


//Coupon
router.post('/apply-coupon', verifyLogin, (req, res) => {
  //console.log("userjs", req.body, "sxxsx", req.session.user._id);
  offerHelper.applyCoupon(req.body, req.session.user._id).then((response) => {
    if (response.status) {
      req.session.coupon = response.coupon;
      req.session.discount = response.discountTotal
      // console.log("user",req.session.coupon);
    }
    // console.log('user coup', response);
    res.json(response)
  })
})


//order
router.get("/place-order",verifyLogin,async(req,res)=>{
  let total=await userHelpers.getTotalAmount(req.session.user._id)
  let coupons = await adminHelper.viewCoupon(req.session.user._id)
  let  orderCount=await userHelpers.getOrderCount(req.session.user._id)
  let savedAddress = await userHelpers.getSavedAddress(req.session.user._id);
  username = await userHelpers.getUser(req.session.user._id);
  let cartCount = await userHelpers.getCartCount(req.session.user._id);
  res.render("user/place-order",{total,user:req.session.user,coupons,orderCount,cartCount,username,savedAddress})
})

router.post('/place-order',async(req,res)=>{
  let totalPrice=0
  let products=await userHelpers.getCartProductList(req.body.userId)
  if(req.session.coupon){
    totalPrice = req.session.discount
  }else{
    totalPrice = await userHelpers.getTotalAmount(req.body.userId)
  }
  userHelpers.placeOrder(req.body,products,totalPrice,req.session.coupon).then((orderId)=>{
  
    if(req.body['payment-method']==='COD'){
      res.json({codSuccess:true})
    }else{
      userHelpers.generateRazorpay(orderId,totalPrice).then((response)=>{
        
        res.json(response)
      })
    }
        
  })
  req.session.discount = null;
  req.session.coupon = null;
})

router.get('/order-success',verifyLogin,async(req,res)=>{
  let username = await userHelpers.getUser(req.session.user._id);
  let cartCount = await userHelpers.getCartCount(req.session.user._id);
  let  orderCount=await userHelpers.getOrderCount(req.session.user._id)
  res.render('user/order-success',{user:req.session.user,username,cartCount,orderCount})
})
router.get("/orders",verifyLogin,async(req,res)=>{
  let username = await userHelpers.getUser(req.session.user._id);
  let cartCount = await userHelpers.getCartCount(req.session.user._id);
  let orders=await userHelpers.getUserOrders(req.session.user._id)
  let  orderCount=await userHelpers.getOrderCount(req.session.user._id)
  res.render('user/orders',{user:req.session.user,orders,cartCount,orderCount,username})
})
// router.get("/order-products/:id",verifyLogin,(req,res,next)=>{
//    userHelpers.getOrderProducts(req.params.id).then((products)=> {
//     console.log("hhhhh",products);
//     res.render('user/order-products',{user:req.session.user,products})
//   }).catch((error)=>{
//     res.status(error.status || 500);
//     res.render('error',{layout: 'login-layout'});
//   })
// })

router.get("/order-products/:id",verifyLogin,async(req,res,next)=>{
  try {
    
    let  orderCount=await userHelpers.getOrderCount(req.session.user._id)
    let username = await userHelpers.getUser(req.session.user._id);
    let cartCount = await userHelpers.getCartCount(req.session.user._id);
    let products = await userHelpers.getOrderProducts(req.params.id)
    if(products[0]) {
      console.log("hhhhh",products);
      res.render('user/order-products',{user:req.session.user,products,orderCount,username,cartCount})
    }else {
      res.render('error',{layout: 'login-layout'});
    }
  } catch (error) {
    next(error)
  }
})




//payment
router.post('/verify-payment',(req,res)=>{
console.log(req.body);
userHelpers.verifyPayment(req.body).then(()=>{
  userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
    console.log('payment succesful');
    res.json({status:true})
  })
}).catch((err)=>{
  console.log(err);
  res.json({status:false,errMsg:''})
})
})

//about page
router.get('/about',verifyLogin,async(req,res)=>{
  username = await userHelpers.getUser(req.session.user._id);
let cartCount=await userHelpers.getCartCount(req.session.user._id)
let  orderCount=await userHelpers.getOrderCount(req.session.user._id)
res.render('user/about',{user:req.session.user,cartCount,orderCount,username})
})


//quick view
router.get("/quick-view",verifyLogin, (req, res,next) => {
    
    productHelpers.getProductDetails(req.query.id).then(async (product) => {
      let  orderCount=await userHelpers.getOrderCount(req.session.user._id)
      let cartCount = await userHelpers.getCartCount(req.session.user._id);
      username = await userHelpers.getUser(req.session.user._id);
      res.render("user/quick-view", {product, cartCount,user:req.session.user,orderCount,username});
    }).catch ((error) => {
    next(error)
    })
 });


//selected category
router.get("/selected-category",async (req, res,next) => {
  console.log(req.query.id,'hhhhhhhhh');
  try {
     let username = await userHelpers.getUser(req.session.user._id);
     let user=req.session.user
     let cartCount = await userHelpers.getCartCount(req.session.user._id);
     let  orderCount=await userHelpers.getOrderCount(req.session.user._id)
     productHelpers.getselectedproducts(req.query.id).then((products) => {
      console.log(products,'fffff');
       res.render("user/selected-category", {products,user,cartCount,username,orderCount
       });
     });
   }
   catch (error) {
   next(error)
  }
 });


//user profile
router.get("/user-profile", verifyLogin, async (req, res,next) => {
  try {
    let user = req.session.user;
    let  orderCount=await userHelpers.getOrderCount(req.session.user._id)
    let cartCount = await userHelpers.getCartCount(req.session.user._id);
    let username = await userHelpers.getUser(user._id);
    res.render("user/user-profile", {cartCount, username, user,orderCount });
  } catch (error) {
   next(error)
  }
 });
 
 //edit profile
 router.get("/edit-user-profile", verifyLogin, async (req, res,next) => {
 try {
     let user = req.session.user;
   
     let username = await userHelpers.getUser(user._id);
     let  orderCount=await userHelpers.getOrderCount(req.session.user._id)
     let cartcount = await userHelpers.getCartCount(user._id);
   
     res.render("user/edit-user-profile", {user,cartcount,username,orderCount});


       /* POST EDIT USER-PROFILE  */
  router.post('/edit-user-profile/',(req,res,next)=>{
    console.log('salah');
    console.log(req.query.id);
   userHelpers.editUserProfile(req.query.id,req.body).then(()=>{
      res.redirect('/user-profile')
    })
  }) 
 } 
 catch (error) {
   next(error)
 }
 });
 

 //saved address
router.get("/savedAddress", verifyLogin, async (req, res,next) => {
  try {
      let user = req.session.user;
      let cartCount = await userHelpers.getCartCount(user._id);
      let savedAddress = await userHelpers.getSavedAddress(user._id);
      let  orderCount=await userHelpers.getOrderCount(req.session.user._id)
  
      let username = await userHelpers.getUser(req.session.user._id);
    
      res.render("user/savedAddress", {
       
        user,
        cartCount,
        savedAddress,
        username,orderCount
      });
  } catch (error) {
    next(error) 
  }
  });

  router.get('/AddAddress',verifyLogin,async(req,res,next)=>{
    try { 
      let user=req.session.user
      let cartcount = await userHelpers.getCartCount(user._id);
      let username = await userHelpers.getUser(user._id);
      let  orderCount=await userHelpers.getOrderCount(req.session.user._id)
      res.render('user/Addaddress',{user,cartcount,username,orderCount})
    } catch (error) {
     next(error)
    }
   
   
   })
   
   //post add address
   router.post('/AddAddress',verifyLogin,(req,res,next)=>{
   try {
     
       let user=req.session.user
       userHelpers.addNewAddress(req.body,user._id).then(() => {
         res.redirect('/savedAddress')
     })
   } catch (error) {
     next(error)
   }
     
   })


router.post("/editAddress", async (req, res,next) => {
  try {
    let addId = req.query.id;
    userHelpers.editAddress(addId, req.body).then((response) => {
      res.redirect("/savedAddress");
    });
  } catch (error) {
    next(error)
  }
});
//delete address
router.get("/deleteAddress", verifyLogin, (req, res,next) => {
 try {
   let userId = req.session.user._id;
   console.log(req.body);
   let adressId = req.query._id;
 
   userHelpers.deleteAddress(adressId, userId).then((response) => {
     res.redirect("/savedAddress");
   });
 } catch (error) {
  next(error)
 }
});


router.get("/logout", (req, res) => {
  req.session.loggedIn = false;
  req.session.user = null;
  res.redirect("/");
});
module.exports = router;
