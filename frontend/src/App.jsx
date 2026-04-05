import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";

const ArtifactDetailPage = lazy(() => import("./pages/ArtifactDetailPage.jsx"));
const ReconstructionLabPage = lazy(() => import("./pages/ReconstructionLabPage.jsx"));
const LoginPage = lazy(() => import("./pages/LoginPage.jsx"));
const RegisterPage = lazy(() => import("./pages/RegisterPage.jsx"));
const NewArtifactPage = lazy(() => import("./pages/NewArtifactPage.jsx"));

function RouteFallback() {
  return <p className="feedback">Хуудсыг ачааллаж байна...</p>;
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/artifacts/:slug" element={<ArtifactDetailPage />} />
        <Route path="/artifacts/new" element={<NewArtifactPage />} />
        <Route path="/reconstruction-lab" element={<ReconstructionLabPage />} />
      </Routes>
    </Suspense>
  );
}
