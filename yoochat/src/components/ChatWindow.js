import React from "react";
import "./ChatWindow.css";

function ChatWindow({ user }) {
  return (
    <div className="chatWindow">
      <div className="chatHeader">
        <div className="chatUser">
          <img src={user.avatar} alt={user.name} className="chatAvatar" />
          <div>
            <p className="chatName">{user.name}</p>
            <p className="chatStatus">Online</p>
          </div>
        </div>
        <div className="chatIcons">
          <span>📞</span>
          <span>🎥</span>
        </div>
      </div>

      <div className="messages">
        <div className="msg incoming">Hello!</div>
        <div className="msg outgoing">Hi there!</div>
      </div>

      <div className="chatInput">
        <span>🎤</span>
        <span>🖼️</span>
        <input type="text" placeholder="Type a message..." />
        <span>😊</span>
      </div>
    </div>
  );
}

export default ChatWindow; 
