import React, { useEffect, useState } from "react";
import { MdEdit } from "react-icons/md";
import { createPortal } from "react-dom";          // ⬅️ NEW
import "../styles/AdminProductCart.css";
import AdminProductEdit from "./AdminProductEdit";

const getPrimaryImage = (p) => {
  const v0 = p?.variants?.[0];
  const img = v0?.images?.[0];
  return img || p?.productImg?.[0] || "/no-image.png";
};

const AdminProductCart = ({ data, fatchData }) => {
  const [editProduct, setEditProduct] = useState(false);
  const primaryImg = getPrimaryImage(data);

  // 🔒 Body scroll lock when modal is open
  useEffect(() => {
    if (editProduct) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => document.body.classList.remove("modal-open");
  }, [editProduct]);

 return (
  <div className="admin-product-card">
    <img src={primaryImg} alt={data.productName} className="admin-product-img" />

    <div className="admin-product-info">
      <h3>{data.productName}</h3>
      <p>৳{data.selling}</p>
    </div>

    <MdEdit
      className="admin-edit-icon"
      title="Edit Product"
      onClick={() => setEditProduct(true)}
    />

    {editProduct &&
      createPortal(
        <AdminProductEdit
          paramData={data}
          onClose={() => setEditProduct(false)}
          fatchData={fatchData}
        />,
        document.body
      )}
  </div>
);

};

export default AdminProductCart;
