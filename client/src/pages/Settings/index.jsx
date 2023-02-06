import React, { useState } from 'react';
import Navbar from '../../components/ui/Navbar/Navbar';
import GeneralSettings from './SettingsGroups/GeneralSettings';
import AccountSettings from './SettingsGroups/AccountSettings';
import useLanguage from '../../hooks/Language/useLanguage';

import './Settings.css';

const Settings = () => {
  const [getLang] = useLanguage();

  const activeGroup = new URLSearchParams(location.search).get("setting") || getLang("GENERAL");

  const settingsGroups = [
    [getLang("GENERAL"), <GeneralSettings />],
    [getLang("ACCOUNT"), <AccountSettings />]
  ];

  return (
    <>
        <Navbar />
        <div className="settingsContainer">
        <div className="settingsSidebar shade1">
            <h2 className="sidebarTitle">Settings</h2>
            <div className="sidebarGroupList">

                {settingsGroups.map(g => {
                    return <div key={g[0]} className={`sidebarGroup ${activeGroup === g[0] && "active"}`} onClick={() => {
                      location.href = `?setting=${g[0]}`;
                    }}>{g[0]}</div>
                })}
            </div>
            </div>
            <div className="settingsMain">
                {settingsGroups.find(g => activeGroup === g[0])[1] }
            </div>
        </div>
    </>
  );
}

export default Settings;
