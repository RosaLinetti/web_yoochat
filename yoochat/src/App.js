import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./screens/Login";
import SignUp from "./screens/SignUp";
import Home from "./screens/Home";
import ChatScreen from "./screens/ChatScreen";
import Logout from "./screens/Logout";
import mainScreen from "./screens/mainScreen";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/home" element={<Home />} />
        <Route path="/chat/:friendId" element={<ChatScreen />} />
        <Route path="/logout" element={<Logout />} />
      </Routes>
    </Router>
  );
}
