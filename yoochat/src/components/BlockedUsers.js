import React, { useEffect, useState } from "react";
import axios from "axios";
import "./BlockedUsers.css";

function BlockedUsers({ token }) {
  const [blocked, setBlocked] = useState([]);

  useEffect(() => {
    const fetchBlocked = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/users/blocked", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBlocked(res.data);
      } catch (err) {
        console.error("Error fetching blocked users:", err);
      }
    };
    fetchBlocked();
  }, [token]);

  const handleUnblock = async (blocked_id) => {
    try {
      await axios.post(
        "http://localhost:3000/api/users/unblock",
        { blocked_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBlocked(blocked.filter((u) => u.user_id !== blocked_id));
    } catch (err) {
      console.error("Error unblocking user:", err);
    }
  };

  return (
    <div className="blocked-users">
      <h2>Blocked Users</h2>
      {blocked.length === 0 ? (
        <p>No blocked users</p>
      ) : (
        <ul>
          {blocked.map((user) => (
            <li key={user.user_id}>
              <img src={user.profile_image || "/default-avatar.png"} alt={user.username} />
              <span>{user.username}</span>
              <button onClick={() => handleUnblock(user.user_id)}>Unblock</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default BlockedUsers;
