import React, { useContext, useState, useEffect } from "react"
import Axios from "axios"

const AuthContext = React.createContext();

export function useAuth() {
    return useContext(AuthContext)
}

export const AuthProvider = ({ children }) => {

    Axios.defaults.withCredentials = false

    const [user, setUser] = useState();

    const updateTokens = async () => {
        if(!await checkToken()) {
            await refreshToken();
        }
    }

    useEffect(() => {
        updateTokens();
    }, []);

    async function checkToken() {
        if(!localStorage.getItem('token')) return false;
        let res = await Axios.post('/auth/token', {}, { headers: { 'authorization': localStorage.getItem('token'), 'accept-language': localStorage.getItem('lang') }, validateStatus: () => true });

        if(res.status === 200 && res.data.user) {
            setUser(res.data.user);
            return true;
        } else {
            setUser();
            return false;
        }
    }

    async function refreshToken() {
        if(!localStorage.getItem('refresh_token')) return false;
        let res = await Axios.post('/auth/refresh_token', { refreshToken: localStorage.getItem('refresh_token') } , { headers: { 'authorization': localStorage.getItem('token'), 'accept-language': localStorage.getItem('lang') }, validateStatus: () => true });

        if(res.status === 200 && res.data.token) {
            localStorage.setItem('token', 'Bearer ' + res.data.token);
            await checkToken();
            return true;
        } else {
            return false;
        }
    }



    async function login(email, password) {
        let res = await Axios.post('/auth/login', { email, password }, { headers: { 'accept-language': localStorage.getItem('lang') }, validateStatus: () => true });

        if(res.status == 200) {
            localStorage.setItem('token', 'Bearer ' + res.data.accessToken);
            localStorage.setItem('refreshToken', res.data.refreshToken);

            await checkToken();

            return res.data.res;
        }

        return { err: res.data.err };
    }

    async function register(email, password, code) {
        let res = await Axios.post('/auth/register', { email, password, code }, { headers: { 'accept-language': localStorage.getItem('lang') }, withCredentials: false, validateStatus: () => true });

        if(res.status == 200) {

            if(code) await login(email, password);

            return res.data.res;
        }

        return { err: res.data.err };
    }

    const value = {
        user,
        checkToken, refreshToken,
        login, register
    }

    return (
        <AuthContext.Provider value={value}>
        {children}
        </AuthContext.Provider>
    )
}