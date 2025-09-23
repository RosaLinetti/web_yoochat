import React from "react";
import "./SettingsPanel.css";

function SettingsPanel({ onSelectSetting }) {
  return (
    <div className="settingsPanel">
      <h2 className="settingsTitle">Settings ⚙️</h2>
      <ul className="settingsList">
        <li>
          <button onClick={() => onSelectSetting("EditProfile")}>
            Edit Profile
          </button>
        </li>
        <li>
          <button onClick={() => onSelectSetting("ContributeFeed")}>
            Contribute to Feed
          </button>
        </li>
        <li>
          <button onClick={() => onSelectSetting("BlockedUsers")}>
            Blocked Users
          </button>
        </li>
        <li>
          <button onClick={() => onSelectSetting("ArchivedChats")}>
            Archived Chats
          </button>
        </li>
        <li>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("username");
              onSelectSetting("Logout");
            }}
          >
            Logout
          </button>
        </li>
      </ul>
    </div>
  );
}

export default SettingsPanel;
