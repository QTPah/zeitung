import React from 'react';
import { useAuth } from '../../../contexts/AuthContext/AuthContext';
import useLanguage from '../../../hooks/Language/useLanguage';
import styles from './Navbar.module.css';
import NavbarItem from './NavbarItem';

const Navbar = () => {

  const auth = useAuth();
  const [getLang] = useLanguage();

  return (
    <nav className={styles.navbar}>
      <h1 className={styles.logo}>Zeitung</h1>
      <ul className={styles.navbarLinks}>
        <NavbarItem value={getLang("NAVBAR_HOME")} href="/" />
        <NavbarItem value={getLang("NAVBAR_HELP")} href="/help" />
       {!auth.user && <NavbarItem value={getLang("LOGIN")} href="/login" />}
      </ul>
    </nav>
  );
}

export default Navbar;
