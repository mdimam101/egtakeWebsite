import React, { useState } from "react";
import { MdEdit } from "react-icons/md";
import '../styles/AllProductsStyle.css'
import AdminProductEdit from "./AdminProductEdit";
// import { MdDelete } from "react-icons/md";

const AdminProductCart = ({ data, fatchData }) => {
  const [editProduct, setEditProduct] = useState(false)
  return (
    <div className="product-card">
      <img
        src={data.productImg?.[0]}
        alt={data.productName}
        className="product-img"
      />
      <div className="product-info">
        <h3>{data.productName}</h3>
        <p>৳{data.selling}</p>
      </div>
      {/* <MdDelete/> */}
      <MdEdit className="edit-icon" title="Edit Product"  onClick={() => setEditProduct(true)}/>
      {
       editProduct && <AdminProductEdit paramData={data} onClose={() => setEditProduct(false)} fatchData = {fatchData}/>
      }
    </div>
  );
};

export default AdminProductCart;
