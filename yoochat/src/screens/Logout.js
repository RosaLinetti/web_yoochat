import React from "react";
import { useNavigate } from "react-router-dom";

export default function Logout() {
  const navigate = useNavigate();

  const handleBackToLogin = () => {
    navigate("/login", { replace: true });
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.text}>You are logged out</h2>
        <p style={styles.message}>Come back soon! 😊</p>
        <button style={styles.button} onClick={handleBackToLogin}>
          Back to Login
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#8948C2",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    backgroundColor: "#fff",
    padding: 40,
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
    width: 320,
  },
  text: {
    fontSize: 24,
    marginBottom: 10,
    color: "#333",
    fontWeight: "bold",
  },
  message: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#8948C2",
    color: "#fff",
    padding: "12px 24px",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 16,
    fontWeight: "bold",
    width: "100%",
  },
};
