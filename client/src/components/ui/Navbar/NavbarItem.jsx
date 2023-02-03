import React from 'react';
import { useNavigate } from 'react-router-dom';

import './Navbar.css';

const NavbarItem = ({ href, value }) => {

    const navigate = useNavigate();

  return (
        <li className="navbarLink">
            <a onClick={() => navigate(href)}>{value}</a>
        </li>
  );
}

export default NavbarItem;