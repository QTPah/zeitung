import React from 'react';
import styles from './Card.module.css';

const Card = ({ title, image, description, onClick }) => {
  return (
    <div className={styles.card} onClick={onClick} >
      <img src={image} alt={title} className={styles.cardImage} />
      <h2 className={styles.cardTitle}>{title}</h2>
      <p className={styles.cardDescription}>{description}</p>
    </div>
  );
}

export default Card;