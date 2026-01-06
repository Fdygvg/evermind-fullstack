import React from 'react';
import ThemeSettings from '../components/Common/ThemeSettings';
import { useAuth } from '../hooks/useAuth';

const SettingsPage = () => {
  const { logout } = useAuth();

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1 className="settings-title">Settings</h1>
        <ThemeSettings />

        <div className="settings-section account-section">
          <h2 className="section-title">Account</h2>
          <button className="logout-btn" onClick={logout}>
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

