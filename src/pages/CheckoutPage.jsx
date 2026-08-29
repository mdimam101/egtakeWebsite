/**
・District select করলে delivery option auto-control
・Premium Narayanganj free delivery lock দেখাবে
・Narayanganj এ “Standard ৳70” + “Express ৳160”
・Dhaka/Others standard delivery দেখাবে
・Payment only COD
・Coupon apply API call করবে (তোমার backend থাকলে)
・Submit lock + “Placing order…” text
・Order success হলে stock update + cart clear + modal
*/

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import "../styles/CheckoutPageStyle.css";
import { useLocation, useNavigate } from "react-router";
import CheckoutItemCard from "../components/CheckoutItemCard";

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import SummaryApi from "../common";
import SuccessModal from "../components/SuccessModal";
import deleteCartItemWhenOrderplace from "../helpers/deleteCartItemWhenOrderplace";
import Context from "../context";
import updateProductStock from "../helpers/updateProductStock";
import { MdOutlineArrowBackIos } from "react-icons/md";
import trackBasic from "../helpers/trackBasic";
import { clearGuestCart, consumePendingCheckoutItems } from "../helpers/guestCart";
import GuidedCoachmark from "../components/GuidedCoachmark";
import DistrictDropdown from "../components/DistrictDropdown";
import { FiMapPin, FiShield } from "react-icons/fi";
import { trackMetaCommerceEvent, trackMetaPurchaseOnce } from "../helpers/metaPixel";

const PROCESSING_FEE = 0;

