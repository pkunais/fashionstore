var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
const { response } = require("../app");
var objectId=require('mongodb').ObjectId

module.exports={
    doAdminLogin:(adminData)=>{
        return new Promise(async (resolve,reject)=>{
            
            let loginStatus=false
            let response={}
            let admin=await db.get().collection(collection.ADMIN_COLLECTION).findOne({Email:adminData.Email})
            if(admin){
                bcrypt.compare(adminData.Password,admin.Password).then((status)=>{
                    if(status){
                        console.log('login syucces');
                        response.admin=admin
                        response.status=true
                        resolve(response)
                    }else{
                        resolve({status:false})
                        console.log('failed');
                    }

                })
            }else{
                resolve({status:false})
                console.log('no user');
            }
        })
    },
    //order management
    getallOrderDetails:()=>{
        return new Promise(async(resolve,reject)=>{
           try {
             let orderDetails=await db.get().collection(collection.ORDER_COLLECTION).find()
             .sort({_id:-1}).
             toArray()
             console.log(orderDetails);
             resolve(orderDetails)
           } catch (error) {
            reject(error)
           }
        })
    },
    changeOrderStatus:(oId,data)=>{
        return new Promise((resolve,reject)=>{
          try {
              db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(oId)},{$set:{status:data}}).then((response)=>{
                  resolve() 
              })
          } catch (error) {
            reject(error)
          }
        })
    },
    CancelOrder:(oId,data)=>{
        return new Promise((resolve,reject)=>{
           try {
             db.get().collection(collection.ORDER_COLLECTION).updateOne({
                 _id:objectId(oId)
             },
             {
                 $set:{status:data,fixed:true}
             }).then((res)=>{
                 resolve(res)
             })
           } catch (error) {
            reject(error)
           }
        })
    },

    //coupon

    addCoupon : (coupon) => {
        coupon.name= coupon.name.toUpperCase()
        coupon.user =[]
        coupon.discount = parseInt(coupon.discount)
        return new Promise(async(resolve,reject) => {
            let coupons = await db.get().collection(collection.COUPON_COLLECTION).findOne({name:coupon.name})
            if(coupons){
                reject('already exists')
            }else{
                db.get().collection(collection.COUPON_COLLECTION).insertOne(coupon).then((response) => {
                    console.log("cou",coupon);
                    resolve(response)
                })
            }

        })
    },
    viewCoupon : () => {
        return new Promise(async(resolve,reject) => {
          let couponDetails = await  db.get().collection(collection.COUPON_COLLECTION).find().toArray()
                resolve(couponDetails);
        })
    },
    deleteCoupon : (couponId) => {
        return new Promise(async(resolve,reject) => {
            db.get().collection(collection.COUPON_COLLECTION).deleteOne({_id:objectId(couponId)}).then((response)=>{
                resolve({status:true});
            }).catch(() => {
                reject();
            })
        })
    },




    //dash board
    onlinePaymentCount: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let count = await db.get().collection(collection.ORDER_COLLECTION).find({ paymentMethod: "ONLINE" }).count()
                resolve(count)
            } catch (err) {
                reject(err)
            }

        })
    },
    totalUsers: () => {
        return new Promise(async (resolve, reject) => {
          try {
            let count = await db.get().collection(collection.USER_COLLECTION).find().count()
            resolve(count)
          } catch (err) {
            reject(err)
          }
        })
      },
  totalOrder: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let count = await db.get().collection(collection.ORDER_COLLECTION).find().count()
        resolve(count)
      } catch (err) {
        reject(err)
      }
    })
  },
  cancelOrder: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let count = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
          {
            $match: {
              'status': 'canceled'
            }
          }, {
            $count: 'number'
          }

        ]).toArray()
        resolve(count)
        console.log(count);
      } catch (err) {
        reject(err)
      }

    })
  },
    totalCOD: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let count = await db.get().collection(collection.ORDER_COLLECTION).find({
                    paymentMethod
                        : "COD",
                }).count()
                resolve(count)
            } catch (err) {
                reject(err)
            }
        })

    },
  totalDeliveryStatus: (data) => {
    return new Promise(async (resolve, reject) => {
      try {
        let statusCount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
            $match: {
              'status': data

            }
          }, {
            $count: 'number'
          }

        ]).toArray()
        resolve(statusCount)
      } catch (err) {
        reject(err)
      }
    })
  },
  totalCost: () => {
    return new Promise(async (resolve, reject) => {
      try {
        total = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
          {
            $project: {
              'totalAmount': 1
            }
          },
          {
            $group: {
              _id: null,
              sum: { $sum: '$totalAmount' }
            }
          }
        ]).toArray()
        resolve(total)
      } catch (err) {
        reject(err)
      }
    })
  }
    

}