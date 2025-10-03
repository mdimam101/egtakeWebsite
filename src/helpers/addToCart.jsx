import SummaryApi from '../common';
import { toast } from "react-toastify";

const addToCart = async ({ productId, size, color, image}) => {
    try {
      const response = await fetch(SummaryApi.addToCartProduct.url, {
        method: SummaryApi.addToCartProduct.method,
        headers: {
          'content-type': 'application/json'
        },
        credentials: 'include', // token cookie পাঠানোর জন্য
        body: JSON.stringify({ productId, size, color, image })
      });
  
      const result = await response.json();
  
      if (result.success) {
        toast.success(result.message);
      } else if (result.error) {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Something went wrong!");
    }
  };
  

export default addToCart;