import React, { useEffect, useState } from "react";
import UploadProductComponent from "../components/UploadProductComponent";
import SummaryApi from "../common";
import { toast } from "react-toastify";
import AdminProductCart from "../components/AdminProductCart";
import "../styles/AllProducts.css";

const AllProducts = () => {
  const [openModal, setUploadModal] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(SummaryApi.get_product.url, {
        credentials: "include",
      });
      const data = await response.json();

      if (data.success) {
        setAllProducts(data.data || []);
      } else {
        toast.error(data.message || "Failed to fetch products");
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllProducts();
  }, []);

  return (
    <div className="admin-products-page">
      {/* Header */}
      <div className="admin-products-header">
        <div>
          <h2 className="admin-products-title">All Products</h2>
          <p className="admin-products-subtitle">
            Manage products, edit details, and upload new items.
          </p>
        </div>

        <button
          className="admin-products-btn admin-products-btn-primary"
          onClick={() => setUploadModal(true)}
        >
          + Upload Product
        </button>
      </div>

      {/* Modal */}
      {openModal && (
        <UploadProductComponent
          onClose={() => setUploadModal(false)}
          fatchData={fetchAllProducts}
        />
      )}

      {/* Content */}
      {loading ? (
        <div className="admin-products-loading">Loading products...</div>
      ) : allProducts.length > 0 ? (
        <div className="admin-products-grid">
          {allProducts.map((product, idx) => (
            <AdminProductCart
              data={product}
              key={product?._id || idx}
              fatchData={fetchAllProducts}
            />
          ))}
        </div>
      ) : (
        <div className="admin-products-empty">
          <div className="admin-products-empty-card">
            <p className="admin-products-empty-title">No products available</p>
            <p className="admin-products-empty-subtitle">
              Click “Upload Product” to add your first item.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllProducts;
