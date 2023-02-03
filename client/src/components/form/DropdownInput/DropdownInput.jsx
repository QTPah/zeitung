import React, { useState } from 'react';

import './DropdownInput.css';


const DropdownInput = ({ label, name, options, value = "", onChange }) => {
  const [selectedValue, setSelectedValue] = useState(value);

  
  const handleChange = (e) => {
    setSelectedValue(e.target.value);
    if (onChange) {
      onChange(e);
    }
  }

  return (
    <div className="dropdownContainer">
      <label className="dropdownLabel" htmlFor={name}>{label}</label>
      <select
        className="dropdown"
        name={name}
        value={selectedValue}
        onChange={handleChange}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default DropdownInput;