import * as axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { useApi } from '../../contexts/ApiContext/ApiContext';
import usePopup from '../../hooks/Popup/usePopup';


import './Dashboard.css';
import UserBox from './UserBox';
import RoleCreator from './RoleCreator';
import ButtonInput from '../../components/form/ButtonInput/ButtonInput';

const Dashboard = () => {

    const api = useApi();
    const auth = useAuth();


    const [posts, setPosts] = useState([]);
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);

    const [selectedUser, setSelectedUser] = useState();
    const [selectedRole, setSelectedRole] = useState();


    const [roleName , setRoleName] = useState();
    const [rolePermissions , setRolePermissions] = useState();

    const [popup, currentPopup] = usePopup();

    useEffect(() => {
        api.getPosts().then(res => {
            setPosts(res);
        });
        api.getUsers().then(res => {
            setUsers(res);
        });
        api.getRoles().then(res => {
            console.log(res);
            setRoles(res);
        });
    }, []);

    // Make user select list on left side of screen and user info and editor on right side of screen

    return (
        <>
            {currentPopup && currentPopup}
            <h1>Dashboard</h1>

            <div className='userContainer'>
                <ul className='userList'>
                    {users && users.map((user, index) => <li key={user._id} onClick={(e) => {
                        setSelectedUser(user);
                    }}>{user.email}</li>)}
                </ul>
                {selectedUser && <div className='userBoxContainer'><UserBox user={selectedUser} /></div>}
            </div>
            <div className='roleContainer'>
                <div className='roleListContainer'>
                    <h1>Roles</h1>
                    <ButtonInput onClick={(e) => {
                            popup("Create Role", <RoleCreator setRoles={setRoles} />);
                    }} label="Create Role" />
                    <ul className='roleList'>
                        {roles && roles.map((role, index) => <li style={{fontSize:'30px'}} key={role._id} onClick={(e) => {
                            setSelectedRole(role);
                        }}>{role.name}</li>)}
                    </ul>
                </div>
                <div>
                    {selectedRole && selectedRole.name}
                </div>
            </div>
        </>
    )
}

export default Dashboard