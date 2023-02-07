import * as axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { useApi } from '../../contexts/ApiContext/ApiContext';

import './Dashboard.css';

const UserBox = ({ user, roles }) => {

    return (
        <div className='userBox'>
            <h1>{user.email}</h1>
            <ul className='userRoleList'>
                <select className='roleSelect'>
                    {roles && roles.map((role) => <option key={role._id} value={role._id}>{role.name}</option>)}
                </select>
                <button onClick={(e) => {
                    
                }}>Add Role</button>
                {user.status.roles.map((role) => <li key={role._id} onClick={(e) => {
                    confirm(`Are you sure you want to remove the role ${role.name} from ${user.email}?`);
                    
                }} >{role.name}</li>)}
            </ul>
        </div>
    )
}

export default UserBox