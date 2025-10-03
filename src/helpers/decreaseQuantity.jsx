import { toast } from 'react-toastify';
import SummaryApi from '../common';

const decreaseQuantity = async (cartItemId) => {
  try {
    const response = await fetch(SummaryApi.decreaseQuantityProduct.url, {
      method: SummaryApi.decreaseQuantityProduct.method,
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ cartItemId })
    });

    const result = await response.json();

    if (result.success) {
      toast.success(result.message || "Quantity decreased");
    } else {
      toast.error(result.message || "Failed to decrease quantity");
    }

    return result;

  } catch (error) {
    console.error("Error decreasing quantity:", error);
    toast.error("Something went wrong!");
    return { success: false };
  }
};
export default decreaseQuantity;
