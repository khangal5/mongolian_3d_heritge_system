import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import ArtifactDetailPage from "./pages/ArtifactDetailPage.jsx";
import ReconstructionLabPage from "./pages/ReconstructionLabPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import NewArtifactPage from "./pages/NewArtifactPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/artifacts/:slug" element={<ArtifactDetailPage />} />
      <Route path="/artifacts/new" element={<NewArtifactPage />} />
      <Route path="/reconstruction-lab" element={<ReconstructionLabPage />} />
    </Routes>
  );
}
