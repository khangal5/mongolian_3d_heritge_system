import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import ArtifactsPage from "./pages/ArtifactsPage.jsx";
import ArtifactDetailPage from "./pages/ArtifactDetailPage.jsx";
import MapPage from "./pages/MapPage.jsx";

const ReconstructionLabPage = lazy(() => import("./pages/ReconstructionLabPage.jsx"));
const LoginPage = lazy(() => import("./pages/LoginPage.jsx"));
const RegisterPage = lazy(() => import("./pages/RegisterPage.jsx"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage.jsx"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage.jsx"));
const NewArtifactPage = lazy(() => import("./pages/NewArtifactPage.jsx"));
const DashboardPage = lazy(() => import("./pages/DashboardPage.jsx"));
const AdminQueuePage = lazy(() => import("./pages/AdminQueuePage.jsx"));
const AdminResearchersPage = lazy(() => import("./pages/AdminResearchersPage.jsx"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage.jsx"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage.jsx"));

function RouteFallback() {
  return <div className="route-loading" aria-busy="true" />;
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/artifacts" element={<ArtifactsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/artifacts/new" element={<NewArtifactPage />} />
        <Route path="/artifacts/:slug/edit" element={<NewArtifactPage />} />
        <Route path="/artifacts/:slug" element={<ArtifactDetailPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/admin/queue" element={<AdminQueuePage />} />
        <Route path="/admin/researchers" element={<AdminResearchersPage />} />
        <Route path="/reconstruction-lab" element={<ReconstructionLabPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
