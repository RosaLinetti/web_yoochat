import React, { useState, useRef } from "react";
import EmojiPicker from "emoji-picker-react";
import "./ChatWindow.css"; // Assuming your CSS is updated for the 'recording' class

/**
 * ChatWindow Component: Handles the display and input logic for the chat interface.
 * @param {object} user - The friend's data (name, avatar, id).
 * @param {function} onSendMessage - Handler for sending text or media messages.
 * @param {function} onStartCall - Handler to initiate an Audio Call.
 * @param {function} onStartVideoCall - Handler to initiate a Video Call.
 */
function ChatWindow({ 
  user, 
  onSendMessage, 
  onStartCall, 
  onStartVideoCall 
}) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  
  // --- Voice Message State & Refs ---
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // --- HANDLERS ---

  function handleEmojiClick(emojiData) {
    setText(text + emojiData.emoji);
  }

  function handleSend() {
    if (!text.trim()) return;
    onSendMessage(text);
    setText("");
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
      // Passes the File object and sets isMedia flag to true
      onSendMessage(file, true); 
    }
  }

  // --- VOICE MESSAGE LOGIC ---

  async function startRecording() {
    try {
      // 1. Get audio stream from user's microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      // 2. Collect audio data chunks
      recorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      // 3. Process and send the audio file when recording stops
      recorder.onstop = () => {
        // Combine chunks into a single audio blob
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Convert Blob to a File object for easier handling by the Chatscreen/API
        const audioFile = new File([audioBlob], `voice_message_${Date.now()}.webm`, { type: 'audio/webm' });

        // Send the audio file using the general media handler
        onSendMessage(audioFile, true); 
        
        // Stop the microphone stream tracks
        stream.getTracks().forEach(track => track.stop()); 
      };

      recorder.start();
      setIsRecording(true);
      console.log("Recording started...");
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not start voice message. Please check microphone permissions.');
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log("Recording stopped. File is being prepared for upload.");
    }
  }

  function handleVoiceClick() {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  // --- RENDER ---
  return (
    <div className="chatWindow">
      {/* HEADER */}
      <div className="chatHeader">
        <div className="chatUser">
          <img src={user.avatar} alt={user.name} className="chatAvatar" />
          <div>
            <p className="chatName">{user.name}</p>
            <p className="chatStatus">Online</p>
          </div>
        </div>

        <div className="chatIcons">
          {/* Audio Call Button */}
          <span 
            className="icon" 
            onClick={() => onStartCall(user.id)}
            title="Start Audio Call"
          >
            📞
          </span>
          
          {/* Video Call Button */}
          <span 
            className="icon" 
            onClick={() => onStartVideoCall(user.id)}
            title="Start Video Call"
          >
            🎥
          </span>
        </div>
      </div>

      {/* CHAT BODY (Messages display area) */}
      {/* Note: In a real app, you would map over the messages prop here */}
      <div className="messages">
        <div className="msg incoming">Hello!</div>
        <div className="msg outgoing">Hi there!</div>
      </div>

      {/* INPUT SECTION */}
      <div className="chatInput">
        
        {/* Voice Message Icon - Toggles Recording */}
        <span 
          className={`icon ${isRecording ? 'recording' : ''}`}
          onClick={handleVoiceClick}
          title={isRecording ? "Stop Recording" : "Start Voice Message"}
        >
          {isRecording ? '🛑' : '🎤'}
        </span>

        {/* File Upload (Image/Video) */}
        <label className="icon fileIcon">
          🖼️
          <input type="file" onChange={handleFileUpload} hidden />
        </label>

        {/* Actual text input */}
        <input
          type="text"
          placeholder={isRecording ? "Recording Voice Message..." : "Type a message..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={isRecording} // Disable text input during recording
        />

        {/* Emoji Picker */}
        <span className="icon" onClick={() => setShowEmoji(!showEmoji)}>😊</span>

        {/* SEND Button */}
        <button className="sendBtn" onClick={handleSend} disabled={isRecording}>➤</button>
      </div>

      {showEmoji && (
        <div className="emojiPickerContainer">
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}
    </div>
  );
}

export default ChatWindow;