import TextInput from "../../components/form/TextInput/TextInput"
import { useState } from "react"
import ButtonInput from "../../components/form/ButtonInput/ButtonInput";
import { useApi } from "../../contexts/ApiContext/ApiContext";
import usePopup from "../../hooks/Popup/usePopup";

const RoleCreator = ({ setRoles }) => {

    const api = useApi();

    const [roleName, setRoleName] = useState();
    const [rolePermissions, setRolePermissions] = useState([]);
    const [permisson, setPermission] = useState();

    const [popup, currentPopup, closePupup] = usePopup();

    return (
        <div className='roleCreator'>
            <TextInput placeholder='Role Name' onChange={(e) => setRoleName(e.target.value)} />
            <br />
            <TextInput placeholder="Permission" onChange={(e) => setPermission(e.target.value)} />
            <ButtonInput label='Add Permission' onClick={(e) => setRolePermissions([...rolePermissions, permisson])} />
            <h2 style={{marginBottom: '2px'}}>Permissions</h2>
            <ul style={{marginTop: '2px'}} className="roleList">
                {rolePermissions && rolePermissions.map((permission) => <li>{permission}</li>)}
            </ul>
            <ButtonInput label='Create Role' onClick={async () => {
                const res = await api.createRole(roleName, rolePermissions);
                setRoles(res);
                closePupup();
            }} />
        </div>
    )
}

export default RoleCreator