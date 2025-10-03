import SummaryApi from "../common";
import { toast } from "react-toastify";

const increaseQuantity = async (cartItemId) => {
  try {
    const response = await fetch(SummaryApi.increaseQuantity.url, {
      method: SummaryApi.increaseQuantity.method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ cartItemId }),
    });

    const result = await response.json();

    if (result.success) {
      toast.success(result.message || "Quantity increased");
    } else {
      toast.error(result.message || "Failed to increase quantity");
    }

    return result;
  } catch (err) {
    toast.error("Error increasing quantity");
    console.error(err);
    return { success: false };
  }
};
export default increaseQuantity;
