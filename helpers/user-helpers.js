var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
const { promise, reject } = require("bcrypt/promises");
var objectId = require("mongodb").ObjectId;
const Razorpay = require("razorpay");
const { resolve } = require("path");
var instance = new Razorpay({
  key_id: "rzp_test_2JCDbbhXXOcj9Q",
  key_secret: "O2ilDlN3k8hneMWcdjutE3Zm",
});
module.exports = {
  doSignUp: (userData) => {
    userData.isBlocked=false
    return new Promise(async (resolve, reject) => {
      userData.Password = await bcrypt.hash(userData.Password, 10);
      db.get()
        .collection(collection.USER_COLLECTION)
        .insertOne(userData)
        .then((data) => {
          userData._id = data.insertedId;
          resolve(userData);
        });
    });
  },

  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ Email: userData.Email, isBlocked: false });
      if (user) {
        bcrypt.compare(userData.Password, user.Password).then((status) => {
          if (status) {
            console.log("success");
            response.user = user;
            response.status = true;
            resolve(response);
          } else {
            console.log("fail");
            resolve({ status: false });
          }
        });
      } else {
        console.log("lo fail");
        resolve({ status: false });
      }
    });
  },
  
  getAllUsers: () => {
    return new Promise(async (resolve, reject) => {
      let users = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .find()
        .toArray();
      resolve(users);
    });
  },

  addToCart: (proId, userId) => {
    let proObj = {
      item: objectId(proId),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (userCart) {
        let proExist = userCart.products.findIndex(
          (product) => product.item == proId
        );
        console.log(proExist);
        if (proExist != -1) {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectId(userId), "products.item": objectId(proId) },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then(() => {
              resolve();
            });
        } else {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectId(userId) },
              {
                $push: { products: proObj },
              }
            )
            .then((response) => {
              resolve();
            });
        }
      } else {
        let cartObj = {
          user: objectId(userId),
          products: [proObj],
        };
        db.get()
          .collection(collection.CART_COLLECTION)
          .insertOne(cartObj)
          .then((response) => {
            resolve();
          });
      }
    });
  },

  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();

      resolve(cartItems);
    });
  },

  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (cart) {
        count = cart.products.length;
      }
      resolve(count);
    });
  },

  

  removeCartProduct: (details) => {
    return new Promise((resolve, reject) => {
      console.log("remove help", details);
      db.get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          { _id: objectId(details.cart) },

          {
            $pull: { products: { item: objectId(details.product) } },
          }
        )
        .then((response) => {
          resolve(true);
        });
    });
  },
  // changeProductQuantity:(details)=>{
  //   details.count=parseInt(details.count)
  //   return new Promise((resolve,reject)=>{
  //     db.get().collection(collection.CART_COLLECTION)
  //         .updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},
  //         {
  //           $inc:{'products.$.quantity':details.count}
  //         }
  //         ).then((result)=>{
  //           console.log(result);
  //           resolve()
  //         })
  //   })
  // }

  changeProductQuantity: (details) => {
    details.count = parseInt(details.count);
    details.quantity = parseInt(details.quantity);

    return new Promise((resolve, reject) => {
      if (details.count == -1 && details.quantity == 1) {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            { _id: objectId(details.cart) },

            {
              $pull: { products: { item: objectId(details.product) } },
            }
          )
          .then((response) => {
            resolve({ removeProduct: true });
          });
      } else {
        db.get()
          .collection(collection.CART_COLLECTION)

          .updateOne(
            {
              _id: objectId(details.cart),
              "products.item": objectId(details.product),
            },

            {
              $inc: { "products.$.quantity": details.count },
            }
          )
          .then((response) => {
            resolve({ status: true });
          });
      }
    });
  },

  userblock: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            $set: { isBlocked: true },
          }
        );
      resolve();
    });
  },
  userunblock: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            $set: { isBlocked: false },
          }
        );
      resolve();
    });
  },

  addToWishlist: (proId, userId) => {
    let proObj = {
      item: objectId(proId),
    };
    console.log("add function");
    return new Promise(async (resolve, reject) => {
      let userWishList = await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
        .findOne({ user: objectId(userId) });
      console.log("add wish promise");
      if (userWishList) {
        let proExist = userWishList.products.findIndex(
          (product) => product.item == proId
        );
        console.log(proExist);
        if (proExist == -1) {
          console.log(proId);
          db.get()
            .collection(collection.WISHLIST_COLLECTION)
            .updateOne(
              { user: objectId(userId) },
              {
                $push: { products: proObj },
              }
            )
            .then((data) => {
              console.log(data);
              resolve(data);
            });
        } else {
          db.get()
            .collection(collection.WISHLIST_COLLECTION)
            .updateOne(
              { user: objectId(userId), "products.item": objectId(proId) },
              {
                $pull: { products: proObj },
              }
            )
            .then((response) => {
              resolve();
            });
        }
      } else {
        let wishListObj = {
          user: objectId(userId),
          products: [proObj],
        };
        db.get()
          .collection(collection.WISHLIST_COLLECTION)
          .insertOne(wishListObj)
          .then((response) => {
            resolve();
          });
      }
    });
  },

  getWishListProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let wishListItems = await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();

      resolve(wishListItems);
    });
  },

  removeWishListProduct: (proId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.WISHLIST_COLLECTION)
        .deleteOne(
          { _id: objectId(proId) }.then((response) => {
            resolve(response);
          })
        );
    });
  },

  getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: {
                  $multiply: ["$quantity", { $toInt: "$product.Price" }],
                },
              },
            },
          },
        ])
        .toArray();
      console.log(total);
      resolve(total[0]?.total);
    });
  },

  getOrderCount: (userId) => {
    
    return new Promise(async (resolve, reject) => {
      let orderCount = 0;
    
      // let order = await db
      //   .get()
      //   .collection(collection.ORDER_COLLECTION)
      //   .find({ userId: objectId(userId)});
      let order=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {$match:{userId:objectId(userId)}},
      ]).toArray()
        console.log(order.length);
      resolve(order.length);
    
    });
  },

  placeOrder: (order, products, total) => {
    return new Promise((resolve, reject) => {
      console.log(order, products, total);
      let status = order["payment-method"] === "COD" ? "placed" : "pending";
      let orderObj = {
        deliveryDetails: {
          mobile: order.mobile,
          address: order.address,
          pincode: order.pincode,
        },
        userId: objectId(order.userId),
        paymentMethod: order["payment-method"],
        products: products,
        totalAmount: total,
        status: status,
        date:new Date(new Date().getTime()).toLocaleString()
      };
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .insertOne(orderObj)
        .then((response) => {
          db.get()
            .collection(collection.CART_COLLECTION)
            .deleteOne({ user: objectId(order.userId) });
          resolve(response.insertedId);
        });
    });
  },

  getCartProductList: (userId) => {
    return new Promise(async (resolve, reject) => {
      console.log(userId);
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      console.log(cart);
      resolve(cart.products);
    });
  },

  getUserOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      console.log(userId);
      let orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ userId: objectId(userId) }).sort({_id:-1})
        .toArray();
      console.log(orders);
      resolve(orders);
    });
  },

  getOrderProducts: (orderId) => {
    console.log(orderId, 'start of getorderproduct');
    return new Promise(async (resolve, reject) => {
     
        console.log('starting of promise');
        let orderItems = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { _id: objectId(orderId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ]).toArray();
        console.log(orderItems, 'ordrirems');
      
          resolve(orderItems);
      
   
      }).catch(()=>{
        console.log('error of getorder product');
        resolve()
          });
    },
