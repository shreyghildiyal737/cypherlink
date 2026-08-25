import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { RequireAuth } from "./components/RequireAuth";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import { RouteFallback } from "./components/layout/RouteFallback";
import { usePushSubscription } from "./hooks/usePushSubscription";

// Lazy-load secondary routes so the initial bundle ships only what the first
// paint needs (Landing + Home + AppShell). Detail pages, ops, and create flows
// load on-demand. Order matters less than coverage here.
const Feed = lazy(() => import("./pages/Feed"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const Cyphers = lazy(() => import("./pages/Cyphers"));
const CypherDetail = lazy(() => import("./pages/CypherDetail"));
const MapPage = lazy(() => import("./pages/MapPage"));
const Profile = lazy(() => import("./pages/Profile"));
const Messages = lazy(() => import("./pages/Messages"));
const Create = lazy(() => import("./pages/Create"));
const CreateCypher = lazy(() => import("./pages/CreateCypher"));
const CreateProject = lazy(() => import("./pages/CreateProject"));
const CreateClip = lazy(() => import("./pages/CreateClip"));
const CreateCommunity = lazy(() => import("./pages/CreateCommunity"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Search = lazy(() => import("./pages/Search"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Settings = lazy(() => import("./pages/Settings"));
const Login = lazy(() => import("./pages/Login"));
const OpsHome = lazy(() => import("./pages/ops/OpsHome"));
const OrganizerDashboard = lazy(() => import("./pages/ops/OrganizerDashboard"));
const AdminConsole = lazy(() => import("./pages/ops/AdminConsole"));
const DeveloperConsole = lazy(() => import("./pages/ops/DeveloperConsole"));
const Discover = lazy(() => import("./pages/Discover"));
const Artists = lazy(() => import("./pages/Artists"));
const ArtistDetail = lazy(() => import("./pages/ArtistDetail"));
const Community = lazy(() => import("./pages/Community"));
const CommunityDetail = lazy(() => import("./pages/CommunityDetail"));
const Scenes = lazy(() => import("./pages/Scenes"));
const ScenePage = lazy(() => import("./pages/ScenePage"));
const ClipDetail = lazy(() => import("./pages/ClipDetail"));

export default function App() {
  usePushSubscription();
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<Home />} />
        <Route
          path="/feed"
          element={
            <Suspense fallback={<RouteFallback />}>
              <Feed />
            </Suspense>
          }
        />
        <Route
          path="/map"
          element={
            <Suspense fallback={<RouteFallback />}>
              <MapPage />
            </Suspense>
          }
        />
        <Route
          path="/projects"
          element={
            <Suspense fallback={<RouteFallback />}>
              <Projects />
            </Suspense>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <Suspense fallback={<RouteFallback />}>
              <ProjectDetail />
            </Suspense>
          }
        />
        <Route
          path="/cyphers"
          element={
            <Suspense fallback={<RouteFallback />}>
              <Cyphers />
            </Suspense>
          }
        />
        <Route
          path="/cyphers/:id"
          element={
            <Suspense fallback={<RouteFallback />}>
              <CypherDetail />
            </Suspense>
          }
        />
        <Route
          path="/profile/:id"
          element={
            <Suspense fallback={<RouteFallback />}>
              <Profile />
            </Suspense>
          }
        />
        <Route
          path="/discover"
          element={
            <Suspense fallback={<RouteFallback />}>
              <Discover />
            </Suspense>
          }
        />
        <Route
          path="/artists"
          element={
            <Suspense fallback={<RouteFallback />}>
              <Artists />
            </Suspense>
          }
        />
        <Route
          path="/artists/:id"
          element={
            <Suspense fallback={<RouteFallback />}>
              <ArtistDetail />
            </Suspense>
          }
        />
        <Route
          path="/community"
          element={
            <Suspense fallback={<RouteFallback />}>
              <Community />
            </Suspense>
          }
        />
        <Route
          path="/community/:id"
          element={
            <Suspense fallback={<RouteFallback />}>
              <CommunityDetail />
            </Suspense>
          }
        />
        <Route
          path="/scenes"
          element={
            <Suspense fallback={<RouteFallback />}>
              <Scenes />
            </Suspense>
          }
        />
        <Route
          path="/scenes/:city"
          element={
            <Suspense fallback={<RouteFallback />}>
              <ScenePage />
            </Suspense>
          }
        />
        <Route
          path="/clips/:id"
          element={
            <Suspense fallback={<RouteFallback />}>
              <ClipDetail />
            </Suspense>
          }
        />
        <Route
          path="/search"
          element={
            <Suspense fallback={<RouteFallback />}>
              <Search />
            </Suspense>
          }
        />
        <Route
          path="/login"
          element={
            <Suspense fallback={<RouteFallback />}>
              <Login />
            </Suspense>
          }
        />
        <Route
          path="/messages"
          element={
            <RequireAuth>
              <Suspense fallback={<RouteFallback />}>
                <Messages />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route
          path="/create"
          element={
            <RequireAuth>
              <Suspense fallback={<RouteFallback />}>
                <Create />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route
          path="/create/cypher"
          element={
            <RequireAuth>
              <Suspense fallback={<RouteFallback />}>
                <CreateCypher />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route
          path="/create/project"
          element={
            <RequireAuth>
              <Suspense fallback={<RouteFallback />}>
                <CreateProject />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route
          path="/create/clip"
          element={
            <RequireAuth>
              <Suspense fallback={<RouteFallback />}>
                <CreateClip />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route
          path="/create/community"
          element={
            <RequireAuth>
              <Suspense fallback={<RouteFallback />}>
                <CreateCommunity />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route
          path="/onboarding"
          element={
            <RequireAuth>
              <Suspense fallback={<RouteFallback />}>
                <Onboarding />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route
          path="/notifications"
          element={
            <RequireAuth>
              <Suspense fallback={<RouteFallback />}>
                <Notifications />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <Suspense fallback={<RouteFallback />}>
                <Settings />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route
          path="/ops"
          element={
            <RequireAuth>
              <Suspense fallback={<RouteFallback />}>
                <OpsHome />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route
          path="/ops/organizer"
          element={
            <RequireAuth>
              <Suspense fallback={<RouteFallback />}>
                <OrganizerDashboard />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route
          path="/ops/admin"
          element={
            <RequireAuth>
              <Suspense fallback={<RouteFallback />}>
                <AdminConsole />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route
          path="/ops/developer"
          element={
            <RequireAuth>
              <Suspense fallback={<RouteFallback />}>
                <DeveloperConsole />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  );
}
