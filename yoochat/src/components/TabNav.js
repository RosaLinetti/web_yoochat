import React from "react";
import "./TabNav.css";

function TabNav({ activeTab, setActiveTab }) {
  const tabs = ["Friends", "Add Friend", "Pending"];
  return (
    <div className="tabNav">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={activeTab === tab ? "tab active" : "tab"}
          onClick={() => setActiveTab(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

export default TabNav;
