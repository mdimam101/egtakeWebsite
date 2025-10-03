import React from 'react';
import '../styles/SuccessModalStyle.css';  // styling আলাদা রাখবো

const SuccessModal = ({ isOpen, onClose }) => {

  if (!isOpen) return null;


  return (
    <div className="success-modal-overlay">
      <div className="success-modal-container">
        <div className="success-icon">
          <span>✔</span>
        </div>
        <h2>Thank You!</h2>
        <p>Your orders has been successfully submitted. Thanks!</p>
        <button className="ok-btn" onClick={onClose}>OK</button>
      </div>
    </div>
  );
}

export default SuccessModal;
