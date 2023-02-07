import * as axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { useApi } from '../../contexts/ApiContext/ApiContext';

import './Dashboard.css';
import TextInput from '../../components/form/TextInput/TextInput';

const RoleBox = ({ role }) => {

    return (
        <div className='roleBox'>
            <h1>{role.email}</h1>
            <ul className='rolePermissionsList'>
                <input type="text" placeholder='Permission' />
                <button onClick={(e) => {
                    
                }}>Add Permission</button>
                {user.status.roles.map((role) => <li key={role._id} onClick={(e) => {
                    confirm(`Are you sure you want to remove the role ${role.name} from ${user.email}?`);
                    
                }} >{role.name}</li>)}
            </ul>
        </div>
    )
}

export default RoleBox