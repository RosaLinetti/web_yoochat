import React, { useState, useEffect } from "react";
import { getMyProfile } from "../api/api";
import "./ContributeFeed.css";

const API_URL = "http://localhost:3000";

function ContributeFeed() {
  const [posts, setPosts] = useState([]);
  const [caption, setCaption] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ username: "", profile_image: "/avatar2.png" });

  // Fetch profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await getMyProfile();
        setProfile({
          username: data.username,
          profile_image: data.profileImage
            ? `${API_URL}/${data.profileImage.replace(/\\/g, "/")}`
            : "/avatar2.png",
        });
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    }
    fetchProfile();
  }, []);

  // Fetch posts
  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/feed/myPosts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const formattedPosts = (data.posts || []).map((p) => ({
        ...p,
        images: p.images.map((img) => `${API_URL}/${img.replace(/\\/g, "/")}`),
      }));
      setPosts(formattedPosts);
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleFiles = (e) => setImages([...e.target.files]);

  const handleAddPost = async () => {
    if (!images.length) return alert("Please select images!");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("caption", caption);
      images.forEach((img) => formData.append("images", img));

      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/feed/createPost`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      alert(data.message || "Post created successfully!");

      setCaption("");
      setImages([]);

      // Refresh posts
      fetchPosts();
    } catch (err) {
      console.error("Add post error:", err);
      alert("Error adding post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contributeFeed">
      <div className="profileHeader">
        <img src={profile.profile_image} alt="Profile" className="profilePic" />
        <h3>{profile.username}</h3>
      </div>

      <div className="addPostForm">
        <textarea
          placeholder="Write a caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
        <input type="file" multiple onChange={handleFiles} />
        <button onClick={handleAddPost} disabled={loading}>
          {loading ? "Posting..." : "Add Post"}
        </button>
        {images.length > 0 && (
          <div className="previewImages">
            {images.map((img, idx) => (
              <img
                key={idx}
                src={URL.createObjectURL(img)}
                alt={`Preview ${idx}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="postGrid">
        {posts.length === 0 && <p className="noPosts">You haven't posted anything yet.</p>}
        {posts.map((p) =>
          p.images.map((img, idx) => (
            <div key={`${p.post_id}-${idx}`} className="postItem">
              <img src={img} alt="Post" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ContributeFeed;
