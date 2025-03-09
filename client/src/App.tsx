import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext"; // Import the AuthProvider
import "./App.css";
import Home from "./components/Home";
import Careers from "./components/Career";
import Advertise from "./components/Advertise";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Login from "./components/Login"; // Import Login component
import AdminDashboard from "./components/AdminDashboard";
import ContractorDashboard from "./components/ContractorDashboard";

const App: React.FC = () => {
  return (
    <AuthProvider> {/* Wrap the application in AuthProvider */}
      <Router>
        {/* Render the head for meta tags */}
        {/* <Head title="On Top Network" tag="On Top Network" isAdmin={false} /> */}
        
        {/* Render the header (navigation) */}
        <Header />
  
        {/* Define your routes */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/advertise" element={<Advertise />} />
          <Route path="/login" element={<Login />} /> {/* Add login route */}
          <Route path="/contractor/dashboard" element={<ContractorDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          {/* Add more routes as needed */}
        </Routes>
  
        {/* Render the footer */}
        <Footer />
      </Router>
    </AuthProvider>
  );
};

export default App;