//cancel order


  generateRazorpay: (orderId, total) => {
    return new Promise((resolve, reject) => {
      var options = {
        amount: total*100, // amount in the smallest currency unit
        currency: "INR",
        receipt: ""+orderId
      };
      instance.orders.create(options, function (err, order) {
      
        console.log("new ord4r", order);
        resolve(order);
        
      });
    });
  },

  verifyPayment:(details)=>{
    return new Promise((resolve,reject)=>{
      const crypto = require('crypto');
      let hmac = crypto.createHmac('sha256','O2ilDlN3k8hneMWcdjutE3Zm')
      console.log(hmac);

      hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
      hmac=hmac.digest('hex')
      
      console.log(hmac,'yugdsc');
      console.log(details['payment[razorpay_signature]']);
      if(hmac==details['payment[razorpay_signature]']){
        resolve()
      }else{
        reject()
      }
    })
  },

 changePaymentStatus:(orderId)=>{
  return new Promise((resolve,reject)=>{
    db.get().collection(collection.ORDER_COLLECTION)
    .updateOne({_id:objectId(orderId)},
    {
      $set:{
        status:'placed'
      }
    }
    ).then(()=>{
      resolve()
    })
  })
 },

 getUser:(userId) => {
  return new Promise((resolve, reject) => {
try {
      db.get().collection(collection.USER_COLLECTION).findOne({_id: objectId(userId)}).then((user) => {
          resolve(user);
        });
} catch (error) {
  reject(error)
}
      
  });
},

