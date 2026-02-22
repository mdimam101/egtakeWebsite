/**
・District select করলে delivery option auto-control
・Narayanganj হলে Upazila দেখাবে
・Upazila অনুযায়ী FREE threshold বদলাবে
・FREE locked হলে “Add ৳X more…” + Locked badge
・Narayanganj এ “Standard ৳120” + (Sodor/Bandar হলে) “Express ৳150”
・Dhaka/Others under threshold হলে Std option দেখাবে
・Payment only COD
・Coupon apply API call করবে (তোমার backend থাকলে)
・Submit lock + “Placing order…” text
・Order success হলে stock update + cart clear + modal
*/

import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
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

const PROCESSING_FEE = 5;

// 🔽 Narayanganj Upazila list (same as RN)
const NARAYANGANJ_UPAZILAS = [
  "Narayanganj Sodor",
  "Bandar",
  "Shonargaon",
  "Others Upazila",
];

const CheckoutPage = () => {
  const { state } = useLocation();
  const selectedItems = state?.selectedItemsDetails || [];

  const navigate = useNavigate();
  const { fetchUserAddToCart } = useContext(Context);

  // ✅ UI states (same flow as RN)
  const [errors, setErrors] = useState({});
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMeta, setCouponMeta] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // ⏳ submit locking (same as RN)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false);

  // ✅ Thresholds & charges (fallback defaults; later you can feed from API/redux)
  const MIN_FREE_NAR = 999;
  const MIN_FREE_DHK = 1190;
  const MIN_FREE_OTH = 1500;

  const handlingChargeDefault = 15;

  // ✅ shipping form + upazila
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    district: "", // Dhaka | Narayanganj | Others
    upazila: "", // only Narayanganj
    _toggleUpazilaOpen: false,
  });

  // ✅ delivery option: "FREE" | "EXPRESS" | "NAR120" | "STD"
  const [deliveryOption, setDeliveryOption] = useState("FREE");
  const [userTouchedDelivery, setUserTouchedDelivery] = useState(false);

  // ✅ payment option (only COD)
  const [paymentMethod, setPaymentMethod] = useState("COD");

  // cart ids for delete
  const idArray = useMemo(
    () => selectedItems.map((item) => item._id).filter(Boolean),
    [selectedItems]
  );

  const baseTotal = useMemo(() => {
    return selectedItems.reduce((acc, item) => {
      const price = item?.selling || item?.productId?.selling || 0;
      const qty = item?.quantity ?? 1;
      return acc + price * qty;
    }, 0);
  }, [selectedItems]);

  // ✅ district base charges (same as RN)
  const districtCharge = (district) => {
    if (district === "Narayanganj") return 0;
    if (district === "Dhaka") return 50;
    if (district === "Others") return 130;
    return 0;
  };

  // 🔽 Upazila-wise threshold (same as RN)
  const getNarUpazilaThreshold = (upazila) => {
    if (upazila === "Narayanganj Sodor" || upazila === "Bandar") return MIN_FREE_NAR;
    if (upazila === "Shonargaon") return MIN_FREE_DHK;
    if (upazila === "Others Upazila") return MIN_FREE_OTH;
    return MIN_FREE_NAR; // fallback
  };

  const getFreeThreshold = (district, upazila) => {
    if (district === "Narayanganj") return getNarUpazilaThreshold(upazila);
    if (district === "Dhaka") return MIN_FREE_DHK;
    if (district === "Others") return MIN_FREE_OTH;
    return Infinity;
  };

  const currentThreshold = useMemo(
    () => getFreeThreshold(formData.district, formData.upazila),
    [formData.district, formData.upazila]
  );

  const freeEligible = formData.district ? baseTotal >= currentThreshold : true;
  const freeDisabled = !!formData.district && !freeEligible;

  const remainingForFree = formData.district
    ? Math.max(0, currentThreshold - baseTotal)
    : 0;

  // ✅ Narayanganj guard: under threshold & FREE -> force NAR120
  useEffect(() => {
    if (
      formData.district === "Narayanganj" &&
      baseTotal < currentThreshold &&
      deliveryOption === "FREE"
    ) {
      setDeliveryOption("NAR120");
    }
  }, [formData.district, formData.upazila, baseTotal, currentThreshold, deliveryOption]);

  // ✅ Disallow EXPRESS outside Sodor/Bandar
  useEffect(() => {
    if (
      formData.district === "Narayanganj" &&
      deliveryOption === "EXPRESS" &&
      !["Narayanganj Sodor", "Bandar"].includes(formData.upazila)
    ) {
      setDeliveryOption("NAR120");
      setUserTouchedDelivery(false);
    }
  }, [formData.district, formData.upazila, deliveryOption]);

  // ✅ District switch normalization + upazila reset
  useEffect(() => {
    const d = formData.district;
    if (!d) return;

    if (d === "Narayanganj") {
      if (!formData.upazila) {
        setDeliveryOption("NAR120");
      }
      if (deliveryOption === "STD") {
        setDeliveryOption(baseTotal >= currentThreshold ? "FREE" : "NAR120");
        setUserTouchedDelivery(false);
      }
      return;
    }

    // leaving Narayanganj -> clear upazila
    if (formData.upazila) {
      setFormData((p) => ({ ...p, upazila: "", _toggleUpazilaOpen: false }));
    }

    if (deliveryOption === "EXPRESS" || deliveryOption === "NAR120") {
      setDeliveryOption(freeEligible ? "FREE" : "STD");
      setUserTouchedDelivery(false);
    }
  }, [formData.district, baseTotal, freeEligible, currentThreshold, deliveryOption]); // keep same behavior

  // ✅ Dhaka/Others: auto toggle STD <-> FREE unless user touched
  useEffect(() => {
    if (
      !userTouchedDelivery &&
      (formData.district === "Dhaka" || formData.district === "Others")
    ) {
      if (!freeEligible && deliveryOption === "FREE") setDeliveryOption("STD");
      if (freeEligible && deliveryOption === "STD") setDeliveryOption("FREE");
    }
  }, [formData.district, freeEligible, deliveryOption, userTouchedDelivery]);

  // ✅ delivery charge compute (same as RN)
  const computeDeliveryCharge = (district, option) => {
    if (district === "Narayanganj") {
      if (option === "EXPRESS") return 150;
      if (option === "NAR120") return 120;
      return 0; // FREE
    }
    if (district === "Dhaka") return baseTotal >= MIN_FREE_DHK ? 0 : districtCharge(district);
    if (district === "Others") return baseTotal >= MIN_FREE_OTH ? 0 : districtCharge(district);
    return districtCharge(district);
  };

  const deliveryCharge = useMemo(
    () => computeDeliveryCharge(formData.district, deliveryOption),
    [formData.district, deliveryOption, baseTotal]
  );

  const handlingCharge = handlingChargeDefault;

  const subtotal = baseTotal + deliveryCharge + handlingCharge + PROCESSING_FEE - discount;

  const showExpress =
    formData.district === "Narayanganj" &&
    ["Narayanganj Sodor", "Bandar"].includes(formData.upazila);

  const deliveryLabelValue = deliveryCharge === 0 ? "FREE" : `৳${deliveryCharge}`;

  const freeTitleByArea = () => {
    if (formData.district === "Narayanganj") return `Free Delivery ৳${currentThreshold}+`;
    if (formData.district === "Dhaka") return `Free Delivery ৳${MIN_FREE_DHK}+`;
    if (formData.district === "Others") return `Free Delivery ৳${MIN_FREE_OTH}+`;
    return "Delivery commitment";
  };

  const onChange = (field, value) => {
    setFormData((p) => ({ ...p, [field]: value }));
  };

  // ✅ Coupon apply (server optional)
  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      toast.error("Please enter a coupon");
      return;
    }

    try {
      const t = localStorage.getItem("authToken");
      const res = await fetch(SummaryApi.coupon_apply.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(t ? { Authorization: `Bearer ${t}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ code, subtotal: baseTotal }),
      });

      const data = await res.json();
      if (data?.success) {
        const d = data?.totals?.discount || 0;
        setDiscount(d);
        setCouponMeta(data?.coupon || { code });
        setCouponCode(code);
        toast.success(`Coupon applied: ${code} (৳${d} off)`);
      } else {
        setDiscount(0);
        setCouponMeta(null);
        toast.error(data?.message || "Invalid coupon");
      }
    } catch (e) {
      setDiscount(0);
      setCouponMeta(null);
      toast.error("Invalid coupon")
      console.log(e);
      ;
    }
  };

  // ✅ Validate (same rules as RN)
  const validate = () => {
    const { name, phone, address, district, upazila } = formData;
    const newErrors = {};
    if (!name) newErrors.name = "Full name is required";
    if (!phone) newErrors.phone = "Phone number is required";
    if (!district) newErrors.district = "Please select your district";
    if (district === "Narayanganj" && !upazila) newErrors.upazila = "Please select your upazila";
    if (!address) newErrors.address = "Full address is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRemove = async (productIdArray) => {
    const result = await deleteCartItemWhenOrderplace(productIdArray);
    if (result?.success) fetchUserAddToCart();
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
      await handleRemove(idArray);

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
          <button className="back-btn" onClick={() => navigate(-1)}>←</button>
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
          ←
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
        <div className="card-title">🚚 Shipping Details</div>

        <input
          type="text"
          placeholder="Full Name"
          value={formData.name}
          onChange={(e) => onChange("name", e.target.value)}
          className={`input ${errors.name ? "input-error" : ""}`}
          disabled={isSubmitting}
        />
        {errors.name && <div className="error">{errors.name}</div>}

        <input
          type="text"
          placeholder="Phone"
          value={formData.phone}
          onChange={(e) => onChange("phone", e.target.value)}
          className={`input ${errors.phone ? "input-error" : ""}`}
          disabled={isSubmitting}
        />
        {errors.phone && <div className="error">{errors.phone}</div>}

        {/* District */}
        <select
          value={formData.district}
          onChange={(e) => {
            const val = e.target.value;
            onChange("district", val);
            if (val !== "Narayanganj") {
              setFormData((p) => ({ ...p, upazila: "", _toggleUpazilaOpen: false }));
            }
            setUserTouchedDelivery(false);
          }}
          className={`input ${errors.district ? "input-error" : ""}`}
          disabled={isSubmitting}
        >
          <option value="" disabled>
            Select District
          </option>
          <option value="Narayanganj">Narayanganj</option>
          <option value="Dhaka">Dhaka</option>
          <option value="Others">Others</option>
        </select>
        {errors.district && <div className="error">{errors.district}</div>}

        {/* Upazila */}
        {formData.district === "Narayanganj" && (
          <>
            <div
              className={`input upazila-trigger ${errors.upazila ? "input-error" : ""}`}
              onClick={() => !isSubmitting && setFormData((p) => ({ ...p, _toggleUpazilaOpen: !p._toggleUpazilaOpen }))}
              role="button"
            >
              <span className={formData.upazila ? "upazila-selected" : "upazila-placeholder"}>
                {formData.upazila || "Select Upazila (Narayanganj)"}
              </span>
              <span className="chev">▾</span>
            </div>

            {errors.upazila && <div className="error">{errors.upazila}</div>}

            {formData._toggleUpazilaOpen && (
              <div className="dropdown-list">
                {NARAYANGANJ_UPAZILAS.map((u) => (
                  <div
                    key={u}
                    className="dropdown-item"
                    onClick={() => {
                      onChange("upazila", u);
                      onChange("_toggleUpazilaOpen", false);
                      setUserTouchedDelivery(false);
                    }}
                    role="button"
                  >
                    {u}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <input
          type="text"
          placeholder="Full Address"
          value={formData.address}
          onChange={(e) => onChange("address", e.target.value)}
          className={`input ${errors.address ? "input-error" : ""}`}
          disabled={isSubmitting}
        />
        {errors.address && <div className="error">{errors.address}</div>}

        {/* Delivery Options */}
        {formData.district && (
          <div className="option-card">
            <div className="card-title">📦 Delivery Option</div>

            {/* FREE */}
            <div
              className={`option-row ${deliveryOption === "FREE" ? "active" : ""} ${freeDisabled || isSubmitting ? "disabled" : ""}`}
              onClick={() => {
                if (isSubmitting || freeDisabled) return;
                setDeliveryOption("FREE");
                setUserTouchedDelivery(true);
              }}
              role="button"
            >
              <div className="radio">
                <div className={`dot ${deliveryOption === "FREE" ? "dot-on" : ""}`} />
              </div>

              <div className="opt-mid">
                <div className="opt-title">{freeTitleByArea()}</div>
                <div className="opt-sub">
                  {formData.district === "Narayanganj"
                    ? "Delivery time 3–36 hours"
                    : formData.district === "Dhaka"
                    ? "Delivery time within 48 hours"
                    : "Delivery time within 1–3 days"}
                </div>

                {freeDisabled && (
                  <div className="lock-hint">
                    Add ৳{remainingForFree} more to unlock FREE
                  </div>
                )}
              </div>

              <div className="opt-price">FREE</div>

              {freeDisabled && <div className="lock-badge">🔒 Locked</div>}
            </div>

            {/* Narayanganj Standard */}
            {formData.district === "Narayanganj" && (
              <div
                className={`option-row ${deliveryOption === "NAR120" ? "active" : ""} ${isSubmitting ? "disabled" : ""}`}
                onClick={() => {
                  if (isSubmitting) return;
                  setDeliveryOption("NAR120");
                  setUserTouchedDelivery(true);
                }}
                role="button"
              >
                <div className="radio">
                  <div className={`dot ${deliveryOption === "NAR120" ? "dot-on" : ""}`} />
                </div>
                <div className="opt-mid">
                  <div className="opt-title">Standard Delivery</div>
                  <div className="opt-sub">Delivery time 3–24 hours</div>
                </div>
                <div className="opt-price">৳120</div>
              </div>
            )}

            {/* Express */}
            {showExpress && (
              <div
                className={`option-row ${deliveryOption === "EXPRESS" ? "active" : ""} ${isSubmitting ? "disabled" : ""}`}
                onClick={() => {
                  if (isSubmitting) return;
                  setDeliveryOption("EXPRESS");
                  setUserTouchedDelivery(true);
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
                <div className="opt-price">৳150</div>
              </div>
            )}

            {/* Dhaka Std */}
            {formData.district === "Dhaka" && !freeEligible && (
              <div
                className={`option-row ${deliveryOption === "STD" ? "active" : ""} ${isSubmitting ? "disabled" : ""}`}
                onClick={() => {
                  if (isSubmitting) return;
                  setDeliveryOption("STD");
                  setUserTouchedDelivery(true);
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

            {/* Others Std */}
            {formData.district === "Others" && !freeEligible && (
              <div
                className={`option-row ${deliveryOption === "STD" ? "active" : ""} ${isSubmitting ? "disabled" : ""}`}
                onClick={() => {
                  if (isSubmitting) return;
                  setDeliveryOption("STD");
                  setUserTouchedDelivery(true);
                }}
                role="button"
              >
                <div className="radio">
                  <div className={`dot ${deliveryOption === "STD" ? "dot-on" : ""}`} />
                </div>
                <div className="opt-mid">
                  <div className="opt-title">Standard Delivery</div>
                  <div className="opt-sub">Delivery time within 1–3 days</div>
                </div>
                <div className="opt-price">৳{districtCharge("Others")}</div>
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
        <div className="coupon-row">
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
        </div>

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
              {deliveryOption === "EXPRESS"
                ? "Express"
                : formData.district === "Narayanganj"
                ? "Narayanganj Std/Free"
                : "Standard"}
              )
            </div>
            <div className="sum-amount">
              <span className="old-price">৳150</span> {deliveryLabelValue}
            </div>
          </div>

          <div className="sum-row">
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
          </div>

          {discount > 0 && (
            <div className="sum-row">
              <div className="sum-label green">Coupon</div>
              <div className="sum-amount green">-৳{discount}</div>
            </div>
          )}

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