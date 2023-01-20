import React from 'react';
import styles from './Navbar.module.css';
import { useNavigate } from 'react-router-dom';

const NavbarItem = ({ href, value }) => {

    const navigate = useNavigate();

  return (
        <li className={styles.navbarLink}>
            <a onClick={() => navigate(href)}>{value}</a>
        </li>
  );
}

export default NavbarItem;