import axios from 'axios';
import SummaryApi from '../common';

const updateProductStock = async (productId, variantImage, size, quantity) => {

  try {
     const t = localStorage.getItem('authToken');
    const res = await axios.put(
      SummaryApi.updateProductStock.url,
      {
        productId,
        variantImage,
        size,
        quantity, // quantity to reduce
      },
      {
        withCredentials: true,
        // headers: { 'Content-Type': 'application/json' },
         headers: t ? { Authorization: `Bearer ${t}` } : {},
      }
    );
    return res.data;
  } catch {
    //  console.error('Stock update failed:');
    return { success: false };
  }
};

export default updateProductStock;
