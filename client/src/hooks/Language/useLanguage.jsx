import React, { useEffect, useState } from 'react';
import texts from '../../data/tranlations/main.json';

const useLanguage = () => {

    const get = (index, ...args) => {
        let language = localStorage.getItem('lang');

        if(!texts[0].includes(language)) language = 'de';

        let text = texts.find(t => t.index == index);
        if(text) {
            let trans = text.translations[texts[0].indexOf(language)];

            if(args.length == 0) return trans;


            for(let i = 0; i < args.length; i++) trans.replace('{}', args[i]);
            
            return trans;
        }
    }

    return [get]
}

export default useLanguage;