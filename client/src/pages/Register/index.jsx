import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import useLanguage from '../../hooks/Language/useLanguage';
import styles from './Register.module.css';

const Register = () => {

  const navigate = useNavigate();
  const auth = useAuth();
  const [getLang] = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');

  const [error, setError] = useState('');

  const handleSubmit = async (e) => {

    e.preventDefault();

    // Register with auth context here

    let res = await auth.register(email, password, code);

    if(res.err) return setError(res.err);

    if(!code) return navigate('/register?code=_');

    navigate('/');
  };

  return (
    <div className={styles.registerPage}>
      <button className={styles.returnBtn} onClick={() => navigate("/")}>{"<--"}</button>
      <h1 className={styles.title}>{getLang("REGISTER")}</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        {new URLSearchParams(location.search).get('code') ?
          <>
            <h2>{getLang("CODE_WAS_SENT_TO", email)}</h2>
            <input
            placeholder={getLang("CODE")}
            type="text"
            className={styles.input}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            />
          </>
        :
          <>
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
          </>
        }

        <button className={styles.submit}>{getLang("SUBMIT")}</button>
      </form>

      <a className={styles.registerLink} onClick={() => navigate('/login')}>{getLang("SWITCH_TO_LOGIN")}</a>
    </div>
  );
}

export default Register;