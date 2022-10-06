var express = require('express');
const adminHelper = require('../helpers/admin-helper');
var router = express.Router();
var productHelpers=require('../helpers/product-helpers')
var categoryHelper = require('../helpers/add-category')
var userHelpers=require('../helpers/user-helpers');
const addCategory = require('../helpers/add-category');
const { Admin } = require('mongodb');
const adminLoginVerify=(req,res,next)=>{
  if(req.session.adminLoggedIn){
    next()
  }else{
    res.redirect('/admin')

  }
}

/* GET users listing. */
router.get('/',(req,res)=>{
  
if(req.session.adminLoggedIn){
  res.redirect('/admin/admin-dashboard')
}else{
  res.redirect('/admin/admin-login')
}
})


const admindata={
  name:"Admin",
  email:"admin@gmail.com",
  password:"123456789"
}


router.get('/admin-login',(req,res)=>{
  res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  if(req.session.adminLoggedIn){
    res.redirect('/admin/admin-dashboard')
  }else
  res.render('admin/admin-login',{layout:'login-layout'})
})

router.post('/admin-login',(req,res)=>{
  console.log(req.body);
  // adminHelper.doAdminLogin(req.body).then((response)=>{
    if(req.body.Email==admindata.email && req.body.Password==admindata.password){
  console.log("aaaaaaaaaaaaaaaaa",admindata);
    req.session.adminLoggedIn=true
    req.session.admin=admindata.name
    res.redirect('/admin/admin-dashboard')
   }else{
    res.redirect('/admin')
   }
  })


// router.get('/admin-dashboard',adminLoginVerify, function(req, res, next) {
  // let admin=req.session.admin
//   console.log(admin);
//   res.render('admin/admin-dashboard',{layout:'admin-layout', admin:true ,admin});
  router.get('/admin-dashboard',adminLoginVerify,async(req,res,next)=>{
    try {
      
  
        
        let delivery = {}
        delivery.Placed = 'placed'
        delivery.Shipped = 'shipped'
        delivery.Deliverd = 'deliverd'
        const allData = await Promise.all
            ([
              adminHelper.onlinePaymentCount(),
              adminHelper.totalUsers(),
              adminHelper.totalOrder(),
              adminHelper.cancelOrder(),
              adminHelper.totalCOD(),
              adminHelper.totalDeliveryStatus(delivery.Placed),
              adminHelper.totalDeliveryStatus(delivery.Shipped),
              adminHelper.totalDeliveryStatus(delivery.Deliverd),
              adminHelper.totalCost(),
        
            ]);
            
            console.log('dahsifffffffffffffff');
            res.render('admin/admin-dashboard',{layout:"admin-layout",admin:true,    
            OnlinePymentcount: allData[0],
            totalUser: allData[1],
            totalOrder: allData[2],
            cancelOrder: allData[3],
            totalCod: allData[4],
            Placed: allData[5],
            Shipped: allData[6],
            Deliverd: allData[7],
            totalCost: allData[8]
          })
      
    } catch (error) {
      next(error)
    }
  } )
// });

//product

router.get('/view-products',adminLoginVerify,(req,res)=>{
  productHelpers.getAllProducts().then((products)=>{
    
    res.render('admin/view-products',{layout:'admin-layout', admin:true ,products})
  })
 
})

router.get('/add-product',adminLoginVerify,(req,res)=>{
  categoryHelper.viewCategory().then((Category)=>{
    res.render('admin/add-product',{Category,layout:'admin-layout', admin:true})
  })
 

})
router.post('/add-product',(req,res)=>{

  productHelpers.addProduct(req.body,(id)=>{
    let image=req.files.Image
    console.log(id);
    image.mv('./public/admin-assets/product-images/'+id+'.jpg',(err)=>{
      if(!err){
        res.redirect('/admin/add-product')
      }else{
        console.log(err);
      }
    })
    
  })
})



router.get('/delete-product/:id',adminLoginVerify,(req,res)=>{
let proId=req.params.id
console.log(proId);
productHelpers.deleteProduct(proId).then((response)=>{
  res.redirect('/admin/view-products/')
})
})

