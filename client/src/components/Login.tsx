import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, discordLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) navigate("/dashboard");
    else alert("Invalid credentials");
  };

  return (
    <div className="form-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="email"></label>
          <input
            type="email"
            placeholder="Email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password"></label>
          <input
            type="password"
            placeholder="Password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="button-container">
          <button type="submit" className="form-button">
            Login
          </button>
          <a href="/auth/discord/callback" className="discord-link login-link">
            <button
              type="button"
              className="form-button discord-button"
              onClick={(e) => {
                e.preventDefault(); // Prevent default link behavior
                discordLogin(); // Trigger discordLogin function
              }}
            >
              <i className="fa-brands fa-discord"></i>
              Login with Discord
            </button>
          </a>
        </div>
      </form>
    </div>
  );
};

export default Login;
