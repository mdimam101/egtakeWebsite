import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiCheckCircle, FiChevronDown, FiMapPin, FiX } from "react-icons/fi";
import "../styles/DistrictDropdown.css";

const DISTRICTS = [
  { label: "Dhaka", value: "Dhaka", priority: true },
  { label: "Narayanganj", value: "Narayanganj", priority: true },
  ...[
    "Bagerhat", "Bandarban", "Barguna", "Barisal", "Bhola", "Bogra",
    "Brahmanbaria", "Chandpur", "Chapainawabganj", "Chittagong",
    "Chuadanga", "Comilla", "Cox's Bazar", "Dinajpur", "Faridpur", "Feni",
    "Gaibandha", "Gazipur", "Gopalganj", "Habiganj", "Jamalpur", "Jessore",
    "Jhalokati", "Jhenaidah", "Joypurhat", "Khagrachhari", "Khulna",
    "Kishoreganj", "Kurigram", "Kushtia", "Lakshmipur", "Lalmonirhat",
    "Madaripur", "Magura", "Manikganj", "Maulvibazar", "Meherpur",
    "Munshiganj", "Mymensingh", "Naogaon", "Narail", "Narsingdi", "Natore",
    "Netrokona", "Nilphamari", "Noakhali", "Pabna", "Panchagarh",
    "Patuakhali", "Pirojpur", "Rajbari", "Rajshahi", "Rangamati", "Rangpur",
    "Satkhira", "Shariatpur", "Sherpur", "Sirajganj", "Sunamganj", "Sylhet",
    "Tangail", "Thakurgaon",
  ].map((district) => ({ label: district, value: district })),
];

const DistrictDropdown = ({ selected, onSelect, disabled = false, hasError = false }) => {
  const [visible, setVisible] = useState(false);
  const selectedItemRef = useRef(null);

  useEffect(() => {
    if (!visible) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setVisible(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    window.setTimeout(() => selectedItemRef.current?.scrollIntoView({ block: "center" }), 0);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [visible]);

  return (
    <>
      <button
        type="button"
        className={`district-dropdown__trigger ${hasError ? "district-dropdown__trigger--error" : ""}`}
        onClick={() => setVisible(true)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={visible}
      >
        <span className="district-dropdown__trigger-icon" aria-hidden="true">
          <FiMapPin />
        </span>
        <span className={selected ? "district-dropdown__value" : "district-dropdown__placeholder"}>
          {selected || "Choose your delivery area"}
        </span>
        <FiChevronDown className="district-dropdown__chevron" aria-hidden="true" />
      </button>

      {visible && createPortal(
        <div className="district-dropdown__overlay" onMouseDown={() => setVisible(false)}>
          <div
            className="district-dropdown__sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="district-dialog-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="district-dropdown__handle" />
            <div className="district-dropdown__header">
              <div>
                <h3 id="district-dialog-title">Select delivery area</h3>
                <p>ঢাকা ও নারায়ণগঞ্জ উপরে রাখা হয়েছে</p>
              </div>
              <button type="button" onClick={() => setVisible(false)} aria-label="Close district list">
                <FiX aria-hidden="true" />
              </button>
            </div>

            <div className="district-dropdown__list" role="listbox" aria-label="Bangladesh districts">
              {DISTRICTS.map((district) => {
                const isSelected = selected === district.value;
                return (
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    ref={isSelected ? selectedItemRef : null}
                    className={`district-dropdown__item ${isSelected ? "district-dropdown__item--selected" : ""}`}
                    key={district.value}
                    onClick={() => {
                      onSelect(district.value);
                      setVisible(false);
                    }}
                  >
                    <span className="district-dropdown__item-icon" aria-hidden="true"><FiMapPin /></span>
                    <span>{district.label}</span>
                    {district.priority && !isSelected && <small>Popular</small>}
                    {isSelected && <FiCheckCircle className="district-dropdown__check" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
};

export default DistrictDropdown;