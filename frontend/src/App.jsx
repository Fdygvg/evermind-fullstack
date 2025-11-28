// src/App.jsx
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'

// Simple components for testing
const Dashboard = () => (
  <div className="dashboard">
    <h1>EVERMIND Dashboard</h1>
    <p>Welcome to your learning journey! 🧠</p>
    <nav>
      <a href="/login">Login</a> | <a href="/register">Register</a>
    </nav>
  </div>
)

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App