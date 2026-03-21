import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import ArtifactDetailPage from "./pages/ArtifactDetailPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/artifacts/:slug" element={<ArtifactDetailPage />} />
    </Routes>
  );
}

