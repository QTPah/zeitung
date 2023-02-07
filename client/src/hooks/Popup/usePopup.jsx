import React, { useState } from 'react';
import Popup from '../../components/ui/Popup/Popup';

const usePopup = () => {

    const [currentPopup, setCurrentPopup] = useState();

    const popup = (title, contents) => {
        setCurrentPopup(<Popup title={title} onClose={() => {
            setCurrentPopup();
        }}>{contents}</Popup>);
    }

    const closePopup = () => {
        setCurrentPopup();
    }

    return [popup, currentPopup, closePopup];
}

export default usePopup;