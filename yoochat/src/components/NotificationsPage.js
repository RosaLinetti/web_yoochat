import React, { useEffect, useState } from "react";
import { getNotifications } from "../api/api";
import "./NotificationsPage.css";

const API_URL = "http://localhost:3000";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const data = await getNotifications();

        // Format profile images
        const formatted = data.map((n) => ({
          ...n,
          sender_profile_image: n.sender_profile_image
            ? n.sender_profile_image.startsWith("http")
              ? n.sender_profile_image
              : `${API_URL}/${n.sender_profile_image.replace(/\\/g, "/")}`
            : `${API_URL}/avatar2.png`,
        }));

        setNotifications(formatted);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
      setLoading(false);
    };

    fetchNotifications();
  }, []);

  if (loading)
    return <p className="loadingText">Loading notifications...</p>;
  if (!notifications.length)
    return <p className="noNotifications">No notifications yet.</p>;

  return (
    <div className="notificationsWrapper">
      <h2 className="notificationsHeader">Notifications</h2>
      <ul className="notificationsList">
        {notifications.map((n) => (
          <li key={n.notification_id} className={`notificationCard ${n.is_read ? "read" : "unread"}`}>
            <img
              src={n.sender_profile_image}
              alt={n.sender_username || "User"}
              className="notificationAvatar"
            />
            <div className="notificationContent">
              <p className="notificationMessage">
                {n.sender_username
                  ? `${n.sender_username} ${
                      n.type === "friend_accept"
                        ? "accepted your friend request"
                        : n.type === "friend_request"
                        ? "sent you a friend request"
                        : n.type === "friend_decline"
                        ? "declined your friend request"
                        : n.type === "like"
                        ? "reacted 💜 to your post"
                        : ""
                    }`
                  : n.message}
              </p>
              <span className="notificationTime">
                {new Date(n.created_at).toLocaleString()}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotificationsPage;
