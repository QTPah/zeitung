import * as axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { useApi } from '../../contexts/ApiContext/ApiContext';

import './Dashboard.css';

const Dashboard = () => {

    const api = useApi();
    const auth = useAuth();

    const [posts, setPosts] = useState([]);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        api.getPosts().then(res => {
            setPosts(res);
        });
        api.getUsers().then(res => {
            setUsers(res);
        });
    }, []);

    // Make user select list on left side of screen and user info and editor on right side of screen

    return (
        <>
            <h1>Dashboard</h1>

            <div className='userListContainer'>
                <ul className='userList'>
                    {users && users.map((user, index) => <li>{user.email}</li>)}
                </ul>
            </div>
        </>
    )
}

export default Dashboard