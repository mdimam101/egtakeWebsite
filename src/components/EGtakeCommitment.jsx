import React, { useState } from "react";
import { useSelector } from "react-redux";
import "../styles/EGtakeCommitment.css"

export const EGtakeCommitment = () => {
  const commonInfo = useSelector((s) => s.commonState.commonInfoList) ?? [];
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCommitment, setSelectedCommitment] = useState({
    title: "",
    detail: "",
  });

  const openCommitmentModal = (title, detail) => {
    setSelectedCommitment({ title, detail });
    setModalVisible(true);
  };
console.log("🌻🌻🌻",commonInfo);

  // const c0 = commonInfo?.[0] || {};

  return (
    <>
      <div className="egc-wrap">
        <div className="egc-spacer" />

        <div className="egc-card">
          <div className="egc-header">
            <div className="egc-headerText">EGtake Commitment</div>
          </div>

          <button
            type="button"
            className="egc-item"
//             onClick={() =>
//               openCommitmentModal(
//                 "Free Delivery",
//                 `✓নারায়ণগঞ্জে ${commonInfo[0]?.nrGanjMiniOrdr}+ টাকা বা তার বেশি অর্ডার করলে ফ্রি ডেলিভারি।
// ✓ঢাকা ${commonInfo[0]?.DhakaMiniOrdr}+ টাকা বা তার বেশি অর্ডার করলে ফ্রি ডেলিভারি।
// ✓নারায়ণগঞ্জ ও ঢাকার বাইরে ${commonInfo[0]?.OthersAreaMiniOrdr}+ টাকা বা তার বেশি অর্ডার করলে ফ্রি ডেলিভারি।
// ✓--Narayanganj Express delivery within 3 hours--`,
//               )
//             }
          >
            <div className="egc-rowJustify">
              <div className="egc-title">🚚 Free delivery</div>
              <div className="egc-arrow">›</div>
            </div>

            <div className="egc-check">
              <span className="egc-green">✓</span> Available on the{" "}
        <span style={{ fontWeight: "bold", color: "red" }}>EGtake</span> App
            </div>
          </button>

          <button
            type="button"
            className="egc-item"
            onClick={() =>
              openCommitmentModal(
                "Delivery Commitment",
                `✓ 100円 coupon code if delayed
✓ Refund if items damaged
✓ Refund if package lost
✓ Refund if no delivery`,
              )
            }
          >
            <div className="egc-rowJustify">
              <div className="egc-title">📦 Delivery Commitment</div>
              <div className="egc-arrow">›</div>
            </div>

            <div className="egc-row">
              <div className="egc-check">
                <span className="egc-green">✓</span> ৳100 coupon if late
              </div>
              <div className="egc-check">
                <span className="egc-green">✓</span> Refund if items damaged
              </div>
            </div>

            <div className="egc-row">
              <div className="egc-check">
                <span className="egc-green">✓</span> Refund if wrong items
              </div>
              <div className="egc-check">
                <span className="egc-green">✓</span> Refund if no delivery
              </div>
            </div>
          </button>

          <button
            type="button"
            className="egc-item egc-item-last"
            onClick={() =>
              openCommitmentModal(
                "Free Return Commitment",
                `✓ অর্ডার করা পণ্যের পরিবর্তে ভিন্ন কিছু এসেছে।
✓ পণ্যটি পৌঁছানোর সময় ভাঙা, ফাটা, বা কাজ করছে না।
✓ প্রয়োজনীয় পার্টস বা এক্সেসরিজ নেই (যেমন চার্জার, কভার, ক্যাবল ইত্যাদি)।
✓ অর্ডার অনুযায়ী সাইজ বা কালার আসেনি।
✓ অর্ডার অনুযায়ী সংখ্যা ঠিকমতো আসেনি।
✓ ইলেকট্রনিক আইটেম চালু হয় না বা সমস্যা করে।`,
              )
            }
          >
            <div className="egc-rowJustify">
              <div className="egc-title">🔁 Free Return Commitment</div>
              <div className="egc-arrow">›</div>
            </div>

            <div className="egc-row">
              <div className="egc-check">
                <span className="egc-green">✓</span> Wrong item delivered
              </div>
              <div className="egc-check">
                <span className="egc-green">✓</span> Damaged or defective item
              </div>
            </div>

            <div className="egc-row">
              <div className="egc-check">
                <span className="egc-green">✓</span> Size/Color mismatch
              </div>
              <div className="egc-check">
                <span className="egc-green">✓</span> See full return policy
              </div>
            </div>
          </button>
        </div>

        {modalVisible && (
          <div
            className="egc-modalOverlay"
            onClick={() => setModalVisible(false)}
            role="presentation"
          >
            <div
              className="egc-modalContent"
              onClick={(e) => e.stopPropagation()}
              role="presentation"
            >
              <div className="egc-modalTitle">{selectedCommitment.title}</div>

              <pre className="egc-modalDetail">{selectedCommitment.detail}</pre>

              <button
                type="button"
                className="egc-modalButton"
                onClick={() => setModalVisible(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
