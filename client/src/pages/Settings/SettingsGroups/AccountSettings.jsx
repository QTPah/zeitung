import React, { useState } from 'react';
import ButtonInput from '../../../components/form/ButtonInput/ButtonInput';
import ProfilePicture from '../../../components/ui/ProfilePicture/ProfilePicture';
import { useApi } from '../../../contexts/ApiContext/ApiContext';
import { useAuth } from '../../../contexts/AuthContext/AuthContext';
import { fromLocation } from '../../../utils/serverImage';
import useLanguage from '../../../hooks/Language/useLanguage';
import Setting from './Setting';

import FormData from 'form-data'
import { useEffect } from 'react';
import ImageInput from '../../../components/form/ImageInput/ImageInput';

const AccountSettings = () => {

  const [getLang] = useLanguage();
  const auth = useAuth();
  const api = useApi();


  const [profilePicture, setProfilePicture] = useState();

  useEffect(() => {
    api.getImage(auth.user.profilePictureIndex).then(image => setProfilePicture(image));
  }, []);

  return (
    <>
      <Setting title={getLang("PROFILE_PICTURE")}>
        <div style={{width: '50%', margin: 'auto'}}>
          {profilePicture && <ProfilePicture image={profilePicture} size="10rem" />}
          <input type="file" accept="image/*" onChange={async (e) => {
            api.getImage(await api.uploadProfilePicture(fromLocation(e.target.files[0], 'profilePicture'))).then(image => setProfilePicture(image));
          }} />
        </div>
      </Setting>
      <Setting>
        <ButtonInput label={getLang("LOGOUT")} onClick={() => auth.logout()} />
      </Setting>
    </>
  );
}

export default AccountSettings;