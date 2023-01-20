import React, { useState } from 'react';
import styles from './Popup.module.css';

const Popup = ({ onClose, title, children }) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  return (
    <div className={`${styles.popup} ${isOpen ? styles.show : styles.hide}`}>
      <div className={styles.popupContent}>
        <div className={styles.popupHeader}>
          <h2 className={styles.popupTitle}>{title}</h2>
          <button className={styles.closeBtn} onClick={handleClose}>
            X
          </button>
        </div>
        <div className={styles.popupBody}>
          <div className={styles.popupScroller}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Popup;