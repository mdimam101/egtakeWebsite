const backendDomain = "https://api.egtake.com" //"https://e4imbebbpb.execute-api.ap-southeast-1.amazonaws.com";//"http://192.168.1.4:8080"//import.meta.env.VITE_APP_BACKEND_URL;

const SummaryApi = {
  signUp: {
    url: `${backendDomain}/api/signup`,
    method: "post",
  },
  signIn: {
    url: `${backendDomain}/api/signin`,
    method: "post",
  },
  current_user: {
    url: `${backendDomain}/api/user-details`,
    method: "get",
  },
  logout_user: {
    url: `${backendDomain}/api/userLogout`,
    method: "get",
  },
  all_users: {
    url: `${backendDomain}/api/all-users`,
    method: "get",
  },
  upload_product: {
    url: `${backendDomain}/api/upload-product`,
    method: "post",
  },
  get_product: {
    url: `${backendDomain}/api/get-product`,
    method: "get",
  },
  update_product: {
    url: `${backendDomain}/api/update-product`,
    method: "post",
  },
  // when order placeConfirm
updateProductStock: {
  url: `${backendDomain}/api/reduce-stock`,
  method: "put"
},
  category_product: {
    url: `${backendDomain}/api/get-categoryProduct`,
    method: "get",
  },
  category_wish_product: {
    url: `${backendDomain}/api/category-wish-product`,
    method: "post",
  },
  product_details: {
    url: `${backendDomain}/api/product-details`,
    method: "post",
  },
  addToCartProduct: {
    url: `${backendDomain}/api/addtocart`,
    method: "post",
  },
  count_AddToCart_Product: {
    url: `${backendDomain}/api/countAddToCartProduct`,
    method: "get",
  },
  getCartProduct: {
    url: `${backendDomain}/api/get-cart-products`,
    method: "get"
  },
  increaseQuantity: {
    url: `${backendDomain}/api/increase-quantity`,
    method: "post",
  },
  decreaseQuantityProduct: {
    url: `${backendDomain}/api/decrease-quantity`,
    method: "post",
  },
  removeFromCart: {
    url: `${backendDomain}/api/remove`, 
    method: 'DELETE',
  },
  searchProduct: {
    url: `${backendDomain}/api/search`,
    method: "get",
  },
  searchSuggestion: {
    url: `${backendDomain}/api/search-suggestions`,
    method: "get"
  },
  get_banner: {
    url: `${backendDomain}/api/banner`,
   method: "get",
  },
  upload_banner: {
    url: `${backendDomain}/api/upload-banner`,
   method: "post",
  },
  delete_banner: {
    url: `${backendDomain}/api/delete-banner`,
   method: "DELETE",
  },
  orders: {
    url: `${backendDomain}/api/orders`,
   method: "post",
  },
  get_all_orders: {
    url: `${backendDomain}/api/all-orders`,
    method: "get",
  },
  get_user_orders: {
    url: `${backendDomain}/api/user-all-ordrs`,
    method: "get",
  },
  cancel_user_order: {
    url: `${backendDomain}/api/cancel`,
    method: "DELETE"
  },
  return_user_order: {
    url: `${backendDomain}/api/return`, // PUT `/return/:orderId`
    method: "put",
  } ,
  
  //coupon 
  admin_coupons_list:   { 
    url: `${backendDomain}/api/admin/coupons`, 
    method: "GET" 
  },
  admin_coupons_create: { 
    url: `${backendDomain}/api/admin/coupons`,
     method: "POST" 
    },
  admin_coupons_update: { 
    url: (id) => `${backendDomain}/api/admin/coupons/${id}`,
     method: "PATCH" 
    },
  admin_coupons_toggle: {
     url: (id) => `${backendDomain}/api/admin/coupons/${id}/toggle`,
      method: "PATCH" 
    },
  admin_coupons_delete: { 
    url: (id) => `${backendDomain}/api/admin/coupons/${id}`, 
    method: "DELETE" 
  },
};

export default SummaryApi;
