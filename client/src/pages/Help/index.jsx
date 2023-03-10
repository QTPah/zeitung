import React, { useState } from 'react'
import Navbar from '../../components/ui/Navbar/Navbar'

import Card from '../../components/form/Card/Card'

import questioningFace from '../../assets/questioning-face.png'

import styles from './Help.module.css';
import usePopup from '../../hooks/Popup/usePopup';


import RegisterIssue from './Issues/RegisterIssue';
import useLanguage from '../../hooks/Language/useLanguage';
import { useEffect } from 'react';


const Help = () => {

    const [popup, popupElement] = usePopup();
    const [getLang] = useLanguage();

    useEffect(() => {
        if(new URLSearchParams(location.search).get('goofy')) {
            console.log('eeee');
            localStorage.setItem('theme', 'goofy');
        }
    }, []);

    return (
        <>
            <Navbar />
            {popupElement}
            <div className={styles.gridCardContainer}>
            <Card title={getLang("ISSUE_REGISTRATION_TITLE")} image={questioningFace} description={getLang("ISSUE_REGISTRATION_DESCRIPTION")} onClick={() => popup(getLang("ISSUE_REGISTRATION_TITLE"), <RegisterIssue />)} />
            </div>
        </>
    )
}

export default Help