editUserProfile:(userid,profileDetail)=>{
  return new Promise((resolve,reject)=>{
       try {
           db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userid)},{
             $set:{
                 Name:profileDetail.Name,
                 Email:profileDetail.Email,
                 number:profileDetail.number
                
             }
           }).then((response)=>{
             resolve()
           })
       } catch (error) {
          reject(error)
       }
  })
},

getSavedAddress:(userId)=>{
  return new Promise((resolve,reject)=>{
  try {
       db.get().collection(collection.ADDRESS_COLLECTION).findOne({user: objectId(userId)}).then((savedAddress)=>{
          if(savedAddress){
              let addressArray=savedAddress.address
              if(addressArray.length > 0){
                  resolve(savedAddress)
              }else{
                  resolve(false)
              }
           }else{
              resolve(false)
           }
       })
  } catch (error) {
      reject(error)
  }
  
  })
},

addNewAddress: (address, userId) => {
    console.log("here ethi");
  let addressData = {

    
      First_Name: address.First_Name,
      Last_Name: address.Last_Name,
      Company_Name: address.Company_Name,
      Street_Address: address.Street_Address,
      Extra_Details: address.Extra_Details,
      Town_City: address.Town_City,
      Country_State: address.Country_State,
      Post_Code: address.Post_Code,
      Phone: address.phone,
      Alt_Phone: address.Alt_Phone

  }
  return new Promise(async(resolve, reject) => {
    try {
        let getAddress = await db.get().collection(collection.ADDRESS_COLLECTION).findOne({ user: objectId(userId) })
        console.log(getAddress);
        if (getAddress) {
            db.get().collection(collection.ADDRESS_COLLECTION).updateOne({ user: objectId(userId) },
                {
                    $push: {
                        address: addressData
                    }
                }).then((response) => {
                    resolve(response)
                  
                })

        } else {
            let addressObj = {
                user: objectId(userId),
                address: [addressData]
            }

            db.get().collection(collection.ADDRESS_COLLECTION).insertOne(addressObj).then((response) => {
                resolve(response)
              
            })
        }
    } catch (error) {
      reject(error)
    }
  })
},

getSameAddress: (address_Id) => {
  return new Promise((resolve, reject) => {
     try {
       db.get().collection(collection.ADDRESS_COLLECTION).findOne({ "address.addressId": address_Id }).then((res) => {
           resolve(res)
       })
     } catch (error) {
      reject(error)
     }
  })
},

editAddress:(AId,addressData)=>{
  return new Promise((resolve, reject) => {
    try {
      db.get().collection(collection.ADDRESS_COLLECTION).updateOne({"address.addressId":AId},
      {
        $set:{

                        "address.$.First_Name": addressData.First_Name,
                        "address.$.Last_Name": addressData.Last_Name,
                        "address.$.Company_Name": addressData.Company_Name,
                        "address.$.Street_Address": addressData.Street_Address,
                        "address.$.Extra_Details": addressData.Extra_Details,
                        "address.$.Town_City": addressData.Town_City,
                        "address.$.Country_State": addressData.Country_State,
                        "address.$.Post_Code": addressData.Post_Code,
                        "address.$.Phone": addressData.Phone,
                        "address.$.Alt_Phone": addressData.Alt_Phone
          
        }
  
      }).then((response)=>{
     
        resolve()
      })
    } catch (error) {
      reject(error)
    }
  })
},

deleteAddress: (addressId,userId) => {
 
  return new Promise(async (resolve, reject) => {
     try {
       db.get().collection(collection.ADDRESS_COLLECTION).updateOne({ user: objectId(userId) },
           {
               $pull: {
                   address: { addressId: addressId }
               }
           },
           {
               multi: true
           }).then(() => {
               resolve()
              
           })
     } catch (error) {
      reject(error)
     }

  })
},




};
