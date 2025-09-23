import React, { useState, useEffect } from "react";
import "./IconMenu.css";

function IconMenu({ onSelect }) {
  const [activeIcon, setActiveIcon] = useState("profile");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => setCollapsed(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const icons = [
    { id: "home", icon: "🏠" },
    { id: "feed", icon: "📰" },  // <-- new Friends Feed icon
    { id: "notifications", icon: "🔔" },
    { id: "chat", icon: "💬" },
    { id: "profile", icon: "👤" },
  ];

  return (
    <div className={`iconMenu ${collapsed ? "collapsed" : ""}`}>
      <div className="logo">{collapsed ? "Y" : "यो"}</div>

      <div className="menuIcons">
        {icons.map((item) => (
          <span
            key={item.id}
            className={activeIcon === item.id ? "activeIcon" : ""}
            onClick={() => {
              setActiveIcon(item.id);
              onSelect?.(item.id);
            }}
          >
            {item.icon}
          </span>
        ))}
      </div>

      <div
        className={`bottomIcon ${activeIcon === "settings" ? "activeSetting" : ""}`}
        onClick={() => {
          setActiveIcon("settings");
          onSelect?.("settings");
        }}
      >
        ⚙️
      </div>
    </div>
  );
}

export default IconMenu;
