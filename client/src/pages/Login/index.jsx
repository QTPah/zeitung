import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import useLanguage from '../../hooks/Language/useLanguage';
import styles from './Login.module.css';

const Login = () => {

  const navigate = useNavigate();
  const auth = useAuth();
  const [getLang] = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Log in with auth context here

    let res = await auth.login(email, password);

    if(res.err) return setError(res.err);

    navigate('/');

    };

  return (
    <div className={styles.loginPage}>
      <button className={styles.returnBtn} onClick={() => navigate("/")}>{"<--"}</button>
      <h1 className={styles.title}>{getLang("LOGIN")}</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
        placeholder={getLang("EMAIL")}
        type="email"
        className={styles.input}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        />
        <input
        placeholder={getLang("PASSWORD")}
        type="password"
        className={styles.input}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        />
        {error &&
            <div className={styles.error}>
                {error}
            </div>
        }
        <button className={styles.submit}>{getLang("SUBMIT")}</button>
      </form>
      <a className={styles.registerLink} onClick={() => navigate('/register')}>{getLang("SWITCH_TO_REGISTER")}</a>
    </div>
  );
}

export default Login;