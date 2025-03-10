import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext"; // Import AuthProvider
import "./App.css";
import Home from "./components/Home";
import Careers from "./components/Career";
import Advertise from "./components/Advertise";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Login from "./components/Login";
import AdminDashboard from "./components/AdminDashboard";
import ContractorDashboard from "./components/ContractorDashboard";
import UserManagement from "./components/AdminUsers";

// Create App component inside the AuthProvider context
const App: React.FC = () => {
  return (
    <AuthProvider> {/* Wrap the entire app in AuthProvider */}
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

// The routes will use the Auth context
const AppRoutes: React.FC = () => {
  const [loading, setLoading] = useState(true); // Loading state to wait for user data
  const { user } = useAuth(); // Get the current user from AuthContext

  useEffect(() => {
    // Once user is loaded, stop the loading state
    if (user !== undefined) {
      setLoading(false);
    }
  }, [user]);

  // If user is loading, show a loading state (like a spinner)
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Header />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/advertise" element={<Advertise />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        {/* Admin Dashboard Route */}
        <Route
          path="/admin/dashboard"
          element={
            user && user.isAdmin === 2 ? (
              <AdminDashboard user={user} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route path="/admin/users" element={<UserManagement />} />

        {/* Contractor Dashboard Route */}
        <Route
          path="/contractor/dashboard"
          element={
            user && user.isAdmin === 1 ? (
              <ContractorDashboard user={user} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* If user is logged in, but doesn't match role, redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Footer />
    </>
  );
};

export default App;
