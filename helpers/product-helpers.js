var db=require('../config/connection')
var collection=require('../config/collections')
const { response } = require('../app')
var objectId=require('mongodb').ObjectId

module.exports={
    addProduct:(product,callback)=>{
       
        db.get().collection('product').insertOne(product).then((data)=>{

            callback(data.insertedId)

        })
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct:(prodId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:objectId(prodId)}).then((response)=>{
            //    console.log(response);
                resolve(response)
            })
        })
    },
getProductDetails:(proId)=>{
    return new Promise((resolve,reject)=>{
            
      
        db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((product)=>{
        
            resolve(product)
        }).catch((error) => {
       reject(error)     
    
    })
})
},
updateProduct:(proId,proDetails)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.PRODUCT_COLLECTION)
        .updateOne({_id:objectId(proId)},{
            $set:{
                Name:proDetails.Name,
                Description:proDetails.Description,
                Price:proDetails.Price,
                Category:proDetails.Category
            }
        }).then((response)=>{
            resolve()
        })
    })
},


//user category
getselectedproducts:(cId) => {
    return new Promise((resolve, reject) => {
        console.log(cId,'aaaaaaaaaa');
     try {
        db.get().collection(collection.PRODUCT_COLLECTION).find({Category:cId}).toArray().then((product) => {
            console.log(product);
            resolve(product);

          });
     } catch (error) {
       reject(error)
     }
       
    });
  },

  getCategory:(()=>{

    return new Promise(async(resolve,reject)=>{
    
           let category= await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
             resolve(category)
     
               
    })
    
    }),
} 