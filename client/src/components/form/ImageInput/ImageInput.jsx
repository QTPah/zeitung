import React, { useState } from 'react';
import './ImageInput.css';

const ImageInput = ({ label, name, value = "", onChange }) => {
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
        accept="image/*"
        onChange={handleChange}
      />
    </div>
  );
}

export default ImageInput;
