var db=require('../config/connection')
var collection=require('../config/collections')
var ObjectId=require('mongodb').ObjectId

module.exports={
    addCategory:(category)=>{
        return new Promise(async(resolve,reject)=>{
            try {
                let isCategory = await 
                db.get()
                .collection(collection.CATEGORY_COLLECTION)
                .findOne({
                     Category: category,
                     deletedCateg:false
                 })
                 if(!isCategory){
                    
                db.get().collection(collection.CATEGORY_COLLECTION).insertOne({
                    Category:category,
                    deletedCateg:false
                }).then((data)=>{
                    console.log(data);
                    resolve(data.insertedId)
                })
            }else{
                resolve()
            }
            } catch (error) {
                reject(error)
            }
        })
       
    },
    viewCategory:()=>{
        return new Promise(async(resolve,reject)=>{
            let Category=await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(Category)
        })
    },
    deleteProduct:(catId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({_id:ObjectId(catId)}).then((response)=>{
            //    console.log(response);
                resolve(response)
            })
        })
    },
    getCategoryDetails:(catId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).findOne({_id:ObjectId(catId)}).then((category)=>{
            
                resolve(category)
            })
        })
    },
    updateCategory:(catId,catDetails)=>{
        return new Promise(async(resolve,reject)=>{
            catDetails.Category= catDetails.Category.toUpperCase()
            let Categorydat=await db.get().collection(collection.CATEGORY_COLLECTION).findOne({Category: catDetails.Category})
            if(!Categorydat){
            db.get().collection(collection.CATEGORY_COLLECTION)
            .updateOne({_id:ObjectId(catId)},{
                $set:{
                    Category:catDetails.Category
                    
                }
            }).then((response)=>{
                resolve()
            })
        }else{
            reject('already exists')
        }
        })
    },
    removeCartProduct: (catdetails) => {
        return new Promise((resolve, reject) => {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { _id: ObjectId(catdetails.cart) },
    
              {
                $pull: { products: { item: ObjectId(catdetails.product) } },
              }
            )
            .then((response) => {
              resolve(true);
            });
        });
      },


      //banner

      addBanner:(banner,callback)=>{
        try {
          db.get().collection(collection.BANNER_COLLECTION).insertOne({
              name:banner.name,
              description:banner.description,
              offer:banner.offer
          }).then((data)=>{
              console.log(data);
              callback(data.insertedId)
          })
        } catch (error) {
         reject(error)
        }
     },
     getAllBanners:()=>{
         return new Promise(async(resolve,reject)=>{
             try {
                 let Banners=await db.get().collection(collection.BANNER_COLLECTION).find().sort({_id:-1}).toArray()
                 resolve(Banners)
             } catch (error) {
                reject(error) 
             }
         })
     },
     getBannerDetail:(banid)=>{
         return new Promise((resolve,reject)=>{
            try {
              db.get().collection(collection.BANNER_COLLECTION).findOne({_id:ObjectId(banid)}).then((productDetail)=>{
                  resolve(productDetail)
              })
            } catch (error) {
             reject(error)
            }
         })
     },
     editBanner:(banid,productDetail)=>{
         console.log('editbaannenrrr');
         return new Promise((resolve,reject)=>{
              try {
                  db.get().collection(collection.BANNER_COLLECTION).updateOne({_id:ObjectId(banid)},{
                    $set:{
                        name:productDetail.name,
                        description:productDetail.description,
                    }
                  }).then((response)=>{
                    resolve()
                  })
              } catch (error) {
                reject(error) 
              }
         })
     },
     deleteBanner:(banId)=>{
         console.log(banId);
         return new Promise((resolve,reject)=>{
             try {
                 db.get().collection(collection.BANNER_COLLECTION).deleteOne({_id:ObjectId(banId)}).then((response)=>{
                     resolve(response) 
                 })
             } catch (error) {
                reject(error) 
             }
         })
     }
}