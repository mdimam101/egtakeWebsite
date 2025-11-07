import React, { useEffect, useState } from 'react';
import '../styles/AllProductsStyle.css';
import UploadProductComponent from '../components/UploadProductComponent';
import SummaryApi from '../common';
import { toast } from 'react-toastify';
import AdminProductCart from '../components/AdminProductCart';
const AllProducts = () => {
  const [openModal, setUploadModal] = useState(false);
  const [allProducts, setAllProducts] = useState([]);

  const fetchAllProducts = async () => {
    try {
       //const response = await fetch(SummaryApi.get_product.url);
        const response = await fetch(SummaryApi.get_product.url);
      const data = await response.json();


      if (data.success) {
        setAllProducts(data.data || []);
      } else {
        toast.error(data.message);
        // console.error("API Error:", data.message);
      }
    } catch (error) {
      // console.error("Fetch Error:", error);
      toast.error("Failed to fetch products");
    }
  };

  useEffect(() => {
    fetchAllProducts();
  }, []);

  return (
    <>
      <div className="product-header">
        <h2 className="title">All Products</h2>
        <button className="upload-btn" onClick={() => setUploadModal(true)}>
          Upload Product
        </button>
      </div>

      {openModal && <UploadProductComponent onClose={() => setUploadModal(false)} fatchData={fetchAllProducts}/>}

      <div className="product-grid">
        {allProducts.length > 0 ? (
          allProducts.map((product, idx) => (
            <AdminProductCart data={product} key={idx} fatchData={fetchAllProducts} />
          ))
        ) : (
          <p>No products available</p>
        )}
      </div>
    </>
  );
};

export default AllProducts;
