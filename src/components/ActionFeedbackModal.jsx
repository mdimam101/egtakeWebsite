import { useEffect, useRef } from "react";
import { Link } from "react-router";
import "../styles/ActionFeedbackModal.css";

const ActionFeedbackModal = ({
  isOpen,
  title,
  message,
  tone = "success",
  onClose,
  showCartLink = false,
  confirmLabel = "OK",
}) => {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="action-feedback-modal__overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
      role="presentation"
    >
      <section
        className={`action-feedback-modal action-feedback-modal--${tone}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-feedback-modal-title"
        aria-describedby="action-feedback-modal-message"
      >
        <button
          ref={closeButtonRef}
          type="button"
          className="action-feedback-modal__close"
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>

        <div className="action-feedback-modal__icon" aria-hidden="true">
          {tone === "success" ? "✓" : "!"}
        </div>
        <h2 id="action-feedback-modal-title">{title}</h2>
        <p id="action-feedback-modal-message">{message}</p>

        <div className="action-feedback-modal__actions">
          <button type="button" onClick={onClose}>
            {confirmLabel}
          </button>
          {showCartLink && (
            <Link to="/cart" onClick={onClose}>
              Cart Page
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default ActionFeedbackModal;
