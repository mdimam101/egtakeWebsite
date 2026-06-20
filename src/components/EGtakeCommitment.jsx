import React, { useState } from "react";
import { useSelector } from "react-redux";
import "../styles/EGtakeCommitment.css";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.emamexp2.testeasupload";

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
  console.log("🌻🌻🌻", commonInfo);

  // const c0 = commonInfo?.[0] || {};

  return (
    <>
      <div className="egc-wrap">
        <div className="egc-spacer" />

        <div className="egc-card">
          <div className="egc-header">
            <div className="egc-headerText">Pyzara Commitment</div>
          </div>

          <button
            type="button"
            className="egc-item"
                        onClick={() =>
                          openCommitmentModal(
                            "Everything You Need, All in One App",
                            `✓ AI-Powered Skincare Suggestions
  আপনার skin type ও concern অনুযায়ী উপযুক্ত skincare product recommendation পান।
✓ Free Delivery Opportunities
  নির্দিষ্ট offer বা order amount-এর ওপর free delivery সুবিধা উপভোগ করুন।
✓ Apply Coupons & Save More
  Coupon ব্যবহার করে আপনার order-এ additional discount পান।
✓ Earn Reward Points
  প্রতিটি purchase-এ points অর্জন করুন এবং পরবর্তী order-এ ব্যবহার করুন।
✓ Live Customer Support
  যেকোনো প্রয়োজনে দ্রুত সহায়তার জন্য live support পান।
✓ And Many More Features
  আরও সহজ, দ্রুত ও সুবিধাজনক shopping experience পেতে আজই app download করুন।
                              `,
                          )
                        }
          >
            <div className="egc-rowJustify">
              <div className="egc-title">✨ App Exclusive Features</div>
              <div className="egc-arrow">›</div>
            </div>

            <div className="egc-row">
              <div className="egc-check">
                <span className="egc-green">✓</span> AI-Powered Skincare Product Suggestions
              </div>
            </div>

            <div className="egc-row">
              <div className="egc-check">
                <span className="egc-green">✓</span> Free Delivery Opportunities
              </div>
              <div className="egc-check">
                <span className="egc-green">✓</span> Live Customer Support
              </div>
            </div>
            <div className="egc-row">
              <div className="egc-check">
                <span className="egc-green">✓</span> Apply Coupons & Save More
              </div>
               <div className="egc-check">
                <span className="egc-green">✓</span> Earn Reward Points
              </div>
            </div>

            <div className="egc-check">
              <span className="egc-green">✓</span> And Many More Features{" "}
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="play-store-btn"
              >
                Download Pyzara App
              </a>
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
