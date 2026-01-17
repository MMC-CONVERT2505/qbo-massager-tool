import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import PrivateRoute from "./components/PrivateRoute";
import FileDashboard from "./pages/FileDashboard";
import SummaryDashboard from "./pages/SummaryDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* 🔥 MOVE THIS INSIDE Routes */}
        <Route
          path="/file/:fileId"
          element={
            <PrivateRoute>
              <FileDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/summary/:fileId"
          element={
            <PrivateRoute>
              <SummaryDashboard />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
