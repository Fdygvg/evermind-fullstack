// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SessionProvider } from "./context/SessionContext";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import ForgotPassword from "./components/Auth/ForgotPassword";
import ResetPassword from "./components/Auth/ResetPassword";
import VerifyEmail from "./components/Auth/VerifyEmail";
import Dashboard from "./pages/Dashboard";
import ReviewSessionPage from "./pages/ReviewSessionPage";
import ActiveSessionPage from "./pages/ActiveSessionPage";
import SessionResultsPage from "./pages/SessionResultsPage";
import AddQuestion from "./pages/AddQuestionPage";
import Sections from "./pages/SectionPage";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/Common/ProtectedRoute";
import MainLayout from "./components/Layout/MainLayout";

function App() {
  return (
    <AuthProvider>
      <SessionProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/sessions" element={<ReviewSessionPage />} />
                <Route
                  path="/sessions/review"
                  element={<ReviewSessionPage />}
                />
                <Route
                  path="/sessions/active"
                  element={<ActiveSessionPage />}
                />
                <Route
                  path="/sessions/results"
                  element={<SessionResultsPage />}
                />
              </Route>
              <Route path="/sections" element={<Sections />} />
              <Route path="/questions/add" element={<AddQuestion />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </Router>
      </SessionProvider>
    </AuthProvider>
  );
}

export default App;
