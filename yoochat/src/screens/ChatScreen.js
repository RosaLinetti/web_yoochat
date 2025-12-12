import React, { useEffect, useState, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import ChatWindow from "../components/ChatWindow";
import { io } from "socket.io-client"; 

// Initialize Socket.IO connection
const socket = io("http://localhost:3000", {
    auth: { token: localStorage.getItem('token') || '' }
});

export default function ChatScreen() {
    const { friendId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const currentUserId = localStorage.getItem('userId');
    
    // Destructure necessary data from route state
    const { friendName, friendProfileImage, token } = location.state || {};

    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    // const [showUnfriend, setShowUnfriend] = useState(false); // Removed if not used

    const baseURL = "http://localhost:3000";

    // Redirect if missing data
    useEffect(() => {
        if (!friendId || !token) {
            alert("Missing chat data. Redirecting to Home.");
            navigate("/home");
        }
    }, [friendId, token, navigate]);

    // --- 1. FETCH MESSAGES (Polling) ---
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

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [friendId, token]);


    // --- 2. UNIFIED SEND MESSAGE HANDLER ---
    // Handles text, media, and now, voice messages (which are treated as media)
    const handleSendRequest = async (content, isMedia = false) => {
        if (!content) return;
        setLoading(true);

        const isTextOnly = typeof content === 'string' && !isMedia;
        const endpoint = isTextOnly ? `${baseURL}/message/send/text` : `${baseURL}/message/send/media`;

        let body;
        let headers = { Authorization: `Bearer ${token}` };

        if (!isTextOnly) {
            // MEDIA UPLOAD: Uses FormData for file transfer (for images, video, and voice messages)
            body = new FormData();
            body.append("receiver_id", friendId);
            body.append("mediaFile", content); // Key must match multer field in routes.js
        } else {
            // TEXT MESSAGE: Uses JSON
            headers["Content-Type"] = "application/json";
            body = JSON.stringify({
                receiver_id: friendId,
                content: content,
                is_media: false,
            });
        }

        try {
            const res = await fetch(endpoint, {
                method: "POST",
                // Headers are only explicitly set for JSON; FormData manages its own Content-Type
                headers: isTextOnly ? headers : { Authorization: `Bearer ${token}` },
                body: body,
            });

            if (!res.ok) throw new Error("Failed to send message");

            await fetchMessages(); // Refresh messages
        } catch (error) {
            alert("Error sending message");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // --- 3. NEW: CALL INITIATION LOGIC (Signaling) ---
    const handleStartCall = (receiverId) => {
        const callType = 'audio';
        
        // Confirmation Dialog
        if (!window.confirm(`Are you sure you want to start an ${callType} call with ${friendName}?`)) {
            return; // Stop execution if the user cancels
        }

        // Send a signal to the backend via Socket.IO
        socket.emit('call:initiate', {
            callerId: currentUserId,
            receiverId: receiverId,
            callType: callType
        });

        // Confirmation that the frontend action was successful
        alert(`Requesting ${callType} call with ${friendName}. Check console/network for Socket.IO event 'call:initiate'.`);
        console.log(`[Socket.IO] Emitting 'call:initiate' for ${callType} call to user ID: ${receiverId}`);
    };

    const handleStartVideoCall = (receiverId) => {
        const callType = 'video';
        
        // Confirmation Dialog
        if (!window.confirm(`Are you sure you want to start a ${callType} call with ${friendName}?`)) {
            return; // Stop execution if the user cancels
        }

        // Send a signal to the backend via Socket.IO
        socket.emit('call:initiate', {
            callerId: currentUserId,
            receiverId: receiverId,
            callType: callType
        });

        // Confirmation that the frontend action was successful
        alert(`Requesting ${callType} call with ${friendName}. Check console/network for Socket.IO event 'call:initiate'.`);
        console.log(`[Socket.IO] Emitting 'call:initiate' for ${callType} call to user ID: ${receiverId}`);
    };

    // --- 4. UNFRIEND HANDLER (Kept for completeness) ---
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

    // --- 5. RENDER CHATWINDOW (Pass NEW props) ---
    const chatUser = {
        name: friendName || "Chat",
        avatar: friendProfileImage || "default-avatar.png",
        id: friendId
    };

    return (
        <div style={{ height: "100vh", display: "flex", justifyContent: "center" }}>
            <ChatWindow
                user={chatUser}
                messages={messages}
                onSendMessage={handleSendRequest}
                handleUnfriend={handleUnfriend}
                loading={loading}
                onStartCall={handleStartCall}
                onStartVideoCall={handleStartVideoCall}
            />
        </div>
    );
}