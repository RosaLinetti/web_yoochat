// src/screens/Home.js
import React, { useState, useEffect } from "react";
import IconMenu from "../components/IconMenu";
import TabNav from "../components/TabNav";
import UserList from "../components/UserList";
import ChatWindow from "../components/ChatWindow";
import SettingsPanel from "../components/SettingsPanel";
import EditProfile from "../components/EditProfile";
import ContributeFeed from "../components/ContributeFeed";
import FriendsFeed from "../components/FriendsFeed"; 
import NotificationsPage from "../components/NotificationsPage";
import MyPostsFeed from "../components/MyPostsFeed"; 



import "./Home.css";

import {
  getFriends,
  getPendingRequests,
  getSentRequests,
  searchUsers,
} from "../api/api";

function Home() {
  const [activeSidebar, setActiveSidebar] = useState("feed"); // Which icon is clicked
  const [activeTab, setActiveTab] = useState("Friends");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [selectedSetting, setSelectedSetting] = useState(null);

  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username"); // logged-in username

  // Load friends + pending when tab changes (only when profile is active)
  useEffect(() => {
    if (activeSidebar !== "profile") return;

    async function loadData() {
      try {
        if (activeTab === "Friends") {
          if (!username) return;
          const res = await getFriends(username);
          setFriends(res.friends || []);
        } else if (activeTab === "Pending") {
          const received = await getPendingRequests();
          const sent = await getSentRequests();
          setReceivedRequests(received.pending_requests || []);
          setSentRequests(sent.sent_requests || []);
        }
      } catch (err) {
        console.error("Error loading data:", err);
      }
    }
    loadData();
  }, [activeTab, activeSidebar, username]);

  // Live search for Add Friend tab
  useEffect(() => {
    if (activeSidebar !== "profile" || activeTab !== "Add Friend") return;

    async function doSearch() {
      if (search.trim().length < 1) {
        setUsers([]);
        return;
      }
      try {
        const res = await searchUsers(search, token);
        setUsers(res.users || []);
      } catch (err) {
        console.error("Search error:", err);
      }
    }

    const delay = setTimeout(doSearch, 300);
    return () => clearTimeout(delay);
  }, [search, activeTab, activeSidebar, token]);

  // Handle friend actions
  const handleActionComplete = async (user, actionType) => {
    if (actionType === "sent") {
      setUsers((prev) => prev.filter((u) => u.user_id !== user.user_id));
      setSentRequests((prev) => [...prev, user]);
    } else if (actionType === "cancelled") {
      setSentRequests((prev) =>
        prev.filter((u) => u.user_id !== user.user_id)
      );
    } else if (actionType === "accepted") {
      setReceivedRequests((prev) =>
        prev.filter((u) => u.user_id !== user.user_id)
      );
      try {
        if (username) {
          const res = await getFriends(username);
          setFriends(res.friends || []);
        }
      } catch (err) {
        console.error("Error refreshing friends:", err);
      }
    } else if (actionType === "declined") {
      setReceivedRequests((prev) =>
        prev.filter((u) => u.user_id !== user.user_id)
      );
    }
  };

  // Utility: safe sorting with search match first
  const sortBySearchMatch = (arr) => {
    if (!search) return arr;
    const lowerSearch = search.toLowerCase();
    return [...arr].sort((a, b) => {
      const aName = (a.username || "").toLowerCase();
      const bName = (b.username || "").toLowerCase();
      const aIndex = aName.indexOf(lowerSearch);
      const bIndex = bName.indexOf(lowerSearch);
      const aScore = aIndex === -1 ? Infinity : aIndex;
      const bScore = bIndex === -1 ? Infinity : bIndex;
      return aScore - bScore;
    });
  };

  // Filtered and sorted lists
  const filteredFriends =
    activeSidebar === "profile" && activeTab === "Friends"
      ? sortBySearchMatch(
          friends.filter((u) =>
            (u.username || "").toLowerCase().includes(search.toLowerCase())
          )
        )
      : [];

  const filteredUsers =
    activeSidebar === "profile" && activeTab === "Add Friend"
      ? users.filter(
          (u) =>
            !friends.some((f) => f.user_id === u.user_id) &&
            !sentRequests.some((s) => s.user_id === u.user_id) &&
            !receivedRequests.some((r) => r.user_id === u.user_id)
        )
      : [];

  const filteredPending =
    activeSidebar === "profile" && activeTab === "Pending"
      ? sortBySearchMatch(
          [...receivedRequests, ...sentRequests].filter((u) =>
            (u.username || "").toLowerCase().includes(search.toLowerCase())
          )
        )
      : [];

  return (
    <div className="homeContainer">
      <div className="sidebar">
        <IconMenu onSelect={setActiveSidebar} />
      </div>

      {/* If feed is selected, show only feed panel */}
      {activeSidebar === "feed" ? (
        <div className="feedPanel">
          <FriendsFeed token={token} />
        </div>
        ) : activeSidebar === "home" ? (
  <div className="middlePanel">
    <MyPostsFeed />
  </div>
      ) : (
        <>
          <div className="middlePanel">
            {activeSidebar === "profile" ? (
              <>
                <TabNav activeTab={activeTab} setActiveTab={setActiveTab} />

                <input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="searchInput"
                />

                {activeTab === "Friends" && (
                  <UserList
                    users={filteredFriends}
                    type="friends"
                    token={token}
                    onActionComplete={handleActionComplete}
                  />
                )}

                {activeTab === "Add Friend" && (
                  <UserList
                    users={filteredUsers}
                    type="add"
                    token={token}
                    friends={friends}
                    sentRequests={sentRequests}
                    receivedRequests={receivedRequests}
                    onActionComplete={handleActionComplete}
                  />
                )}

                {activeTab === "Pending" && (
                  <>
                    <div className="pendingCounts">
                      <span>Sent: {sentRequests.length}</span> |{" "}
                      <span>Received: {receivedRequests.length}</span>
                    </div>
                    <UserList
                      users={filteredPending}
                      type="pending"
                      token={token}
                      onActionComplete={handleActionComplete}
                    />
                  </>
                )}
              </>
              ) : activeSidebar === "notifications" ? (
              <NotificationsPage />
            ) : activeSidebar === "settings" ? (
              <SettingsPanel onSelectSetting={setSelectedSetting} />
            ) : (
              <div
                style={{
                  textAlign: "center",
                  marginTop: "50px",
                  color: "#666",
                }}
              >
                <h2>{activeSidebar.toUpperCase()}</h2>
                <p>Content will appear here later.</p>
              </div>
            )}
          </div>

          <div className="chatPanel">
            {activeSidebar === "settings" ? (
              <div className="settingsContent">
                {selectedSetting === "EditProfile" && (
                  <EditProfile token={token} />
                )}
                {selectedSetting === "ContributeFeed" && (
                  <ContributeFeed token={token} />
                )}
                {selectedSetting === "BlockedUsers" && (
                  <p>Blocked users list here.</p>
                )}
                {selectedSetting === "ArchivedChats" && (
                  <p>Archived chats here.</p>
                )}
                {selectedSetting === "Logout" && <p>You have been logged out.</p>}
                {!selectedSetting && (
                  <p style={{ color: "#888" }}>
                    Select an option from settings 😎.
                  </p>
                )}
              </div>
            ) : (
              <ChatWindow
                user={{ name: "Ralph Edwards", avatar: "/avatar2.png" }}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Home;
