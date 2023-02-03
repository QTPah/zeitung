import React, { useContext, useState, useEffect } from "react"
import Axios from "axios"

const AuthContext = React.createContext();

export function useAuth() {
    return useContext(AuthContext)
}

export const AuthProvider = ({ children }) => {

    Axios.defaults.withCredentials = false

    const [user, setUser] = useState();

    useEffect(() => {
        checkToken();
    }, []);

    async function checkToken(autoRefresh = true) {
        if(!localStorage.getItem('token')) return false;
        let res = await Axios.post('/auth/token', {}, { headers: { 'authorization': localStorage.getItem('token'), 'accept-language': localStorage.getItem('lang') }, validateStatus: () => true });

        if(res.status === 200) {
            setUser(res.data.user);
            return true;
        } else if(autoRefresh) {
            if(!await refreshToken()) {
                setUser();
                return false;
            }

            return await checkToken(false);
        }

        return false;
    }

    async function refreshToken() {
        let res = await Axios.post('/auth/refresh_token', { refreshToken: localStorage.getItem('refreshToken') } , { headers: { 'authorization': localStorage.getItem('token'), 'accept-language': localStorage.getItem('lang') }, validateStatus: () => true });

        if(res.status === 200) {
            localStorage.setItem('token', 'Bearer ' + res.data.token);
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

    async function logout() {
        await Axios.delete('/auth/logout', { headers: { 'authorization': localStorage.getItem('token'), 'accept-language': localStorage.getItem('lang') }, validateStatus: () => true });

        localStorage.setItem('token', '');
        localStorage.setItem('refreshToken', '');

        return true;
    }

    function hasPermission(permission) {
        if(!user) return false;

        let hasPermission = false;

        user.status.roles.forEach(role => {
            if(role.permissions.includes(permission)) {
                hasPermission = true;
            }
        });

        return hasPermission;
    }

    const value = {
        user,
        checkToken, refreshToken,
        login, register, logout,
        hasPermission
    }

    return (
        <AuthContext.Provider value={value}>
        {children}
        </AuthContext.Provider>
    )
}