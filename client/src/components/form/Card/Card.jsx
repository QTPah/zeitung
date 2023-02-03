import React from 'react';

import './Card.css';

const Card = ({ title, image, description, onClick }) => {

  return (
    <div className="card shade1" onClick={onClick} >
      <img src={image} alt={title} className="cardImage" />
      <h2 className="cardTitle">{title}</h2>
      <p className="cardDescription">{description}</p>
    </div>
  );
}

export default Card;