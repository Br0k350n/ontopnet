import React, { useEffect, useState } from "react";

interface DiscountCode {
  id: number;
  code: string;
  discount: number;
  created_at: string;
}

interface ReferredUser {
  id: number;
  username: string;
  email: string;
  discord_id?: string;
  created_at: string;
}

const ContractorDashboard: React.FC = () => {
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [discountSuccess, setDiscountSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/contractor/discount-codes`)
      .then((res) => res.json())
      .then(setDiscountCodes);

    fetch(`/api/contractor/referred-users?page=${currentPage}`)
      .then((res) => res.json())
      .then((data) => {
        setReferredUsers(data.users);
        setTotalUsers(data.totalUsers);
      });
  }, [currentPage]);

  const createDiscountCode = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const discount = parseFloat(formData.get("discount") as string);

    if (discount > 10) {
      alert("Discount cannot exceed 10%");
      return;
    }

    fetch("/api/contractor/discount-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discount }),
    })
      .then((res) => res.json())
      .then(() => setDiscountSuccess(true));
  };

  return (
    <div className="dashboard-container">
      <h1>Contractor Dashboard</h1>

      {/* Recent Discount Codes */}
      <div className="table-container">
        <h3>Recent Discount Codes</h3>
        {discountCodes.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Discount Code</th>
                <th>Discount (%)</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {discountCodes.map((code, index) => (
                <tr key={code.id}>
                  <td>{index + 1}</td>
                  <td>{code.code}</td>
                  <td>{code.discount}</td>
                  <td>{new Date(code.created_at).toUTCString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No discount codes created yet.</p>
        )}
      </div>

      {/* Referred Users */}
      <div className="table-container">
        <h3>Referred Users</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Username</th>
              <th>Email</th>
              <th>Discord</th>
              <th>Referral Date</th>
            </tr>
          </thead>
          <tbody>
            {referredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="no-referred-users">
                  <span className="emoji">😞</span>
                  <p>You haven't referred anyone yet!</p>
                </td>
              </tr>
            ) : (
              referredUsers.map((user, index) => (
                <tr key={user.id}>
                  <td>{index + 1 + (currentPage - 1) * itemsPerPage}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.discord_id || "Not Linked"}</td>
                  <td>{new Date(user.created_at).toUTCString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        {Array.from({ length: Math.ceil(totalUsers / itemsPerPage) }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            className={page === currentPage ? "active" : ""}
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </button>
        ))}
      </div>

      {/* Create Discount Code */}
      <div className="discount-code-section">
        <h3>Create a Discount Code</h3>
        <form onSubmit={createDiscountCode}>
          <div className="form-group">
            <label htmlFor="discount">Discount Percentage (%):</label>
            <input type="number" id="discount" name="discount" min="0" max="10" step="0.1" required />
          </div>
          <button type="submit">Create Discount Code</button>
        </form>
      </div>

      {/* Success Modal */}
      {discountSuccess && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setDiscountSuccess(false)}>
              &times;
            </span>
            <p>Discount code created successfully!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractorDashboard;