router.get('/edit-product/:id',adminLoginVerify,async (req,res)=>{
  let Category=await categoryHelper.viewCategory(req.params.id)
  let product=await productHelpers.getProductDetails(req.params.id)
  console.log(product);
  res.render('admin/edit-product',{layout:'admin-layout', admin:true,product,Category} )
})
router.post('/edit-product/:id',(req,res)=>{
  console.log(req.params.id);
  let id=req.params.id
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin/view-products')
    if(req.files.Image){
      let image=req.files.Image
      image.mv('./public/admin-assets/product-images/'+id+'.jpg')
    }
  })
})

//category

router.get('/category',adminLoginVerify,(req,res)=>{
  categoryHelper.viewCategory().then((Category)=>{
    console.log("cate",Category);
    res.render('admin/category',{Category,layout:'admin-layout', admin:true} )
  })
})

router.get('/add-category',adminLoginVerify,(req,res)=>{
categoryHelper.viewCategory().then((Category)=>{
  let errmess = req.session.errmess
  res.render('admin/add-category',{errmess,layout:'admin-layout', admin:true} )
  req.session.errmess = false
})
})

router.post('/add-category',(req,res,next)=>{
  console.log(req.files);
  try {
    let category=req.body.Category.toUpperCase()
    categoryHelper.addCategory(category).then((data)=>{
      console.log(data);
      if(data){
        let image = req.files.Image
        image.mv('./public/images/'+data+'.jpg',(err,done)=>{
          if(!err){
           res.redirect('/admin/category')
          } else{
            console.log('err');
            console.log(err);
          }
        })
      }else{
        console.log('fffffffffffffffffffffff');
        res.render('admin/add-category')
      }
     
   
    
     
    })
  } catch (error) {
    next(error)
  }
  
})

router.get('/delete-category/:id',adminLoginVerify,(req,res)=>{
  let proId=req.params.id
  console.log(proId);
  categoryHelper.deleteProduct(proId).then((response)=>{
    res.redirect('/admin/category/')
  })
  })
  

  router.get('/edit-category/:id',adminLoginVerify,async (req,res)=>{
    let category=await addCategory.getCategoryDetails(req.params.id)
    let errmess = req.session.errmess
    res.render('admin/edit-category',{errmess,layout:'admin-layout', admin:true,category} )
    req.session.errmess = false
  })
  router.post('/edit-category/:id',(req,res)=>{
    console.log(req.params.id);
    
    categoryHelper.updateCategory(req.params.id,req.body).then(()=>{
      res.redirect('/admin/category')
    
    }).catch((err)=>{
      req.session.errmess = err;
      res.redirect('back')
    })
  })

  
  //user

router.get('/view-users',adminLoginVerify,(req,res)=>{
  userHelpers.getAllUsers().then((users)=>{
    
    res.render('admin/view-users',{layout:'admin-layout', admin:true ,users})
  })
})

router.get('/block/:id',(req,res)=>{
  userHelpers.userblock(req.params.id).then(()=>{
    res.redirect('/admin/view-users')
})
})
router.get('/unblock/:id',(req,res)=>{
  userHelpers.userunblock(req.params.id).then(()=>{
    res.redirect('/admin/view-users')
})
})

