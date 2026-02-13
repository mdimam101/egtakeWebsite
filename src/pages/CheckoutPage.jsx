import React, { useContext, useMemo, useState } from "react";
import "../styles/CheckoutPageStyle.css";
import { useLocation, useNavigate } from "react-router";
import CheckoutItemCard from "../components/CheckoutItemCard";

import { useFormik } from "formik";
import * as Yup from "yup";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SummaryApi from "../common";
import SuccessModal from "../components/SuccessModal";
import deleteCartItemWhenOrderplace from "../helpers/deleteCartItemWhenOrderplace";
import Context from "../context";
import updateProductStock from "../helpers/updateProductStock";
// import { useSelector } from "react-redux";

const CheckoutPage = () => {
  // const userId = useSelector((state) => state?.userState?.user?._id);
  // console.log("userId",userId);

  const { state } = useLocation();
  const selectedItems = state?.selectedItemsDetails || [];
  console.log("🦌◆🦌◆cartItem",selectedItems);
  

  // শুধু _id গুলা নিয়ে নতুন array বানানো:
  let idArray = selectedItems.map((item) => item._id);

  console.log("selectedItems99", idArray);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();

  const { fetchUserAddToCart } = useContext(Context);

  const processingFee = 1;

  console.log("selectedItems---->", selectedItems);

  // Calculate baseTotal
  const baseTotal = useMemo(() => {
    return selectedItems.reduce((acc, item) => {
      const price = item?.selling || item?.productId?.selling;
      return acc + price * item.quantity;
    }, 0);
  }, [selectedItems]);

  // Calculate handlingCharge and deliveryCharge based on district
  const getDeliveryCharge = (district) => {
    if (district === "Narayanganj") {
      return 0;
    }
    if (district === "Dhaka") return 40;
    if (district === "Outside") return 130;
    return 0;
  };

  const formik = useFormik({
    initialValues: {
      name: "",
      phone: "",
      address: "",
      district: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Name is required"),
      phone: Yup.string().required("Phone is required"),
      address: Yup.string().required("Address is required"),
      district: Yup.string().required("District is required"),
    }),
    onSubmit: async (values, { resetForm }) => {
      const deliveryCharge = getDeliveryCharge(values.district);

      // handling charge logic
      let handlingCharge = 9;
      if (values.district === "Narayanganj" && baseTotal < 200) {
        handlingCharge = 19;
      }

      console.log("deliveryCharge", deliveryCharge);

      let grandTotal =
        baseTotal + deliveryCharge + handlingCharge + processingFee;

      const orderPayload = {
        items: selectedItems.map((item) => ({
          productId: item.productId._id,
          productName:item?.productName || item.productId?.productName,
          quantity: item.quantity,
          price: (item?.selling || item?.productId?.selling) * item.quantity,
          size: item.size,
          color: item.color,
          image: item.image,
          productCodeNumber: item.productId?.productCodeNumber,
        })),
        shippingDetails: {
          name: values.name,
          phone: values.phone,
          address: values.address,
          district: values.district,
        },
        deliveryType: "district-based",
        totalAmount: grandTotal,
      };

      console.log("submit", orderPayload);

      try {
        const t = localStorage.getItem('authToken');
        const response = await fetch(SummaryApi.orders.url, {
          method: "POST",
          // headers: {
          //   "Content-Type": "application/json",
          // },
            headers: t ? { Authorization: `Bearer ${t}` } : {},
          credentials: "include",
          body: JSON.stringify(orderPayload),
        });

        const data = await response.json();

        if (data.success) {
          console.log("response", data.data);
          resetForm();
          handlePlaceOrder();
          handleRemove(idArray);
        for (const item of selectedItems) {
         await updateProductStock(
         item.productId._id,
         item.image,
         item.size,
         item.quantity
         );
        }

        } else {
          toast.error(data.message || "Failed to place order");
        }
      } catch (err) {
        toast.error("Something went wrong");
        console.error("Order Error:", err);
      }
    },
  });

  // Calculate deliveryCharge and handlingCharge for current district input
  const deliveryCharge = getDeliveryCharge(formik.values.district);

  const handlingCharge = useMemo(() => {
    if (formik.values.district === "Narayanganj" && baseTotal < 200) {
      return 19;
    }
    return 9;
  }, [formik.values.district, baseTotal]);

  const Subtotal =
    baseTotal +
    deliveryCharge +
    handlingCharge +
    processingFee ;

  const handlePlaceOrder = () => {
    // এখানে order place করলে পরে call করবে
    setIsModalOpen(true);
  };

  const modalClose = () => {
    navigate("/");
    setIsModalOpen(false);
  };

  const handleRemove = async (productId) => {
    console.log("productId-------", productId);

    const result = await deleteCartItemWhenOrderplace(productId);
    if (result?.success) {
      fetchUserAddToCart();
    }
  };

  return (
    <div className="checkout-page">
      <ToastContainer />
      <h2>Checkout</h2>

      <div className="checkout-scroll-container">
        {selectedItems.map((item) => (
          <CheckoutItemCard key={item._id} item={item} />
        ))}
      </div>

      <form onSubmit={formik.handleSubmit} className="shipping-form">
        <h3>Shipping Details</h3>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          {...formik.getFieldProps("name")}
        />
        {formik.touched.name && formik.errors.name && (
          <div className="error">{formik.errors.name}</div>
        )}

        <input
          type="text"
          name="phone"
          placeholder="Phone Number"
          {...formik.getFieldProps("phone")}
        />
        {formik.touched.phone && formik.errors.phone && (
          <div className="error">{formik.errors.phone}</div>
        )}

        <select name="district" {...formik.getFieldProps("district")}>
          <option value="" disabled>
            Select District
          </option>
          <option value="Narayanganj">Narayanganj</option>
          <option value="Dhaka">Dhaka</option>
          <option value="Outside">Outside</option>
        </select>
        {formik.touched.district && formik.errors.district && (
          <div className="error">{formik.errors.district}</div>
        )}

        <input
          type="text"
          name="address"
          placeholder="Address"
          {...formik.getFieldProps("address")}
        />
        {formik.touched.address && formik.errors.address && (
          <div className="error">{formik.errors.address}</div>
        )}

        {/* Coupon Field */}
        <div className="coupon-container">
          <input
            type="text"
            placeholder="Enter coupon code"
            //onChange={(e) => setCouponCode(e.target.value)}
          />
          <button
            type="button"
            className="apply-coupon-btn"
            // onClick={handleApplyCoupon}
          >
            Apply
          </button>
        </div>

        <div className="checkout-summary">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontFamily: "sans-serif" }}> Delivery Charge</div>{" "}
            <div>
              <span className="old-price">৳150</span>{" "}
              <span className="new-price">৳{deliveryCharge}</span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontFamily: "sans-serif" }}> Handling Charge</div>
            <div>
              {" "}
              <span className="old-price">৳25</span>{" "}
              <span className="new-price">৳{handlingCharge}</span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontFamily: "sans-serif" }}> Processing Fee </div>
            <div>
              {" "}
              <span className="old-price">৳4</span>{" "}
              <span className="new-price">৳{processingFee}</span>{" "}
            </div>
          </div>
          <hr />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <strong>
                <span style={{ color: "red" }}>Subtotal</span>
              </strong>
            </div>{" "}
            <div style={{ fontSize: "20px", color: "red", fontWeight: "bold" }}>
              ৳{Subtotal}
            </div>
          </div>
          <button type="submit" className="place-order-btn">
            Place Order
          </button>
          <SuccessModal isOpen={isModalOpen} onClose={() => modalClose()} />
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
