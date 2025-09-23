// src/components/FriendsFeed.js
import React, { useEffect, useState, useRef } from "react";
import { getFriendsPosts } from "../api/api";
import "./FriendsFeed.css";

const API_URL = "http://localhost:3000";

function FriendsFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const carouselRefs = useRef({});
  const [activeIndex, setActiveIndex] = useState({}); // track active image per post
  const [likedPosts, setLikedPosts] = useState({}); // track liked state per post

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      try {
        const res = await getFriendsPosts();
        if (res.posts) {
          const normalizedPosts = res.posts.map((post) => ({
            ...post,
            images: (post.images || []).map(
              (img) => (img.startsWith("http") ? img : `${API_URL}/${img.replace(/\\/g, "/")}`)
            ),
            profile_image: post.profile_image
              ? post.profile_image.startsWith("http")
                ? post.profile_image
                : `${API_URL}/${post.profile_image.replace(/\\/g, "/")}`
              : `${API_URL}/avatar2.png`,
          }));

          const uniquePosts = Array.from(
            new Map(normalizedPosts.map((p) => [p.post_id, p])).values()
          );
          setPosts(uniquePosts);

          // Initialize liked state as false
          const initialLikes = {};
          uniquePosts.forEach(p => {
            initialLikes[p.post_id] = false;
          });
          setLikedPosts(initialLikes);
        }
      } catch (err) {
        console.error("Error fetching friends posts:", err);
      }
      setLoading(false);
    }
    fetchPosts();
  }, []);

  const handleScroll = (postId) => {
    const carousel = carouselRefs.current[postId];
    if (!carousel) return;
    const index = Math.round(carousel.scrollLeft / carousel.offsetWidth);
    setActiveIndex((prev) => ({ ...prev, [postId]: index }));
  };

  const toggleLike = (postId) => {
    setLikedPosts(prev => {
      const newState = { ...prev, [postId]: !prev[postId] };
      return newState;
    });

    // Optionally update reactions count locally
    setPosts(prevPosts =>
      prevPosts.map(p => {
        if (p.post_id === postId) {
          const delta = likedPosts[postId] ? -1 : 1;
          const newReactions = p.reactions ? p.reactions.length + delta : 1;
          return { ...p, reactions: Array(newReactions).fill({}) };
        }
        return p;
      })
    );
  };

  if (loading) return <p style={{ textAlign: "center" }}>Loading feed...</p>;
  if (!posts.length) return <p style={{ textAlign: "center" }}>No posts to show.</p>;

  return (
    <div className="friendsFeed">
      {posts.map((post) => (
        <div key={post.post_id} className="postCard">
          {/* Post header */}
          <div className="postHeader">
            <div className="postHeaderLeft">
              <img src={post.profile_image} alt={post.username} className="postAvatar" />
              <span className="postUsername">{post.username}</span>
            </div>
            <span className="postTime">{new Date(post.created_at).toLocaleString()}</span>
          </div>

          {/* Post caption */}
          {post.caption && <p className="postCaption">{post.caption}</p>}

          {/* Swipeable images */}
          {post.images && post.images.length > 0 && (
            <div className="postImages">
              {post.images.length === 1 ? (
                <img
                  src={post.images[0]}
                  alt={`post-${post.post_id}-0`}
                  className="postImage singleImage"
                />
              ) : (
                <div
                  className="imageCarousel"
                  ref={(el) => (carouselRefs.current[post.post_id] = el)}
                  onScroll={() => handleScroll(post.post_id)}
                >
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

              {/* Carousel indicators */}
              {post.images.length > 1 && (
                <div className="carouselIndicator">
                  {post.images.map((_, idx) => (
                    <span
                      key={idx}
                      className={`dot ${activeIndex[post.post_id] === idx ? "active" : ""}`}
                    ></span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="postActions">
            <button
              className={likedPosts[post.post_id] ? "reacted" : ""}
              onClick={() => toggleLike(post.post_id)}
            >
              {likedPosts[post.post_id] ? "❤️ Liked" : "🤍 Like"}
            </button>
            <button>💬 Comment</button>
          </div>

          {/* Reactions count */}
          {post.reactions && post.reactions.length > 0 && (
            <p className="postReactions">{post.reactions.length} reactions</p>
          )}
        </div>
      ))}
    </div>
  );
}

export default FriendsFeed;
