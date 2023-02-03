import React, { useState } from 'react';
import './FileInput.css';

const FileInput = ({ label, name, value = "", onChange }) => {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  }

  return (
    <div className="imageInputContainer">
      <label className="imageInputLabel" htmlFor={name}>{label}</label>
      <input
        className="imageInput"
        type="file"
        name={name}
        onChange={handleChange}
      />
    </div>
  );
}

export default FileInput;