import React, { useEffect, useState, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";

export default function ChatScreen() {
  const { friendId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const { friendName, friendProfileImage, token } = location.state || {};

  const [messages, setMessages] = useState([]);
  const [textMessage, setTextMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showUnfriend, setShowUnfriend] = useState(false);

  const messagesEndRef = useRef(null);

  const baseURL = "http://localhost:3000";

  // Redirect if missing data
  useEffect(() => {
    if (!friendId || !token) {
      alert("Missing chat data. Redirecting to Home.");
      navigate("/home");
    }
  }, [friendId, token, navigate]);

  // Fetch messages function
  const fetchMessages = async () => {
    if (!friendId || !token) return;
    try {
      const res = await fetch(`${baseURL}/message/conversation/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMessages(data.conversation || []);
    } catch (error) {
      console.error("Fetch messages error:", error);
    }
  };

  // Fetch messages on mount and every 5 sec (polling)
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [friendId, token]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message handler
  const sendMessage = async () => {
    if (!textMessage.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${baseURL}/message/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiver_id: friendId,
          content: textMessage.trim(),
          is_media: false,
        }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      setTextMessage("");
      await fetchMessages();
    } catch (error) {
      alert("Error sending message");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Unfriend handler
  const handleUnfriend = async () => {
    if (
      window.confirm(`Are you sure you want to unfriend ${friendName || "this user"}?`)
    ) {
      try {
        const res = await fetch(`${baseURL}/friendship/unfriend`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ user2_id: friendId }),
        });
        const data = await res.json();
        alert(data.message || "Unfriended successfully");
        navigate("/home");
      } catch (error) {
        alert("Failed to unfriend");
      }
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        {friendProfileImage && (
          <img
            src={friendProfileImage}
            alt="Friend"
            style={styles.friendAvatar}
          />
        )}
        <h2 style={styles.friendName}>{friendName || "Chat"}</h2>
        <button
          style={styles.unfriendBtn}
          onClick={() => setShowUnfriend(!showUnfriend)}
        >
          ⋮
        </button>
        {showUnfriend && (
          <div style={styles.dropdown}>
            <button style={styles.dropdownItem} onClick={handleUnfriend}>
              Unfriend
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div style={styles.messagesContainer}>
        {messages.length === 0 && <p style={styles.noMessages}>No messages yet</p>}
        {messages.map((msg) => (
          <div key={msg.message_id || msg.timestamp} style={styles.messageRow}>
            {msg.profile_image && (
              <img
                src={`${baseURL}/${msg.profile_image}`}
                alt="Sender"
                style={styles.msgAvatar}
              />
            )}
            <div>
              <div style={styles.senderName}>{msg.sender_name || "Unknown"}</div>
              <div style={styles.messageBubble}>{msg.content}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={styles.inputContainer}>
        <input
          type="text"
          placeholder="Type your message..."
          value={textMessage}
          onChange={(e) => setTextMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) sendMessage();
          }}
          style={styles.input}
          disabled={loading}
        />
        <button onClick={sendMessage} style={styles.sendBtn} disabled={loading}>
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 700,
    margin: "30px auto",
    padding: 20,
    border: "1px solid #ccc",
    borderRadius: 8,
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    display: "flex",
    flexDirection: "column",
    height: "80vh",
  },
  header: {
    display: "flex",
    alignItems: "center",
    marginBottom: 10,
    position: "relative",
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: "50%",
    marginRight: 10,
    objectFit: "cover",
  },
  friendName: {
    flexGrow: 1,
    margin: 0,
    fontSize: 22,
  },
  unfriendBtn: {
    backgroundColor: "transparent",
    border: "none",
    fontSize: 24,
    cursor: "pointer",
    userSelect: "none",
  },
  dropdown: {
    position: "absolute",
    top: 40,
    right: 0,
    border: "1px solid #ccc",
    borderRadius: 4,
    backgroundColor: "#fff",
    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
    zIndex: 10,
  },
  dropdownItem: {
    padding: "8px 15px",
    cursor: "pointer",
    backgroundColor: "white",
    border: "none",
    width: "100%",
    textAlign: "left",
  },
  messagesContainer: {
    flexGrow: 1,
    overflowY: "auto",
    border: "1px solid #ddd",
    padding: 10,
    borderRadius: 6,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
  },
  noMessages: {
    color: "#666",
    fontStyle: "italic",
  },
  messageRow: {
    display: "flex",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  msgAvatar: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    marginRight: 8,
    objectFit: "cover",
  },
  senderName: {
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 3,
  },
  messageBubble: {
    backgroundColor: "#e0e0e0",
    padding: "8px 12px",
    borderRadius: 15,
    maxWidth: 400,
    wordBreak: "break-word",
  },
  inputContainer: {
    display: "flex",
    alignItems: "center",
  },
  input: {
    flexGrow: 1,
    padding: "10px 15px",
    fontSize: 16,
    borderRadius: 20,
    border: "1px solid #ccc",
    outline: "none",
  },
  sendBtn: {
    marginLeft: 10,
    backgroundColor: "#8948C2",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: 20,
    cursor: "pointer",
  },
};
