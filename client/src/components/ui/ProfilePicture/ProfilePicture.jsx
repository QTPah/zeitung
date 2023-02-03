import React, { useState } from 'react';
import './ProfilePicture.css';

const ProfilePicture = ({ image, size }) => {

  return (
    <div className="profilePictureContainer" style={{ height: size }}>
        <div className="profilePicture" style={{ backgroundImage: `url(${image})`, width: size }} />
    </div>
  );
}

export default ProfilePicture;