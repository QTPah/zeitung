import React, { useState } from 'react';
import ButtonInput from '../../../components/form/ButtonInput/ButtonInput';
import DropdownInput from '../../../components/form/DropdownInput/DropdownInput';
import TextInput from '../../../components/form/TextInput/TextInput';
import useLanguage from '../../../hooks/Language/useLanguage';
import Setting from './Setting';

const GeneralSettings = () => {

  const [getLang] = useLanguage();

  return (
    <>
      <Setting title={getLang("LANGUAGE")}>
        <DropdownInput options={[{label: 'Deutsch', value: 'de'}, {label: 'English', value: 'en'}]} name="language" value={localStorage.getItem('lang')} onChange={(e) => {
          localStorage.setItem('lang', e.target.value);
          window.location.reload();
        }} />
      </Setting>
      <Setting title={getLang("THEME")}>
        <DropdownInput options={[{label: 'Light', value: 'light'}, {label: 'Dark', value: 'dark'}]} name="theme" value={localStorage.getItem('theme') || 'light'} onChange={(e) => {
          localStorage.setItem('theme', e.target.value);
          window.location.reload();
        }} />
      </Setting>
    </>
  );
}

export default GeneralSettings;