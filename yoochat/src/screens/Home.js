import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const storedToken = localStorage.getItem("token");
  const storedUsername = localStorage.getItem("username");
  const storedUserId = localStorage.getItem("userId");
  const storedProfileImage = localStorage.getItem("profileImage");

  const [activeTab, setActiveTab] = useState("Friends");
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);


  const baseURL = "http://localhost:3000";

  if (!storedToken || !storedUsername || !storedUserId) {
    navigate("/login");
  }

  const api = axios.create({
    baseURL,
    headers: { Authorization: `Bearer ${storedToken}` },
  });

  const myAvatarUri = storedProfileImage ? `${baseURL}/${storedProfileImage}` : null;

  // Fetch Friends, Pending, Sent requests
  const loadFriends = async () => {
    try {
      const res = await api.get(`/friendship/list/${encodeURIComponent(storedUsername)}`);
      const data = (res.data.friends || []).map((u) => ({
        id: u.user_id.toString(),
        username: u.username,
        profileImage: u.profile_image ? `${baseURL}/${u.profile_image}` : null,
      }));
      setFriends(data);
    } catch (err) {
      alert("Failed to load friends: " + (err.response?.data?.message || err.message));
    }
  };

  const loadPending = async () => {
    try {
      const res = await api.get("/friendship/pendingRequests");
      const data = (res.data.pending_requests || []).map((r) => ({
        id: r.sender_id.toString(),
        username: r.username,
        profileImage: r.profile_image ? `${baseURL}/${r.profile_image}` : null,
      }));
      setPendingRequests(data);
    } catch (err) {
      alert("Failed to load pending requests: " + (err.response?.data?.message || err.message));
    }
  };

  const loadSentRequests = async () => {
  try {
    const res = await api.get("/friendship/sentRequests");
    const outgoing = (res.data.sent_requests || []).map((r) => ({
      id: r.receiver_id.toString(),
      username: r.username,
      profileImage: r.profile_image ? `${baseURL}/${r.profile_image}` : null,
    }));
    setSentRequests(outgoing);  
  } catch (err) {
    console.error("Error loading sent requests:", err.message);
  }
};


  const loadBlockedUsers = async () => {
  try {
    const res = await api.get("/users/blocked");
    const blocked = (res.data.blocked_users || []).map((u) => ({
      id: u.user_id.toString(),
      username: u.username,
      profileImage: u.profile_image ? `${baseURL}/${u.profile_image}` : null,
    }));
    setBlockedUsers(blocked);
  } catch (err) {
    console.error("Failed to load blocked users:", err.message);
  }
};


  useEffect(() => {
    loadFriends();
    loadPending();
    loadSentRequests();
      loadBlockedUsers();

  }, []);

 
const handleSearch = async (text) => {
  setSearchText(text);
  const trimmedText = text.trim();
  if (!trimmedText) {
    setSearchResults([]);
    return;
  }

  try {
    const res = await api.get(`/users/search?search=${encodeURIComponent(trimmedText)}`);
    setSearchResults(res.data.users);
  } catch (err) {
    setSearchResults([]);
  }
};



  const handleSendRequest = async (receiverId) => {
    if (receiverId === storedUserId) {
      alert("You cannot add yourself.");
      return;
    }
    try {
      await api.post("/friendship/sendRequest", { receiver_id: receiverId });
      alert("Friend request sent");
      setSentRequests((prev) => [...prev, receiverId.toString()]);
      loadPending();
    } catch (err) {
      alert("Failed to send friend request: " + (err.response?.data?.message || err.message));
    }
  };

  const handleCancelRequest = async (receiverId) => {
    try {
      await api.post("/friendship/cancelRequest", { receiver_id: receiverId });
      alert("Friend request canceled");
      setSentRequests((prev) => prev.filter((id) => id !== receiverId.toString()));
      loadPending();
    } catch (err) {
      alert("Failed to cancel friend request: " + (err.response?.data?.message || err.message));
    }
  };

  const handleAcceptRequest = async (senderId) => {
    try {
      await api.post("/friendship/acceptRequest", { sender_id: senderId });
      alert("Friend request accepted");
      loadFriends();
      loadPending();
    } catch (err) {
      alert("Failed to accept friend request: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeclineRequest = async (senderId) => {
    try {
      await api.post("/friendship/declineRequest", { sender_id: senderId });
      alert("Friend request declined");
      loadPending();
    } catch (err) {
      alert("Failed to decline request: " + (err.response?.data?.message || err.message));
    }
  };


const handleUnblockUser = async (userId) => {
  try {
    await api.post("/users/unblock", { blocked_id: userId });
    alert("User unblocked");
    loadBlockedUsers(); 
  } catch (err) {
    alert("Failed to unblock user: " + (err.response?.data?.message || err.message));
  }
};


  const renderItem = (item) => {
    const isSelf = item.id === storedUserId;
    const alreadySent = sentRequests.includes(item.id.toString());

    const actionBtn =
  activeTab === "Requests" ? (
    <>
      <button onClick={() => handleAcceptRequest(item.id)}>Accept</button>
      <button onClick={() => handleDeclineRequest(item.id)}>Decline</button>
    </>
  ) : activeTab === "Search" ? (
    isSelf ? (
      <span>It's You!</span>
    ) : alreadySent ? (
      <button onClick={() => handleCancelRequest(item.id)}>Cancel Request</button>
    ) : (
      <button onClick={() => handleSendRequest(item.id)}>Add Friend</button>
    )
  ) : activeTab === "Sent" ? (
    <button onClick={() => handleCancelRequest(item.id)}>Cancel Request</button>
  ) : activeTab === "Blocked" ? (
    <button onClick={() => handleUnblockUser(item.id)}>Unblock</button>
  ) : null;


    return (
      <div key={item.id} style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
        {item.profileImage && (
          <img
            src={item.profileImage}
            alt=""
            style={{ width: 40, height: 40, borderRadius: "50%", marginRight: 10 }}
          />
        )}
        <span style={{ flex: 1 }}>{item.username}</span>
        {actionBtn}
      </div>
    );
  };

  const currentList =
  activeTab === "Friends"
    ? friends
    : activeTab === "Requests"
    ? pendingRequests
    : activeTab === "Sent"
    ? sentRequests
    : activeTab === "Blocked"
    ? blockedUsers
    : searchResults;


  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {myAvatarUri && (
            <img src={myAvatarUri} alt="Avatar" style={{ width: 40, height: 40, borderRadius: "50%" }} />
          )}
          <h2>Welcome, {storedUsername}!</h2>
        </div>
        <button
          onClick={() => {
            localStorage.clear();
            navigate("/login");
          }}
        >
          Logout
        </button>
      </div>

      <div style={{ display: "flex", gap: 20, marginBottom: 10 }}>
  {["Friends", "Requests", "Sent", "Blocked", "Search"].map((tab) => (
    <button 
      key={tab} 
      style={{ fontWeight: activeTab === tab ? "bold" : "normal" }} 
      onClick={() => setActiveTab(tab)}
    >
      {tab}
    </button>
  ))}
</div>


      {activeTab === "Search" && (
        <input
          type="text"
          value={searchText}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by username..."
          style={{ padding: "8px", width: "100%", marginBottom: "20px" }}
        />
      )}

      <div style={{ marginTop: 20 }}>
        {currentList.length > 0 ? currentList.map(renderItem) : <p>No {activeTab} found.</p>}
      </div>
    </div>
  );
}
