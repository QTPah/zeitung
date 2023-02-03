import React from 'react';

import '../Settings.css'


const Setting = ({ title, children }) => {

  return (
    <div className="groupContainer">
      <div className="groupContent shade1">
        <h2 className="groupTitle">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export default Setting;