import { useEffect, useId, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { FiArrowUpRight, FiX } from "react-icons/fi";
import "../styles/CampaignModal.css";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.emamexp2.testeasupload";

export default function CampaignModal() {
  const commonInfo = useSelector((state) => state.commonState.commonInfoList);
  const campaign = (Array.isArray(commonInfo) ? commonInfo[0] : commonInfo)?.campaingInfo;
  const [delayPassed, setDelayPassed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const isOpen = delayPassed && campaign?.campaingIsOn === true && !dismissed;

  // Start on the first visit, independently of API latency and route changes.
  useEffect(() => {
    const timer = window.setTimeout(() => setDelayPassed(true), 5000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen) {
      if (dialog.open) dialog.close();
      return undefined;
    }

    const previousFocus = document.activeElement;
    dialog.showModal();
    // Contain scrolling within the dialog without changing page scroll rules.
    const preventBackgroundScroll = (event) => {
      if (!dialog.contains(event.target)) event.preventDefault();
    };
    document.addEventListener("wheel", preventBackgroundScroll, { passive: false });
    document.addEventListener("touchmove", preventBackgroundScroll, { passive: false });

    return () => {
      dialog.close();
      document.removeEventListener("wheel", preventBackgroundScroll);
      document.removeEventListener("touchmove", preventBackgroundScroll);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [isOpen]);

  const dismiss = () => setDismissed(true);

  return (
    <dialog
      ref={dialogRef}
      className="campaign-modal"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={dismiss}
      onClose={dismiss}
    >
      <div className="campaign-modal__content">
        <button
          className="campaign-modal__close"
          type="button"
          aria-label="Close campaign"
          onClick={dismiss}
        >
          <FiX aria-hidden="true" />
        </button>
        <img
          src="/PyzaraWebIcone.png"
          alt="Pyzara"
          className="campaign-modal__logo"
          width="112"
          height="112"
        />
        <h2 id={titleId}>{campaign?.headingTitle}</h2>
        <p id={descriptionId}>{campaign?.Ptitle}</p>
        <div className="campaign-modal__actions">
          <button type="button" className="campaign-modal__ok" onClick={dismiss}>OK</button>
          <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer"
            className="campaign-modal__install" onClick={dismiss}>
            <span>Install app</span>
            <FiArrowUpRight aria-hidden="true" />
          </a>
        </div>
      </div>
    </dialog>
  );
}