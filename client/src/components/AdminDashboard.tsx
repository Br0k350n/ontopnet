import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNav from "./AdminNav";

interface Server {
  id: number;
  serverName: string;
  ip: string;
  owner: string;
  status: boolean;
  created_at: string;
  // Additional fields from fetchServerDetails may be present as needed
}

interface AdminDashboardProps {
    user: {
      id: number;
      username: string;
      isAdmin: number;
      discord_id?: string;  // Make properties optional
      avatar?: string;
      email?: string;
      discord_username?: string;
    };
  }

interface User {
  id: number;
  username: string;
  email: string;
  discord_id?: string;
  avatar?: string;
  isAdmin: number;
  activity?: { timestamp: string; method: string }[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const [servers, setServers] = useState<Server[]>([]);
  const [recentServers, setRecentServers] = useState<Server[]>([]);
  const [totalServers, setTotalServers] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);
  const [activePlayers, setActivePlayers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [userModal, setUserModal] = useState<User | null>(null);
  const itemsPerPage = 10;

  // If the user is not an admin (isAdmin !== 2), redirect away.
  useEffect(() => {
    if (!user || user.isAdmin !== 2) {
      navigate("/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    fetch(`http://localhost:5000/api/admin/servers?page=${currentPage}&isAdmin=2`)
      .then((res) => res.json())
      .then((data) => {
        // data.servers is the full list with details,
        // data.recentServers is the subset (or you can calculate it if needed)
        setServers(data.servers || []);
        setRecentServers(data.recentServers || []);
        setTotalServers(data.totalServers || 0);
        setTotalVotes(data.totalVotes || 0);
        setActivePlayers(data.activePlayers || 0);
      })
      .catch((err) => {
        console.error("Error fetching servers:", err);
        setServers([]);
        setRecentServers([]);
        setTotalServers(0);
        setTotalVotes(0);
        setActivePlayers(0);
      });
  }, [currentPage]);

  const viewUser = (userId: string) => {
    fetch(`http://localhost:5000/api/admin/users/${userId}`)
      .then((res) => res.json())
      .then(setUserModal)
      .catch((err) => console.error("Error fetching user data:", err));
  };

  const changePassword = (userId: number) => {
    const newPassword = prompt("Enter a new password:");
    if (newPassword) {
      fetch(`http://localhost:5000/api/admin/users/${userId}/change-password?isAdmin=2`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      })
        .then(() => alert("Password changed successfully!"))
        .catch((err) => console.error("Error changing password:", err));
    }
  };

  const warnUser = (userId: number) => {
    const warningMessage = prompt("Enter the reason for the warning:");
    if (window.confirm("Are you sure you want to warn this user?")) {
      fetch(`http://localhost:5000/api/admin/users/warn?isAdmin=2`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, message: warningMessage }),
      })
        .then(() => alert("User warned successfully!"))
        .catch((err) => console.error("Error warning user:", err));
    }
  };

  const banUser = (userId: number) => {
    if (window.confirm("Are you sure you want to ban this user?")) {
      fetch(`http://localhost:5000/api/admin/users/${userId}/ban?isAdmin=2`, {
        method: "POST",
      })
        .then(() => alert("User banned successfully!"))
        .catch((err) => console.error("Error banning user:", err));
    }
  };

  const removeServer = (serverId: number) => {
    if (window.confirm("Are you sure you want to remove this server?")) {
      fetch(`http://localhost:5000/api/admin/delete-city?isAdmin=2`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverId }),
      })
        .then(() => {
          setServers(servers.filter((s) => s.id !== serverId));
        })
        .catch((err) => console.error("Error removing server:", err));
    }
  };

  return (
    <div className="dashboard-container">
      
      <div className="admin-title">
            <h1>Admin Dashboard</h1>
      </div>
      <AdminNav />
      {/* Statistics Section */}
      {/* <div className="statistics">
        <p>Total Servers: {totalServers}</p>
        <p>Total Votes: {totalVotes}</p>
      </div> */}

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
            {recentServers.length === 0 ? (
              <tr>
                <td colSpan={4}>No recent servers found.</td>
              </tr>
            ) : (
              recentServers.map((server, index) => (
                <tr key={server.id}>
                  <td>{index + 1}</td>
                  <td>{server.serverName}</td>
                  <td>{server.owner}</td>
                  <td>{new Date(server.created_at).toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}</td>
                </tr>
              ))
            )}
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
            {servers.length === 0 ? (
              <tr>
                <td colSpan={6}>No servers found.</td>
              </tr>
            ) : (
              servers.map((server, index) => (
                <tr key={server.id}>
                  <td>{index + 1}</td>
                  <td>{server.serverName}</td>
                  <td>{server.ip}</td>
                  <td>
                    <span
                      onClick={() => viewUser(server.owner)}
                      style={{ cursor: "pointer", textDecoration: "underline" }}
                    >
                      {server.owner}
                    </span>
                  </td>
                  <td>{server.status ? "Online" : "Offline"}</td>
                  <td className="action-buttons">
                    <a href={`/admin/edit-city/${server.id}`} className="button edit-btn"><button className="edit-btn">Edit</button></a>
                    <button onClick={() => removeServer(server.id)} className="remove-btn remove-button removeServerBtn">
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
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
          <span onClick={() => setUserModal(null)} className="close">
            &times;
          </span>
      
          <img
            src={userModal.avatar || "/imgs/default-avatar.png"}
            className="user-avatar"
            alt="User Avatar"
          />
      
          <div id="modalUserDetails">
            <p><strong>Username:</strong> {userModal.username}</p>
            <p><strong>Email:</strong> {userModal.email}</p>
            <p><strong>Discord:</strong> {userModal.discord_id || "Not linked"}</p>
            <p><strong>Role:</strong> {userModal.isAdmin ? "Admin" : "User"}</p>
            <p>
              <strong>Last Login:</strong>{" "}
              {userModal.activity?.[0]?.timestamp
                ? new Date(userModal.activity[0].timestamp).toLocaleDateString()
                : "Never"}
            </p>
            <p><strong>Login Method:</strong> {userModal.activity?.[0]?.method || "N/A"}</p>
          </div>
      
          <div className="modal-buttons">
            <button
              className="change-password"
              onClick={() => changePassword(userModal.id)}
            >
              Change Password
            </button>
      
            <button
              className="warn-user"
              onClick={() => warnUser(userModal.id)}
            >
              Warn
            </button>
      
            <button
              className="ban-user"
              onClick={() => banUser(userModal.id)}
            >
              Ban
            </button>
          </div>
        </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
