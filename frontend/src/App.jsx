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
import { ThemeProvider } from "./context/ThemeContext";
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
import BulkImportPage from "./pages/BulkImportPage";
import Sections from "./pages/SectionPage";
import NotFound from "./pages/NotFound";
import SearchPage from "./pages/SearchPage";
import EditQuestionPage from "./pages/EditQuestionPage";
import AddEditSectionPage from "./pages/AddEditSectionPage";
import SettingsPage from "./pages/SettingsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SessionHistoryPage from "./pages/SessionHistoryPage";
import ExportPage from "./pages/ExportPage";
import ProtectedRoute from "./components/Common/ProtectedRoute";
import MainLayout from "./components/Layout/MainLayout";

function App() {
  return (
    <ThemeProvider>
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
                    path="/session/review"
                    element={<ReviewSessionPage />}
                  />
                  <Route
                    path="/session/active"
                    element={<ActiveSessionPage />}
                  />
                  <Route
                    path="/sections/add"
                    element={<AddEditSectionPage />}
                  />
                  <Route
                    path="/sections/edit/:id"
                    element={<AddEditSectionPage />}
                  />
                  <Route
                    path="/session/results"
                    element={<SessionResultsPage />}
                  />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
                <Route path="/sections" element={<Sections />} />
                <Route path="/questions/add" element={<AddQuestion />} />
                  <Route
                    path="/questions/bulk-import"
                    element={<BulkImportPage />}
                  />
                  <Route
                    path="/questions/export"
                    element={<ExportPage />}
                  />
                  <Route
                    path="/questions/edit/:id"
                    element={<EditQuestionPage />}
                  />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/history" element={<SessionHistoryPage />} />
                <Route path="/search" element={<SearchPage />} />
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
    </ThemeProvider>
  );
}

export default App;
