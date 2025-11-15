// src/components/MyPostsFeed.js
import React, { useEffect, useState } from "react";
import { getMyPosts } from "../api/api";
import "./FriendsFeed.css"; // Reuse FriendsFeed CSS

const API_URL = "http://localhost:3000";

function MyPostsFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState({});

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      try {
        const res = await getMyPosts();
        console.log("Fetched posts:", res.posts);

        if (res.posts) {
          const formattedPosts = res.posts.map((post) => ({
            ...post,
            // Fix image URLs
            images: (post.images || []).map((img) =>
              img.startsWith("http") ? img : `${API_URL}/${img.replace(/\\/g, "/")}`
            ),
            profile_image: post.profile_image
              ? post.profile_image.startsWith("http")
                ? post.profile_image
                : post.profile_image.startsWith("uploads/")
                  ? `${API_URL}/${post.profile_image.replace(/\\/g, "/")}`
                  : `${API_URL}/uploads/${post.profile_image.replace(/\\/g, "/")}`
              : `${API_URL}/avatar2.png`,
            reactionsCount: post.reactions ? post.reactions.length : 0,
          }));

          setPosts(formattedPosts);

          // Initialize liked state
          const initialLikes = {};
          formattedPosts.forEach((p) => {
            initialLikes[p.post_id] = p.userLiked || false;
          });
          setLikedPosts(initialLikes);
        }
      } catch (err) {
        console.error("Error fetching posts:", err);
      }
      setLoading(false);
    }

    fetchPosts();
  }, []);

  const toggleLike = async (postId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/feed/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ post_id: postId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong!");

      // Update liked state
      setLikedPosts((prev) => ({ ...prev, [postId]: data.liked }));

      // Update reactions count
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.post_id === postId ? { ...p, reactionsCount: data.totalLikes } : p
        )
      );
    } catch (err) {
      console.error("Error liking post:", err);
      alert("Something went wrong!");
    }
  };

  if (loading) return <p style={{ textAlign: "center" }}>Loading your posts...</p>;
  if (!posts.length) return <p style={{ textAlign: "center" }}>No posts yet.</p>;

  return (
    <div className="friendsFeed" style={{ gridTemplateColumns: "1fr", justifyItems: "center" }}>
      {posts.map((post) => (
        <div key={post.post_id} className="postCard" style={{ maxWidth: "600px" }}>
          {/* Header */}
          <div className="postHeader">
            <div className="postHeaderLeft">
              <img
                src={post.profile_image}
                alt={post.username}
                className="postAvatar"
                onError={(e) => (e.target.src = `${API_URL}/avatar2.png`)}
              />
              <span className="postUsername">{post.username}</span>
            </div>
            <span className="postTime">{new Date(post.created_at).toLocaleString()}</span>
          </div>

          {/* Caption */}
          {post.caption && <p className="postCaption">{post.caption}</p>}

          {/* Images */}
          {post.images?.length > 0 && (
            <div className="postImages">
              {post.images.length === 1 ? (
                <img src={post.images[0]} alt="Post" className="singleImage" />
              ) : (
                <div className="imageCarousel">
                  {post.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`post-${post.post_id}-${idx}`}
                      className="carouselImage"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Like button */}
          <div className="postActions">
            <button
              className={likedPosts[post.post_id] ? "reacted" : "like-btn"}
              onClick={() => toggleLike(post.post_id)}
            >
              💜
            </button>
            <span className="like-count">{post.reactionsCount}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default MyPostsFeed;
