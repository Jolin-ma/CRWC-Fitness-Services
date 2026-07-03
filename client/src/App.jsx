import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import ProgressPage from "./pages/ProgressPage.jsx";
import BodyGoalsPage from "./pages/BodyGoalsPage.jsx";
import WorkoutLogPage from "./pages/WorkoutLogPage.jsx";
import NutritionLogPage from "./pages/NutritionLogPage.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import ClientHistoryPage from "./pages/ClientHistoryPage.jsx";
import AdminCyclesPage from "./pages/AdminCyclesPage.jsx";
import AdminCycleDetailPage from "./pages/AdminCycleDetailPage.jsx";
import CoachDashboard from "./pages/CoachDashboard.jsx";
import { useAuth } from "./context/AuthContext.jsx";

const DASHBOARD_BY_ROLE = { ADMIN: "/admin", COACH: "/coach", STUDENT: "/student" };

function Home() {
  const { user } = useAuth();
  if (user) return <Navigate to={DASHBOARD_BY_ROLE[user.role]} replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/student"
        element={
          <ProtectedRoute roles={["STUDENT"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/progress"
        element={
          <ProtectedRoute roles={["STUDENT"]}>
            <ProgressPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/body-goals"
        element={
          <ProtectedRoute roles={["STUDENT"]}>
            <BodyGoalsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/workouts"
        element={
          <ProtectedRoute roles={["STUDENT"]}>
            <WorkoutLogPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/nutrition"
        element={
          <ProtectedRoute roles={["STUDENT"]}>
            <NutritionLogPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/clients/:id"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <ClientHistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/cycles"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <AdminCyclesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/cycles/:label"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <AdminCycleDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/coach"
        element={
          <ProtectedRoute roles={["COACH"]}>
            <CoachDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
