import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function SignUp() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setProfileImage(file);
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
    } else {
      setPreviewImage(null);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!username || !email || !password || !confirmPassword) {
      alert("Please fill all fields");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const formData = new FormData();
    formData.append("username", username);
    formData.append("email", email);
    formData.append("password", password);
    if (profileImage) {
      formData.append("profileImage", profileImage);
    }

    try {
      const response = await axios.post("http://localhost:3000/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(response.data.message || "Sign Up successful!");
      navigate("/login");
    } catch (error) {
      alert(error.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div style={styles.background}>
      <div style={styles.wrapper}>
        {/* Branding like login */}
        <div style={styles.brandRow}>
          <h1 style={{ ...styles.brandPurple, margin: 0 }}>यो</h1>
          <h1 style={{ ...styles.brandBlack, margin: 0 }}>Chat</h1>
        </div>

        <h2 style={styles.heading}>Create Your Account</h2>

        <form onSubmit={handleSignUp} style={styles.form}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={styles.input}
          />

          {/* Custom file input */}
          <div style={{ marginBottom: 16 }}>
            <input
              type="file"
              id="profileImage"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: "none" }}
            />
            <label
              htmlFor="profileImage"
              style={{
                display: "inline-block",
                width: "100%",
                textAlign: "center",
                backgroundColor: "#8948C2",
                color: "#fff",
                padding: "10px 0",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Choose Profile Image
            </label>
          </div>

          {previewImage && (
            <img
              src={previewImage}
              alt="Profile preview"
              style={styles.previewImage}
            />
          )}

          <button type="submit" style={styles.primaryBtn}>
            Sign Up
          </button>
        </form>

        <p style={styles.footerTxt}>
          Already have an account?{" "}
          <span
            style={styles.linkTxt}
            onClick={() => navigate("/login")}
            role="button"
            tabIndex={0}
          >
            Login
          </span>
        </p>
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
    position: "relative",
  },
  wrapper: {
    position: "relative",
    zIndex: 2,
    maxWidth: 400,
    width: "100%",
    padding: 20, // same as login
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
    marginBottom: 40, // same as login
  },
  brandPurple: { fontSize: 40, fontWeight: "900", color: "#8948C2" },
  brandBlack: { fontSize: 40, fontWeight: "900", color: "#000" },
  heading: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
    color: "#4b5563",
  },
  form: {
    display: "flex",
    flexDirection: "column",
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
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: "50%",
    objectFit: "cover",
    marginBottom: 16,
    alignSelf: "center",
    border: "2px solid #8948C2",
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
