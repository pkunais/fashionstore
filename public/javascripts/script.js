const addToCart = (proId)=>{

    $.ajax({
        url:'/add-to-cart/'+proId,
        method:'get',
        success:(response)=>{
            if(response.status){
                // let count=$('#cart-count').html()
                // count=parseInt(count)+1
                // $("#cart-count").html(count)
                $("#icons").load(location.href + " #icons");
            }
           
        }
    })
}

function addToWishlist(proId){
    console.log("ajax function")
    $.ajax({
      url:'/add-to-wishlist/'+proId,
      method:'get',
      success:(response)=>{
        if(response.status){
          
        }
       
      }
    })
  }

 