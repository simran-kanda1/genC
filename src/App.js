import React, { useState } from "react";
import './App.css';
import FileUpload from './components/FileUpload/FileUpload';
import Login from './components/Login/Login';

const App = () => {
  const [userEmail, setUserEmail] = useState(null);

  const handleLogin = (email) => {
    setUserEmail(email);
  };

  const handleLogout = () => {
    setUserEmail(null);
  };

  return (
    <div className='container'>
      {!userEmail ? (
        <Login onLogin={handleLogin} />
      ) : (
        <FileUpload onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;