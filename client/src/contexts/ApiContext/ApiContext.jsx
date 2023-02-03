import { createContext, useContext, useEffect, useState } from 'react';
import Axios from 'axios';
import { useAuth } from '../AuthContext/AuthContext';

export const ApiContext = createContext();

export const useApi = () => useContext(ApiContext);

export const ApiProvider = ({ children }) => {
    
    const auth = useAuth();

    async function uploadProfilePicture(profilePicture) {
        if(!localStorage.getItem('token')) await auth.checkToken(true);
        let res = await Axios.post('/api/upload_profile_picture', profilePicture, { headers: { 'authorization': localStorage.getItem('token'), 'accept-language': localStorage.getItem('lang'), "Content-Type": "multipart/form-data" }, validateStatus: () => true });
        
        if(res.data.err) return { err: res.data.err };

        if(res.status === 200) {
            return res.data.index;
        }
        
        return false;
    }

    async function getImage(index) {
        let res = await Axios.get('/api/get_image?index='+index, { headers: { 'authorization': localStorage.getItem('token'), 'accept-language': localStorage.getItem('lang') }, validateStatus: () => true });

        if(res.status === 200) {
            return res.data.image;
        }

        return false;
    }

    async function uploadImage(image) {
        let res = await Axios.post('/api/upload_image', image, { headers: { 'authorization': localStorage.getItem('token'), 'accept-language': localStorage.getItem('lang'), "Content-Type": "multipart/form-data" }, validateStatus: () => true });
        
        if(res.data.err) return { err: res.data.err };

        if(res.status === 200) {
            return res.data.index;
        }

        return false;
    }

    async function upload(file) {
        let res = await Axios.post('/api/upload', file, { headers: { 'authorization': localStorage.getItem('token'), 'accept-language': localStorage.getItem('lang'), "Content-Type": "multipart/form-data" }, validateStatus: () => true });

        if(res.data.err) return { err: res.data.err };

        if(res.status === 200) {
            return res.data.index;
        }

        return false;
    }

    async function download(index) {
        let res = await Axios.get('/api/download?index='+index, { headers: { 'authorization': localStorage.getItem('token'), 'accept-language': localStorage.getItem('lang') }, validateStatus: () => true });

        if(res.status === 200) {
            return res.data.file;
        }

        return false;
    }


    async function getPosts() {
        let res = await Axios.get('/api/get_posts', { headers: { 'authorization': localStorage.getItem('token'), 'accept-language': localStorage.getItem('lang') }, validateStatus: () => true });

        if(res.status === 200) {
            return res.data.posts;
        }

        return false;
    }

    async function getPost(id) {
        let res = await Axios.get('/api/get_post?id='+id, { headers: { 'authorization': localStorage.getItem('token'), 'accept-language': localStorage.getItem('lang') }, validateStatus: () => true });

        if(res.status === 200) {
            return res.data.post;
        }

        return false;
    }

    async function post(title, lead, body, channel, image) {
        let res = await Axios.post('/api/post/create', { title, lead, body, channel, image }, { headers: { 'authorization': localStorage.getItem('token'), 'accept-language': localStorage.getItem('lang') }, validateStatus: () => true });

        if(res.status === 200) {
            return res.data.post;
        }

        return res.data.err;
    }

    const value = {
        uploadProfilePicture, uploadImage,
        getImage,
        getPost, getPosts, post,
        upload, download
    };

    return (
        <ApiContext.Provider value={value}>
            {children}
        </ApiContext.Provider>
    )
}