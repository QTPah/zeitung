import React, { useState } from 'react';
import './Popup.css';

const Popup = ({ onClose, title, children }) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  return (
    <div className={`popup ${isOpen ? "show" : "hide"}`}>
      <div className="popupContent shade1">
        <div className="popupHeader shade1">
          <h2 className="popupTitle">{title}</h2>
          <button className="closeBtn" onClick={handleClose}>
            X
          </button>
        </div>
        <div className="popupBody">
          <div className="popupScroller">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Popup;