const CheckoutPage = () => {
  const { state } = useLocation();
  const [pendingCheckoutItems] = useState(() => consumePendingCheckoutItems());
  const selectedItems = useMemo(
    () => state?.selectedItemsDetails || pendingCheckoutItems || [],
    [pendingCheckoutItems, state?.selectedItemsDetails]
  );
  const navigate = useNavigate();
  const user = useSelector((state) => state?.userState?.user);
  const commonInfo = useSelector((state) => state?.commonState?.commonInfoList || []);
  const { fetchUserAddToCart } = useContext(Context);

  // ✅ UI states (same flow as RN)
  const [errors, setErrors] = useState({});
  // const [couponCode, setCouponCode] = useState("");
  // const [discount, setDiscount] = useState(0);
  // const [couponMeta, setCouponMeta] = useState(null);
  const couponCode = "web";
  const discount = 0;
  const couponMeta = true;

  const [isModalOpen, setIsModalOpen] = useState(false);

  // ⏳ submit locking (same as RN)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false);

  const checkoutTrackedRef = useRef(false);
  const purchaseTrackedRef = useRef(false);

  // ✅ Thresholds & charges from common info, with app fallback defaults.
  const MIN_FREE_NAR = commonInfo[0]?.nrGanjMiniOrdr
    ? Number(commonInfo[0].nrGanjMiniOrdr)
    : 999;

  const handlingCharge = 0//commonInfo[0]?.handlingCharge ? Number(commonInfo[0].handlingCharge) : 15;

  // ✅ shipping form 
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    district: "", // One of Bangladesh's 64 districts
    upazila: "", // kept in payload if backend already supports it
  });

  // Prefill shipping if the logged-in user already has saved shipping details.
  useEffect(() => {
    const prefillShippingDetails = async () => {
      try {
        const t = localStorage.getItem("authToken");
        const res = await axios.get(SummaryApi.current_user.url, {
          withCredentials: true,
          headers: t ? { Authorization: `Bearer ${t}` } : {},
        });

        const ship = res?.data?.data?.shipping;
        if (!ship) return;

        setFormData((prev) => ({
          ...prev,
          name: ship.name || "",
          phone: ship.phone || "",
          address: ship.address || "",
          district: ship.district === "Others" ? "" : ship.district || "",
          upazila: "",
        }));
      } catch {
        // Shipping prefill is optional; keep checkout usable if it fails.
      }
    };

    prefillShippingDetails();
  }, []);

  // ✅ delivery option: "FREE" | "EXPRESS" | "NAR70" | "STD"
  const [deliveryOption, setDeliveryOption] = useState("FREE");

  // ✅ payment option (only COD)
  const [paymentMethod, setPaymentMethod] = useState("COD");

  // cart ids for delete
  const idArray = useMemo(
    () => selectedItems.map((item) => item._id).filter(Boolean),
    [selectedItems]
  );

    // ✅ district base charges (same as app)
  const districtCharge = (district) => {
    if (district === "Narayanganj") return 70;
    if (district === "Dhaka") return 80;
    return district ? 130 : 0;
  };


  const baseTotal = useMemo(() => {
    return selectedItems.reduce((acc, item) => {
      const price = item?.selling || item?.productId?.selling || 0;
      const qty = item?.quantity ?? 1;
      return acc + price * qty;
    }, 0);
  }, [selectedItems]);

  const isPremiumUser = user?.role === "PREMIUM";

   // ✅ App basic logic: only premium Narayanganj users can unlock free delivery.
  const getFreeThreshold = useCallback(
    (district) => (district === "Narayanganj" ? MIN_FREE_NAR : Infinity),
    [MIN_FREE_NAR]
  );

  const currentThreshold = useMemo(
       () => getFreeThreshold(formData.district),
    [formData.district, getFreeThreshold]
  );

 const premiumMinimumEligible =
    formData.district === "Narayanganj" &&
    isPremiumUser &&
    baseTotal >= currentThreshold;

  const freeDisabled = !premiumMinimumEligible;

  const remainingForFree = formData.district
    ? Math.max(0, currentThreshold - baseTotal)
    : 0;

  useEffect(() => {
    if (!formData.district) return;

    if (formData.district === "Narayanganj") {
      setDeliveryOption(premiumMinimumEligible ? "FREE" : "NAR70");
      return;
    }

    setDeliveryOption("STD");
  }, [formData.district, premiumMinimumEligible]);

  const computeDeliveryCharge = useCallback(
    (district, option) => {
      if (district === "Narayanganj") {
        if (option === "FREE" && premiumMinimumEligible) return 0;
        if (option === "EXPRESS") return 160;
        return districtCharge(district);
      }

      return districtCharge(district);
    },
    [premiumMinimumEligible]
  );


  const deliveryCharge = useMemo(
    () => computeDeliveryCharge(formData.district, deliveryOption),
    [computeDeliveryCharge, formData.district, deliveryOption]
  );

 const subtotal = baseTotal + deliveryCharge + handlingCharge + PROCESSING_FEE - discount;

 const totalItems = useMemo(
    () => selectedItems.reduce((total, item) => total + (item?.quantity ?? 1), 0),
    [selectedItems]
  );

  useEffect(() => {
    if (!selectedItems.length || checkoutTrackedRef.current) return;

    checkoutTrackedRef.current = true;
    trackBasic('checkout');
    trackMetaCommerceEvent("InitiateCheckout", {
      value: baseTotal,
      num_items: totalItems,
    });
  }, [baseTotal, selectedItems.length, totalItems]);

  const deliveryLabelValue = deliveryCharge === 0 ? "FREE" : `৳${deliveryCharge}`;

  const freeTitleByArea = () => {
    if (formData.district === "Narayanganj") return `Premium Free Delivery ৳${MIN_FREE_NAR}+`;
    return "Delivery commitment";
  };

  const onChange = (field, value) => {
    setFormData((p) => ({ ...p, [field]: value }));
  };

  // ✅ Coupon apply (server optional)
  // const handleApplyCoupon = async () => {
    // const code = couponCode.trim().toUpperCase();
    // if (!code) {
    //   // toast.error("Please enter a coupon");
    //   console.log("Please enter a coupon");
    //   return;
    // }

    // try {
    //   const t = localStorage.getItem("authToken");
    //   const res = await fetch(SummaryApi.coupon_apply.url, {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //       ...(t ? { Authorization: `Bearer ${t}` } : {}),
    //     },
    //     credentials: "include",
    //     body: JSON.stringify({ code, subtotal: baseTotal }),
    //   });

    //   const data = await res.json();
    //   if (data?.success) {
    //     const d = data?.totals?.discount || 0;
    //     setDiscount(d);
    //     setCouponMeta(data?.coupon || { code });
    //     setCouponCode(code);
    //     toast.success(`Coupon applied: ${code} (৳${d} off)`);
    //   } else {
    //     setDiscount(0);
    //     setCouponMeta(null);
    //     console.log(data?.message || "Invalid coupon", couponCode);
    //   }
    // } catch (e) {
    //   setDiscount(0);
    //   setCouponMeta(null);
    //   toast.error("Invalid coupon")
    //   console.log(e);
    //   console.log("Invalid coupon", couponCode);
    //   ;
    // }
  // };

  // ✅ Validate (same rules as RN)
  const validate = () => {
    const { name, phone, address, district } = formData;
    const newErrors = {};
    if (!name) newErrors.name = "Full name is required";
    if (!phone) newErrors.phone = "Phone number is required";
    if (!district) newErrors.district = "Please select your district";
    if (!address) newErrors.address = "Full address is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRemove = async (productIdArray) => {
    const result = await deleteCartItemWhenOrderplace(productIdArray);
    if (result?.success) fetchUserAddToCart();
  };

  // Save/update default shipping silently after a successful order.
  const upsertUserShipping = async () => {
    try {
      const { name, phone, address, district, upazila } = formData;
      if (!name || !phone || !address || !district) return;

      const t = localStorage.getItem("authToken");
      await axios.put(
        SummaryApi.update_shipping.url,
        { name, phone, address, district, upazila },
        {
          withCredentials: true,
          headers: t ? { Authorization: `Bearer ${t}` } : {},
        }
      );
    } catch {
      // Saving default shipping should not block order completion.
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (isSubmitting || submitLockRef.current) return;

    if (!validate()) {
      toast.error("Please fill up shipping details");
      return;
    }

    setIsSubmitting(true);
    submitLockRef.current = true;

    try {
      const { name, phone, address, district, upazila } = formData;

      const deliveryTimeline = deliveryOption === "EXPRESS" ? "Express" : "Normal";

      const orderPayload = {
        items: selectedItems.map((item) => ({
          productId: item?.productId?._id || item?.productId,
          productName: item?.productName || item?.productId?.productName,
          quantity: item?.quantity ?? 1,
          price: (item?.selling || item?.productId?.selling || 0) * (item?.quantity ?? 1),
          size: item?.size,
          color: item?.color,
          image: item?.image,
          productCodeNumber: item?.productId?.productCodeNumber,
        })),
        shippingDetails: { name, phone, address, district, upazila },
        deliveryType: deliveryTimeline,
        deliveryCharge,
        paymentMethod,
        totalAmount: subtotal,
        discount,
        couponCode: couponMeta ? couponCode : "",
      };

      const t = localStorage.getItem("authToken");
      const response = await fetch(SummaryApi.orders.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(t ? { Authorization: `Bearer ${t}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(orderPayload),
      });

      const data = await response.json();

      if (!data?.success) {
        toast.error(data?.message || "Order failed");
        return;
      }

      const confirmedOrder = data?.data || data?.order || {};
      const confirmedOrderId = 
        confirmedOrder?._id ||
        confirmedOrder?.orderId ||
        data?.orderId ||
        data?._id ||
        `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      if (!purchaseTrackedRef.current) {
        purchaseTrackedRef.current = true;
        trackMetaPurchaseOnce(confirmedOrderId, {
          value: Number(confirmedOrder?.totalAmount - deliveryCharge) || 0,
          content_ids: orderPayload.items.map((item) => item.productId).filter(Boolean),
          num_items: orderPayload.items.reduce(
            (total, item) => total + (item.quantity ?? 1),
            0
          ),
        });
      }

      trackBasic("checkout", { count: selectedItems.length });

      // update address
      await upsertUserShipping();

      // ✅ stock update (same as your existing behavior)
      for (const item of selectedItems) {
        await updateProductStock(
          item?.productId?._id || item?.productId,
          item?.image,
          item?.size,
          item?.quantity ?? 1
        );
      }

      // ✅ remove from cart
      if (selectedItems.some((item) => item?.isGuestCartItem || item?._id?.startsWith?.("guest::"))) {
        clearGuestCart();
      } else {
        await handleRemove(idArray);
      }

      setIsModalOpen(true);
    } catch (e) {
      console.log(e);
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
      submitLockRef.current = false;
    }
  };

  if (!selectedItems.length) {
    return (
      <div className="checkout-page">
        <div className="checkout-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <MdOutlineArrowBackIos/>
          </button>
          <h2>Order Confirmation</h2>
        </div>

        <div className="empty-state">
          <div className="empty-emoji">🛒</div>
          <h3>No items selected</h3>
          <p>Please go back and select items from cart.</p>
          <button className="btn-primary" onClick={() => navigate("/cart")}>
            Back to Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <ToastContainer />

      {/* Header (RN style) */}
      <div className="checkout-header">
        <button className="back-btn" onClick={() => navigate(-1)} disabled={isSubmitting}>
          <MdOutlineArrowBackIos/>
        </button>
        <h2>Order Confirmation</h2>
      </div>

      {/* Items */}
      <div className="section-title">
        Order Items ({selectedItems.length})
      </div>

      <div className="checkout-items-scroll">
        {selectedItems.map((item, idx) => (
          <CheckoutItemCard key={`${item?._id || idx}`} item={item} />
        ))}
      </div>

      {/* Shipping */}
      <form className="shipping-card" onSubmit={handleSubmitOrder}>
        <div className="shipping-card__header">
          <span className="shipping-card__header-icon"><FiMapPin /></span>
          <div>
            <div className="shipping-card__title">Shipping Details</div>
            <div className="shipping-card__subtitle">Where should we deliver your order?</div>
          </div>
          <span className="shipping-card__secure"><FiShield /> Secure</span>
        </div>

        <label className="shipping-field-label" htmlFor="shipping-name">Full name</label>

        <input
          id="shipping-name"
          type="text"
          placeholder="Full Name"
          value={formData.name}
          onChange={(e) => onChange("name", e.target.value)}
          className={`input ${errors.name ? "input-error" : ""}`}
          disabled={isSubmitting}
        />
        {errors.name && <div className="error">{errors.name}</div>}

        <label className="shipping-field-label" htmlFor="shipping-phone">Phone number</label>
        <input
          id="shipping-phone"
          placeholder="Phone"
          value={formData.phone}
          onChange={(e) => onChange("phone", e.target.value)}
          className={`input ${errors.phone ? "input-error" : ""}`}
          disabled={isSubmitting}
        />
        {errors.phone && <div className="error">{errors.phone}</div>}

        <label className="shipping-field-label">Select area</label>
        <DistrictDropdown
          selected={formData.district}
          onSelect={(district) => setFormData((previous) => ({
            ...previous,
            district,
            upazila: "",
          }))}
          disabled={isSubmitting}
          hasError={Boolean(errors.district)}
        />

        {errors.district && <div className="error">{errors.district}</div>}

         {/* Upazila intentionally not shown on website checkout. */}
        

        <label className="shipping-field-label" htmlFor="shipping-address">Full address</label>
        <textarea
          id="shipping-address"
          type="text"
          placeholder="Full Address"
          value={formData.address}
          onChange={(e) => onChange("address", e.target.value)}
          className={`input shipping-address ${errors.address ? "input-error" : ""}`}
          disabled={isSubmitting}
        />
        {errors.address && <div className="error">{errors.address}</div>}

        {/* Delivery Options */}
        {formData.district && (
          <div className="option-card">
            <div className="card-title">📦 Delivery Option</div>

            {/* FREE */}
            {formData.district === "Narayanganj" && <div
              className={`option-row ${deliveryOption === "FREE" ? "active" : ""} ${freeDisabled || isSubmitting ? "disabled" : ""}`}
              onClick={() => {
                if (isSubmitting || freeDisabled) return;
                setDeliveryOption("FREE");
              }}
              role="button"
            >
              <div className="radio">
                <div className={`dot ${deliveryOption === "FREE" ? "dot-on" : ""}`} />
              </div>

              <div className="opt-mid">
                <div className="opt-title">{freeTitleByArea()}</div>
                <div className="opt-sub">
                  Premium users get free delivery after minimum order
                </div>

                {freeDisabled && (
                  <div className="lock-hint">
                    {isPremiumUser ? `Add ৳${remainingForFree} more to unlock FREE` : "Only PREMIUM users can unlock FREE delivery"}
                  </div>
                )}
              </div>

              <div className="opt-price">FREE</div>

              {freeDisabled && <div className="lock-badge">🔒 Locked</div>}
            </div>
            }

            {/* Narayanganj Standard */}
            {formData.district === "Narayanganj" && (
              <div
                 className={`option-row ${deliveryOption === "NAR70" ? "active" : ""} ${isSubmitting ? "disabled" : ""}`}
                onClick={() => {
                  if (isSubmitting) return;
                   setDeliveryOption("NAR70");
                }}
                role="button"
              >
                <div className="radio">
                  <div className={`dot ${deliveryOption === "NAR70" ? "dot-on" : ""}`} />
                </div>
                <div className="opt-mid">
                  <div className="opt-title">Standard Delivery</div>
                  <div className="opt-sub">Delivery time 3–24 hours</div>
                </div>
                <div className="opt-price">৳70</div>
              </div>
            )}

            {/* Express */}
             {formData.district === "Narayanganj" && (
              <div
                className={`option-row ${deliveryOption === "EXPRESS" ? "active" : ""} ${isSubmitting ? "disabled" : ""}`}
                onClick={() => {
                  if (isSubmitting) return;
                  setDeliveryOption("EXPRESS");
                }}
                role="button"
              >
                <div className="radio">
                  <div className={`dot ${deliveryOption === "EXPRESS" ? "dot-on" : ""}`} />
                </div>
                <div className="opt-mid">
                  <div className="opt-title">Express Delivery</div>
                  <div className="opt-sub">Delivery within 3 hours</div>
                </div>
                 <div className="opt-price">৳160</div>
              </div>
            )}

            {/* Dhaka Std */}
             {formData.district === "Dhaka" && (
              <div
                className={`option-row ${deliveryOption === "STD" ? "active" : ""} ${isSubmitting ? "disabled" : ""}`}
                onClick={() => {
                  if (isSubmitting) return;
                  setDeliveryOption("STD");
                 
                }}
                role="button"
              >
                <div className="radio">
                  <div className={`dot ${deliveryOption === "STD" ? "dot-on" : ""}`} />
                </div>
                <div className="opt-mid">
                  <div className="opt-title">Standard Delivery</div>
                  <div className="opt-sub">Delivery time within 48 hours</div>
                </div>
                <div className="opt-price">৳{districtCharge("Dhaka")}</div>
              </div>
            )}

            {/* All districts outside Dhaka and Narayanganj */}
           {formData.district !== "Dhaka" && formData.district !== "Narayanganj" && (
              <div
                className={`option-row ${deliveryOption === "STD" ? "active" : ""} ${isSubmitting ? "disabled" : ""}`}
                onClick={() => {
                  if (isSubmitting) return;
                  setDeliveryOption("STD");
                }}
                role="button"
              >
                <div className="radio">
                  <div className={`dot ${deliveryOption === "STD" ? "dot-on" : ""}`} />
                </div>
                <div className="opt-mid">
                  <div className="opt-title">Standard Delivery</div>
                  <div className="opt-sub">Delivery to {formData.district} within 1–3 days</div>
                </div>
                <div className="opt-price">৳{districtCharge(formData.district)}</div>
              </div>
            )}
          </div>
        )}

        {/* Payment */}
        <div className="option-card">
          <div className="card-title">💳 Payment Option</div>

          <div
            className={`option-row ${paymentMethod === "COD" ? "active" : ""} ${isSubmitting ? "disabled" : ""}`}
            onClick={() => !isSubmitting && setPaymentMethod("COD")}
            role="button"
          >
            <div className="radio">
              <div className={`dot ${paymentMethod === "COD" ? "dot-on" : ""}`} />
            </div>
            <div className="opt-mid">
              <div className="opt-title">Cash on Delivery</div>
              <div className="opt-sub">Pay when you receive</div>
            </div>
            <div className="opt-price">—</div>
          </div>
        </div>

        {/* Coupon */}
        {/* <div className="coupon-row">
          <input
            className="coupon-input"
            type="text"
            placeholder="Enter coupon"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            disabled={isSubmitting}
          />
          <button
            type="button"
            className="coupon-btn"
            onClick={handleApplyCoupon}
            disabled={isSubmitting}
          >
            Apply
          </button>
        </div> */}

        {/* Summary */}
        <div className="summary-box">
          <div className="sum-row">
            <div className="sum-label">Item(s) Total</div>
            <div className="sum-amount">
              ৳{selectedItems.reduce((acc, item) => {
                const original = item?.price || item?.productId?.price || 0;
                const qty = item?.quantity ?? 1;
                return acc + original * qty;
              }, 0)}
            </div>
          </div>

          <div className="sum-row">
            <div className="sum-label">Item(s) Discount</div>
            <div className="sum-amount">
              -৳{selectedItems.reduce((acc, item) => {
                const original = item?.price || item?.productId?.price || 0;
                const selling = item?.selling || item?.productId?.selling || 0;
                const qty = item?.quantity ?? 1;
                return acc + Math.max(original - selling, 0) * qty;
              }, 0)}
            </div>
          </div>

          <div className="sum-row">
            <div className="sum-label">
              Delivery Charge (
               {deliveryOption === "FREE"
                ? "Premium Free"
                : deliveryOption === "EXPRESS"
                ? "Express"
                : "Standard"}
              )
            </div>
            <div className="sum-amount">
               <span className="old-price">৳160</span> {deliveryLabelValue}
            </div>
          </div>

          {/* <div className="sum-row">
            <div className="sum-label">Handling Charge(Internal cost±)</div>
            <div className="sum-amount">
              <span className="old-price">৳25</span> ৳{handlingCharge}
            </div>
          </div>

          <div className="sum-row">
            <div className="sum-label">Processing Fee(server, apps, etc±)</div>
            <div className="sum-amount">
              <span className="old-price">৳9</span> ৳{PROCESSING_FEE}
            </div>
          </div> */}

          {/* {discount > 0 && (
            <div className="sum-row">
              <div className="sum-label green">Coupon</div>
              <div className="sum-amount green">-৳{discount}</div>
            </div>
          )} */}

          <div className="sum-row total">
            <div className="sum-label red"><b>Subtotal</b></div>
            <div className="sum-total">৳{subtotal}</div>
          </div>
        </div>

        {/* Bottom fixed submit button (RN style) */}
        <div className="bottom-submit">
          <button
            type="submit"
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Placing order..." : "Submit order"}
          </button>
        </div>
        <GuidedCoachmark
          enabled={
            selectedItems.length > 0 && !isSubmitting
          }
          message="সব তথ্য ঠিক থাকলে এখানে চাপ দিয়ে অর্ডারটি সম্পূর্ণ করুন।"
          bottom={140}
          right={25}
          width={284}
          targetRight={-14}
          delay={800}
        />
      </form>

      <SuccessModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          navigate("/");
        }}
      />
    </div>
  );
};

export default CheckoutPage;