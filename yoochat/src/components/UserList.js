import React from "react";
import FriendActions from "./FriendActions";

const UserList = ({ users, type, token, onActionComplete, sentRequests, friends, receivedRequests }) => {
  if (!users || users.length === 0) {
    return (
      <p style={{ fontStyle: "italic", color: "#555" }}>
        {type === "add"
          ? "Start typing at least 2 letters to find new friends 😎"
          : "No users found."}
      </p>
    );
  }

  // Filter out users who are already friends or in pending
  let filteredUsers = users;
  if (type === "add") {
    const pendingIds = [
      ...(sentRequests?.map(u => u.receiver_id) || []),
      ...(receivedRequests?.map(u => u.sender_id) || [])
    ];
    const friendIds = friends?.map(u => u.user_id) || [];

    filteredUsers = users.filter(
      u => !pendingIds.includes(u.user_id) && !friendIds.includes(u.user_id)
    );
  }

  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {filteredUsers.map((user) => {
        const imageSrc = user.profile_image
          ? `http://localhost:3000/${user.profile_image.replace(/\\/g, "/")}`
          : "/default-avatar.png";

        return (
          <li
            key={user.user_id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: "1px solid #eee",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <img
                src={imageSrc}
                alt={user.username}
                width={50}
                height={50}
                style={{ borderRadius: "50%", marginRight: "12px" }}
              />
              <span style={{ fontWeight: "500" }}>{user.username}</span>
            </div>

            <FriendActions
              user={user}
              type={type}
              token={token}
              sentRequests={sentRequests} 
              onActionComplete={onActionComplete}
            />
          </li>
        );
      })}
    </ul>
  );
};

export default UserList;
