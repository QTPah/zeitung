import React, { useEffect } from 'react';

import './ButtonInput.css';

const ButtonInput = ({ label, type = "button", onClick, disabled = false }) => {

    return (
        <button
        className="button"
        type={type}
        onClick={onClick}
        disabled={disabled}
        >
        {label}
        </button>
    );
}

export default ButtonInput;
