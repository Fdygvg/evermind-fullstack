import React from 'react';
import ThemeSettings from '../components/Common/ThemeSettings';

const SettingsPage = () => {
  return (

    <div className="settings-page">
      <div className="settings-container">
        <h1 className="settings-title">Settings</h1>
        <ThemeSettings />
      </div>
    </div>

  );
};

export default SettingsPage;

