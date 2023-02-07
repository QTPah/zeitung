import * as axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { useApi } from '../../contexts/ApiContext/ApiContext';

import './Dashboard.css';
import TextInput from '../../components/form/TextInput/TextInput';

const RoleBox = ({ role, setRoles }) => {

    const api = useApi();

    const [permissionToAdd, setPermissionToAdd] = useState();

    console.log(role)

    return (
        <div className='roleBox'>
            <h1>{role.email}</h1>
            <ul className='rolePermissionsList'>
                <input type="text" placeholder='Permission' onChange={(e) => setPermissionToAdd(e.target.value)} />
                <button onClick={async (e) => {
                    role.permissions.push(permissionToAdd);
                    setRoles(await api.updateRole(role._id, role.name, role.permissions));
                }}>Add Permission</button>
                <ul>
                    {role.permissions.map((permission) => <li key={permission} onClick={async (e) => {
                        confirm(`Are you sure you want to remove the permission ${permission} from ${role.name}?`);
                        role.permissions.splice(role.permissions.indexOf(permission), 1);
                        setRoles(await api.updateRole(role._id, role.name, role.permissions));
                    }} >{permission}</li>)}
                </ul>
            </ul>
        </div>
    )
}

export default RoleBox