import React, { useState } from 'react';
import './TextInput.css';


const TextInput = ({ label, name, placeholder = "", value = "", onChange }) => {
  const [inputValue, setInputValue] = useState(value);

  const handleChange = (e) => {
    setInputValue(e.target.value);
    if (onChange) {
      onChange(e);
    }
  }

  return (
    <div className="textInputContainer">
      <label className="textInputLabel" htmlFor={name}>{label}</label>
      <input
        className="textInput"
        type="text"
        name={name}
        placeholder={placeholder}
        value={inputValue}
        onChange={handleChange}
      />
    </div>
  );
}

export default TextInput;
