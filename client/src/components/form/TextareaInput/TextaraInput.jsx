import React, { useState } from 'react';
import './TextareaInput.css';


const TextareaInput = ({ label, name, placeholder = "", value = "", onChange }) => {
  const [inputValue, setInputValue] = useState(value);

  const handleChange = (e) => {
    setInputValue(e.target.value);
    if (onChange) {
      onChange(e);
    }
  }

  return (
    <div className="textareaInputContainer">
      <label className="textareaInputLabel" htmlFor={name}>{label}</label>
      <textarea
        className="textareaInput"
        name={name}
        placeholder={placeholder}
        value={inputValue}
        onChange={handleChange}
      />
    </div>
  );
}

export default TextareaInput;