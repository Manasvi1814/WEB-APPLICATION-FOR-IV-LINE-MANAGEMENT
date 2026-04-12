import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import WelcomePage from "./components/Welcome";
import LoginPage from "./components/LoginPage";


// Lazy-loaded pages
const Dashboard = lazy(() => import("./components/Dashboard"));
const PatientManagement = lazy(
  () => import("./components/PatientManagement")
);
const Reports = lazy(() => import("./components/Reports"));
const AdminPanel = lazy(() => import("./components/AdminPanel"));
const FeedbackSummary = lazy(() => import("./components/FeedbackSummary"));


// ProtectedRoute component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { department } = useAuth();
  if (!department) return <Navigate to="/login" replace />;
  return <>{children}</>;
};


const AppContent: React.FC = () => {
  const { department } = useAuth();


  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full"></div>
        </div>
      }
    >
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<WelcomePage />} />
        <Route
          path="/login"
          element={
            department ? <Navigate to="/dashboard" replace /> : <LoginPage />
          }
        />


        {/* Protected routes */}
        <Route
          element={
            <ProtectedRoute>
              <Layout /> {/* Layout uses <Outlet /> */}
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/patients" element={<PatientManagement />} />
          <Route path="/reports" element={<Reports />} />
            <Route path="/feedback-summary" element={<FeedbackSummary />} /> {/* ✅ added */}
          <Route path="/admin" element={<AdminPanel />} />
        </Route>


        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};


const App: React.FC = () => (
  <AuthProvider>
    <Router>
      <AppContent />
    </Router>
  </AuthProvider>
);


export default App;