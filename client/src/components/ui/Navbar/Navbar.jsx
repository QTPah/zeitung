import React from 'react';
import { useAuth } from '../../../contexts/AuthContext/AuthContext';
import useLanguage from '../../../hooks/Language/useLanguage';
import NavbarItem from './NavbarItem';

import './Navbar.css'

const Navbar = () => {

  const auth = useAuth();
  const [getLang] = useLanguage();

  return (
    <nav className="navbar">
      <h1 className="logo">Zeitung</h1>
      <ul className="navbarLinks">
        <NavbarItem value={getLang("NAVBAR_HOME")} href="/" />
        <NavbarItem value={getLang("NAVBAR_HELP")} href="/help" />
        {(auth.user && auth.hasPermission("VIEW_POSTS")) && <NavbarItem value={getLang("POSTS")} href="/posts" />}
        {auth.user && <NavbarItem value={getLang("SETTINGS")} href="/settings" />}
       {!auth.user && <NavbarItem value={getLang("LOGIN")} href="/login" />}
      </ul>
    </nav>
  );
}

export default Navbar;
