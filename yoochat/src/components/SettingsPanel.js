import React from "react";
import { useNavigate } from "react-router-dom"; // <-- import navigate
import "./SettingsPanel.css";

function SettingsPanel({ onSelectSetting }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Remove login info
    localStorage.removeItem("token");
    localStorage.removeItem("username");

  
    navigate("/login"); 
  };

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
          <button onClick={handleLogout}>Logout</button>
        </li>
      </ul>
    </div>
  );
}

export default SettingsPanel;
