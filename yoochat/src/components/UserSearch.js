// src/components/UserSearch.js
import React, { useState, useEffect } from "react";
import { searchUsers } from "../api/api";

const UserSearch = ({ token }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {  // only search if 2+ letters
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        const users = await searchUsers(query, token);
        setResults(users || []);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 300); // debounce

    return () => clearTimeout(timeoutId);
  }, [query, token]);

  return (
    <div>
      <input
        type="text"
        placeholder="Type 2 or more letters to search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          padding: "10px",
          width: "100%",
          marginBottom: "15px",
          borderRadius: "8px",
          border: "1px solid #ccc",
        }}
      />

      {query.trim().length < 2 ? (
        <p style={{ fontStyle: "italic", color: "#555" }}>
          Start typing at least 2 letters to search for friends 😎
        </p>
      ) : loading ? (
        <p style={{ color: "#9333ea", fontWeight: "bold" }}>Searching...</p>
      ) : results.length === 0 ? (
        <p style={{ color: "#f87171", fontWeight: "bold" }}>
          No users found. Try another name! 🤔
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {results.map((user) => (
            <li
              key={user.user_id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <img
                src={user.profile_image || "/default-avatar.png"}
                alt={user.username}
                width={40}
                height={40}
                style={{ marginRight: "10px", borderRadius: "50%" }}
              />
              <span style={{ fontWeight: "500" }}>{user.username}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserSearch;
