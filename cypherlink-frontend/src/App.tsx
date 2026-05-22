import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { RequireAuth } from "./components/RequireAuth";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Feed from "./pages/Feed";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Cyphers from "./pages/Cyphers";
import CypherDetail from "./pages/CypherDetail";
import MapPage from "./pages/MapPage";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import Create from "./pages/Create";
import Search from "./pages/Search";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import OpsHome from "./pages/ops/OpsHome";
import OrganizerDashboard from "./pages/ops/OrganizerDashboard";
import AdminConsole from "./pages/ops/AdminConsole";
import DeveloperConsole from "./pages/ops/DeveloperConsole";
export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<Home />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/cyphers" element={<Cyphers />} />
        <Route path="/cyphers/:id" element={<CypherDetail />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/search" element={<Search />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/messages"
          element={
            <RequireAuth>
              <Messages />
            </RequireAuth>
          }
        />
        <Route
          path="/create"
          element={
            <RequireAuth>
              <Create />
            </RequireAuth>
          }
        />
        <Route
          path="/notifications"
          element={
            <RequireAuth>
              <Notifications />
            </RequireAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <Settings />
            </RequireAuth>
          }
        />
        <Route
          path="/ops"
          element={
            <RequireAuth>
              <OpsHome />
            </RequireAuth>
          }
        />
        <Route
          path="/ops/organizer"
          element={
            <RequireAuth>
              <OrganizerDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/ops/admin"
          element={
            <RequireAuth>
              <AdminConsole />
            </RequireAuth>
          }
        />
        <Route
          path="/ops/developer"
          element={
            <RequireAuth>
              <DeveloperConsole />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  );
}
