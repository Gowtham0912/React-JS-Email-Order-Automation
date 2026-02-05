import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Orders from "./components/Orders";
import Analytics from "./components/Analytics";
import Contact from "./components/Contact";
import About from "./components/About";

function App() {
  const [user, setUser] = useState(localStorage.getItem("email_user") || null);

  const setLoginUser = (email) => {
    localStorage.setItem("email_user", email);
    setUser(email);
  };

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/logout"); // Clear session on backend too
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem("email_user");
    setUser(null);
  };

  // Optional: Check session validity on load?
  // For now, trust localStorage + backend 401s (handled in components)

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={!user ? <Login setLoginUser={setLoginUser} /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/login"
          element={!user ? <Login setLoginUser={setLoginUser} /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/dashboard"
          element={user ? <Dashboard user={user} handleLogout={handleLogout} /> : <Navigate to="/" />}
        />
        <Route
          path="/orders"
          element={user ? <Orders user={user} handleLogout={handleLogout} /> : <Navigate to="/" />}
        />
        {/* Placeholder routes for others */}
        {/* Actual routes */}
        <Route
          path="/analytics"
          element={user ? <Analytics user={user} handleLogout={handleLogout} /> : <Navigate to="/" />}
        />
        <Route
          path="/contact"
          element={user ? <Contact user={user} handleLogout={handleLogout} /> : <Navigate to="/" />}
        />
        <Route
          path="/about"
          element={user ? <About user={user} handleLogout={handleLogout} /> : <Navigate to="/" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
