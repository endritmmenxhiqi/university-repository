import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/forgotPassword'; 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path='/register' element={<Register />} />
        
        {/* Variantet që mbulojnë çdo rast */}
        <Route path='/forgotPassword' element={<ForgotPassword />} />
        <Route path='/forgot-password/:token' element={<ForgotPassword />} />
        
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;