import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please fill in email and password");
      return;
    }

    try {
      const response = await axios.post("http://localhost:3000/login", {
        email,
        password,
      });

      const data = response.data;

      if (data.token) {
        // ✅ Save token and user info in localStorage for Home.js
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);
        localStorage.setItem("userId", data.userId.toString());
        localStorage.setItem("profileImage", data.profileImage || "");

        alert("Login successful!");
        navigate("/home");
      } else {
        alert("Token missing in response. Please try again.");
      }
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    }
  };

  return (
    <div style={styles.background}>
      <div style={styles.overlay}>
        <div style={styles.wrapper}>
          <div style={styles.brandRow}>
            <h1 style={{ ...styles.brandPurple, margin: 0 }}>यो</h1>
            <h1 style={{ ...styles.brandBlack, margin: 0 }}>Chat</h1>
          </div>

          <h2 style={styles.heading}>Login To Your Account</h2>

          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />

          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <button style={styles.primaryBtn} onClick={handleLogin}>
            Login
          </button>

          <p style={styles.footerTxt}>
            Don’t have an account?{" "}
            <span
              style={styles.linkTxt}
              onClick={() => navigate("/signup")}
              role="button"
              tabIndex={0}
            >
              Sign up
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  background: {
    backgroundImage: "url('/purple.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  wrapper: {
    maxWidth: 400,
    width: "100%",
    padding: 20,
    borderRadius: 12,
    backgroundColor: "white",
    textAlign: "center",
    fontFamily: "Arial, sans-serif",
    boxShadow: "0 10px 20px rgba(0,0,0,0.25), 0 6px 6px rgba(0,0,0,0.2)",
  },
  brandRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "baseline",
    marginBottom: 40,
  },
  brandPurple: { fontSize: 40, fontWeight: "900", color: "#8948C2" },
  brandBlack: { fontSize: 40, fontWeight: "900", color: "#000" },
  heading: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
    color: "#4b5563",
  },
  input: {
    width: "100%",
    height: 40,
    marginBottom: 16,
    padding: "0 10px",
    fontSize: 15,
    borderRadius: 6,
    border: "1px solid #e5e7eb",
    boxSizing: "border-box",
  },
  primaryBtn: {
    width: "100%",
    height: 40,
    backgroundColor: "#8948C2",
    color: "#fff",
    fontWeight: "600",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  footerTxt: {
    marginTop: 20,
    fontSize: 14,
    color: "#6b7280",
  },
  linkTxt: {
    color: "#8948C2",
    fontWeight: "600",
    cursor: "pointer",
  },
};
