import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Server {
  id: number;
  serverName: string;
  ip: string;
  owner: string;
  status: boolean;
  created_at: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  discord_id?: string;
  avatar?: string;
  isAdmin: boolean;
  activity?: { timestamp: string; method: string }[];
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [servers, setServers] = useState<Server[]>([]);
  const [recentServers, setRecentServers] = useState<Server[]>([]);
  const [userModal, setUserModal] = useState<User | null>(null);
  const [totalServers, setTotalServers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetch(`/api/admin/servers?page=${currentPage}`)
      .then((res) => res.json())
      .then((data) => {
        setServers(data.servers);
        setRecentServers(data.recentServers);
        setTotalServers(data.totalServers);
      })
      .catch((err) => console.error("Error fetching servers:", err));
  }, [currentPage]);

  const viewUser = (userId: number) => {
    fetch(`/api/admin/users/${userId}`)
      .then((res) => res.json())
      .then(setUserModal);
  };

  const changePassword = (userId: number) => {
    const newPassword = prompt("Enter a new password:");
    if (newPassword) {
      fetch(`/api/admin/users/${userId}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      }).then(() => alert("Password changed successfully!"));
    }
  };

  const warnUser = (userId: number) => {
    const warningMessage = prompt("Enter the reason for the warning:");
    if (window.confirm("Are you sure you want to warn this user?")) {
      fetch(`/api/admin/users/warn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, message: warningMessage }),
      }).then(() => alert("User warned successfully!"));
    }
  };

  const banUser = (userId: number) => {
    if (window.confirm("Are you sure you want to ban this user?")) {
      fetch(`/api/admin/users/${userId}/ban`, { method: "POST" }).then(() =>
        alert("User banned successfully!")
      );
    }
  };

  const removeServer = (serverId: number) => {
    if (window.confirm("Are you sure you want to remove this server?")) {
      fetch(`/api/admin/delete-city`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverId }),
      }).then(() => setServers(servers.filter((s) => s.id !== serverId)));
    }
  };

  return (
    <div className="dashboard-container">
      <h1>Admin Dashboard</h1>

      {/* Last Submitted Cities */}
      <div className="table-container">
        <h3>Last Submitted Cities</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Server Name</th>
              <th>Owner</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {recentServers.map((server, index) => (
              <tr key={server.id}>
                <td>{index + 1}</td>
                <td>{server.serverName}</td>
                <td>{server.owner}</td>
                <td>{new Date(server.created_at).toUTCString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Server Listing Management */}
      <div className="table-container">
        <h3>Server Listing Management</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Server Name</th>
              <th>IP Address</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {servers.map((server, index) => (
              <tr key={server.id}>
                <td>{index + 1}</td>
                <td>{server.serverName}</td>
                <td>{server.ip}</td>
                <td>
                  <span onClick={() => viewUser(Number(server.owner))} style={{ cursor: "pointer", textDecoration: "underline" }}>
                    {server.owner}
                  </span>
                </td>
                <td>{server.status ? "Online" : "Offline"}</td>
                <td>
                  <button onClick={() => navigate(`/admin/edit-city/${server.id}`)}>Edit</button>
                  <button onClick={() => removeServer(server.id)} className="remove-btn">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        {Array.from({ length: Math.ceil(totalServers / itemsPerPage) }, (_, i) => i + 1).map((page) => (
          <button key={page} className={page === currentPage ? "active" : ""} onClick={() => setCurrentPage(page)}>
            {page}
          </button>
        ))}
      </div>

      {/* User Modal */}
      {userModal && (
        <div className="modal">
          <div className="modal-content">
            <span onClick={() => setUserModal(null)} className="close">&times;</span>
            <img src={userModal.avatar || "/imgs/default-avatar.png"} className="user-avatar" alt="User Avatar" />
            <p><strong>Username:</strong> {userModal.username}</p>
            <p><strong>Email:</strong> {userModal.email}</p>
            <p><strong>Discord:</strong> {userModal.discord_id || "Not linked"}</p>
            <p><strong>Role:</strong> {userModal.isAdmin ? "Admin" : "User"}</p>
            <p><strong>Last Login:</strong> {userModal.activity?.[0]?.timestamp ? new Date(userModal.activity[0].timestamp).toLocaleDateString() : "Never"}</p>
            <p><strong>Login Method:</strong> {userModal.activity?.[0]?.method || "N/A"}</p>
            <button onClick={() => changePassword(userModal.id)}>Change Password</button>
            <button onClick={() => warnUser(userModal.id)}>Warn</button>
            <button onClick={() => banUser(userModal.id)}>Ban</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
