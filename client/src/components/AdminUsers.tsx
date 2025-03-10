import React, { useState, useEffect } from 'react';

interface AdminDashboardProps {
  user: {
    id: number;
    username: string;
    isAdmin: number;
    discord_id?: string; // Make properties optional
    avatar?: string;
    email?: string;
    discord_username?: string;
  };
}

const UserManagement: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]); // State to store the users
  const [ipVisible, setIpVisible] = useState<string | null>(null); // State to store the IP of the selected user

  const handleClick = (userId: string, ip: string | null) => {
    if (ip) {
      setIpVisible(ip); // Show the IP in the modal
    }
  };

  const closeModal = () => {
    setIpVisible(null); // Hide the modal when it's closed
  };

  // Fetch users from the backend API
  useEffect(() => {
    fetch('http://localhost:5000/api/admin/users') // Change the API URL if necessary
      .then(response => response.json())
      .then(data => {
        setUsers(data.users); // Assuming the data has a `users` key
      })
      .catch(error => {
        console.error('Error fetching users:', error);
      });
  }, []); // Empty array means this effect runs once when the component mounts

  const handleViewUser = (userId: string) => {
    fetch(`http://localhost:5000/api/admin/users/${userId}`)
      .then(response => response.json())
      .then(userData => {
        setSelectedUser(userData);
        setModalVisible(true);
      });
  };

  return (
    <div className="user-management">
      <div className="index-layout">
        <div className="body-container">
          <main className="index-content">
            <section className="content">
              <h1 className="user-title">User Management</h1>

              {/* User Table */}
              <div className="table-container user-manage-table">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Discord</th>
                      <th>Role</th>
                      <th>Last Login</th>
                      <th>Login Method</th>
                      <th>IP</th>
                      <th>Platform</th> {/* Added Platform Column */}
                      <th>Referrer</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => {
                      const referrer = user.referrer ? JSON.parse(user.referrer) : null;
                      return (
                        <tr key={user.id}>
                          <td>{index + 1}</td>
                          <td>{user.username}</td>
                          <td>{user.email}</td>
                          <td>{user.discord_id || 'Not linked'}</td>
                          <td>{user.isAdmin === 1 ? 'Contractor' : user.isAdmin === 2 ? 'Admin' : 'User'}</td>
                          <td>{user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</td>
                          <td>{user.last_login_method || 'N/A'}</td>
                          <td>
                            {/* Clickable box that triggers the IP modal */}
                            <div
                              className="ip-blurred"
                              onClick={() => handleClick(user.id, user.ip)}
                            >
                              Click to reveal IP
                            </div>
                          </td>
                          <td>{user.platform || 'N/A'}</td> {/* Display the platform */}
                          <td>{referrer ? referrer.username : 'No Referrer'}</td>
                          <td className="action-buttons">
                            <button className="view-btn" onClick={() => handleViewUser(user.id)}>
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {/* Pagination can be added here if necessary */}

              {/* Modal to show IP */}
              {ipVisible && (
                <div className="modal">
                  <div className="modal-content">
                    <span className="close" onClick={closeModal}>
                      &times;
                    </span>
                    <h2>User IP</h2>
                    <p>{ipVisible}</p>
                  </div>
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
