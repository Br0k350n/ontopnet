// AdminNav.tsx
import React from "react";
import { Link, NavLink } from "react-router-dom";

const AdminNav: React.FC = () => {
  return (
    <div className="categories">
      <div className="cat-nav">
        <div><Link to="/admin/dashboard" className="nav-link" id="dashboard-link">Dashboard</Link></div>
        <div><Link to="/admin/users" className="nav-link" id="user-management-link">Manage Users</Link></div>
        <div><Link to="/admin/listings" className="nav-link" id="listings-management-link">Manage Listings</Link></div>
        <div><Link to="/admin/banners" className="nav-link" id="banner-management-link">Manage Banners</Link></div>
        <div><Link to="/admin/sponsors" className="nav-link" id="sponsors-link">Sponsors</Link></div>
        <div><Link to="/admin/analytics" className="nav-link" id="analytics-link">Analytics</Link></div>
        <div><Link to="/admin/settings" className="nav-link" id="settings-link">Settings</Link></div>
      </div>
    </div>
  );
};

export default AdminNav;
