import { useEffect, useRef, useState } from "react";
import { FiX } from "react-icons/fi";
import { PiHandTap } from "react-icons/pi";
import "../styles/GuidedCoachmark.css";

const AUTO_DISMISS_MS = 9000;

const GuidedCoachmark = ({
  enabled,
  message,
  bottom = 86,
  right = 12,
  width = 270,
  targetRight = 0,
  delay = 450,
}) => {
  const [visible, setVisible] = useState(false);
  const shownThisMount = useRef(false);

  useEffect(() => {
    if (!enabled || shownThisMount.current) return undefined;

    const showTimer = window.setTimeout(() => {
      shownThisMount.current = true;
      setVisible(true);
    }, delay);

    return () => window.clearTimeout(showTimer);
  }, [delay, enabled]);

  useEffect(() => {
    if (!visible) return undefined;
    const hideTimer = window.setTimeout(
      () => setVisible(false),
      AUTO_DISMISS_MS,
    );
    return () => window.clearTimeout(hideTimer);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="guided-coachmark"
      style={{ bottom, right, width: `min(${width}px, calc(100vw - 24px))` }}
      role="status"
      aria-live="polite"
    >
      <div className="guided-coachmark__bubble">
        <span className="guided-coachmark__icon" aria-hidden="true">
          <PiHandTap />
        </span>
        <span className="guided-coachmark__copy">
          <span className="guided-coachmark__eyebrow">সহজ ধাপ</span>
          <span className="guided-coachmark__message">{message}</span>
        </span>
        <button
          type="button"
          className="guided-coachmark__close"
          aria-label="সহায়তা বার্তা বন্ধ করুন"
          onClick={() => setVisible(false)}
        >
          <FiX aria-hidden="true" />
        </button>
      </div>
      <span
        className="guided-coachmark__pointer"
        style={{ right: Math.max(24, targetRight + 44) }}
        aria-hidden="true"
      />
    </div>
  );
};

export default GuidedCoachmark;