/* GET ADMIN ADD  BANNER */
router.get('/add-banner',(req,res,next)=>{
  try {
    
      res.render('admin/add-banner',{layout:'admin-layout', admin:true})
    
  } catch (error) {
   next(error)
  }
 });
  
 /* GET ADMIN VIEW BANNER */
 router.get('/view-bannerManagement',adminLoginVerify,(req,res,next)=>{
  try {
   categoryHelper.getAllBanners().then((banners) => {
      
      res.render('admin/view-bannerManagement', {layout:'admin-layout', admin:true,banners});
      
  })
  } catch (error) {
   next(error)
  }
 } );
 
  /*  POST ADMIN ADD BANNER */
  router.post('/add-banner',(req,res,next)=>{
   try {
     console.log(req.body);
     console.log(req.files.image);
    
     categoryHelper.addBanner(req.body,(id)=>{
      let image = req.files.image
      image.mv('./public/banner-image/'+id+'.jpg',(err,done)=>{
        if(!err){
          res.redirect('/admin/add-banner')
        } else{
          console.log(err);
        }
      })
    })
   } catch (error) {
     next(error)
   }
  
  } )
  
 /* GET ADMIN EDIT BANNER */
 router.get('/edit-banner/',adminLoginVerify,async (req,res,next)=>{
   try {
     let bannerDetail=await categoryHelper.getBannerDetail(req.query.id)
     res.render('admin/edit-banner',{layout:'admin-layout', admin:true,bannerDetail})
   } catch (error) {
     next(error)
   }
 })
 
 /* POST ADMIN EDIT BANNER */
 router.post('/edit-banner/:id',(req,res,next)=>{
 try {
     let id=req.params.id
     console.log(req.params.id);
     categoryHelper.editBanner(req.params.id,req.body).then(()=>{
       res.redirect('/admin/')
       if(req.files.image){
       let image = req.files.image
       image.mv('./public/banner-image/'+id+'.jpg')
       }
     })
 } catch (error) {
   next(error)
 }
 })
 
 /* GET DELETE BANNER. */
 router.get('/delete-banner/',(req,res,next)=>{
   try {
     let banId=req.query.id
     categoryHelper.deleteBanner(banId).then((response)=>{
       res.redirect('/admin/view-bannerManagement')
     })
   } catch (error) {
     next(error)
   }
 })



//order

router.get('/order-management',adminLoginVerify,(req,res,next)=>{
  try {
    adminHelper.getallOrderDetails().then((orderDetails)=>{
      console.log('get detailsssssssssssssss');
      res.render('admin/order-management',{layout:'admin-layout', admin:true ,orderDetails})
    })
   
  } catch (error) {
    next(error)
  }
 
})

router.get("/view-order-products/:id",async(req,res)=>{
  let products=await userHelpers.getOrderProducts(req.params.id)
  console.log("hhhhh",products);
  res.render('admin/view-order-products',{layout:'admin-layout', admin:true ,products})
})


/* SHIPPED CHANGE ORDER-STATUS */
router.get('/change-status1/:id',(req,res,next)=>{
  try {
   let orderId=req.params.id
   let data='shipped'
  adminHelper.changeOrderStatus(orderId,data).then(()=>{
    res.redirect('back')
  })
  } catch (error) {
   next(error)
  }

})

/* DELIVERED CHANGE ORDER-STATUS */
router.get('/change-status2/:id',(req,res,next)=>{
try {
  let orderId=req.params.id
  let data='deliverd'
 adminHelper.changeOrderStatus(orderId,data).then(()=> {
  res.redirect('back')
 })

} catch (error) {
 next(error)
}

})

/* CANCEL ORDER-STATUS */
router.get('/cancel-order/:id',(req,res,next)=>{
  console.log("unais a");
 try {
   let orderId=req.params.id
   let data='canceled'
   adminHelper.CancelOrder(orderId,data).then((response)=>{
     res.redirect('/admin/order-management')
   })
 } catch (error) {
   next(error)
 }
 
})

//Coupon Management
router.get('/viewCoupon', adminLoginVerify, (req, res) => {

  adminHelper.viewCoupon().then((couponDetails) => {
    res.render('admin/viewCoupon', {layout:'admin-layout', admin:true , couponDetails })
  })
})

router.get('/addCoupon', adminLoginVerify, (req, res) => {
  let errMss= req.session.addCouponErr
  res.render('admin/addCoupon', {errMss, layout:'admin-layout', admin:true  })
  req.session.addCouponErr=false
})

router.post('/addCoupon', (req, res) => {
  adminHelper.addCoupon(req.body).then((response) => {
    res.redirect('/admin/viewCoupon')
  }).catch((err)=>{
    req.session.addCouponErr=err;
    res.redirect('/admin/addCoupon')
  })
})
// router.post('/coupon',(req,res) => {
//   //console.log(req.body);
// })
router.get('/remove_coupon/:id', (req, res) => {
  adminHelper.deleteCoupon(req.params.id).then((response) => {
    res.json(response)
  }).catch((err) => {
    console.log(err);
  })
})

//logout
router.get('/admin-logout',(req,res)=>{
  req.session.adminLoggedIn=false
    req.session.admin=null
  res.redirect('/admin')
})
module.exports = router;