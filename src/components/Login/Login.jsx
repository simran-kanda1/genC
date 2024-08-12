import React, { useState } from "react";
import './Login.css';
import logo from './logo512.png';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = () => {
    const user = { email: "generations1", password: "generations" }; // Replace with your credentials
    if (email === user.email && password === user.password) {
      onLogin(user.email);
    } else {
      setErrorMessage("Invalid username or password");
    }
  };

  return (
    <div className="login-container">
      <img src={logo} alt="Logo" className="logoLogin" />
      <h2 className="login-title">Generations Document Tool Login</h2>
      <div className="login-input-group">
        <label htmlFor="login-email">Username:</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="login-input-group">
        <label htmlFor="login-password">Password:</label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {errorMessage && <p className="login-error-message">{errorMessage}</p>}
      <button className="login-button" onClick={handleLogin}>Login</button>
    </div>
  );
};

export default Login;
