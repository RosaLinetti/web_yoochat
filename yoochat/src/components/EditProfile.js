// src/components/EditProfile.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./EditProfile.css";


const EditProfile = ({ token }) => {
  const [username, setUsername] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [currentProfile, setCurrentProfile] = useState({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Load current profile
    axios
      .get("http://localhost:3000/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setCurrentProfile(res.data))
      .catch((err) => console.error(err));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    if (username) formData.append("username", username);
    if (profileImage) formData.append("profileImage", profileImage);

    try {
      const res = await axios.put(
        "http://localhost:3000/users/update",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessage(res.data.message);
      setCurrentProfile(res.data.user);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Error updating profile");
    }
  };

  return (
    <div className="editProfileForm">
      <h3>Edit Profile</h3>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username:</label>
          <input
            type="text"
            placeholder={currentProfile.username}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div>
          <label>Profile Image:</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setProfileImage(e.target.files[0])}
          />
        </div>

        {currentProfile.profileImage && (
          <img
            src={`http://localhost:3000/${currentProfile.profileImage}`}
            alt="Profile"
            width={100}
          />
        )}

        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
};

export default EditProfile;
