import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, login } from "../api/client.js";
import { setStoredAuth } from "../auth.js";
import AuthLayout from "../components/AuthLayout.jsx";

const initialLogin = {
  email: "",
  password: ""
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const response = await login(loginForm);
      setStoredAuth(response);
      const { user } = await getCurrentUser();
      const next = response.user?.role === "admin"
        ? "/admin/queue"
        : "/dashboard";
      // soft navigation to refresh layout sidebar state
      window.location.href = next;
      void user;
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  }

  const sideBullets = (
    <ul className="auth-bullets">
      <li>Нэвтэрсэн судлаач шинэ дурсгал нэмэх, илгээх боломжтой.</li>
      <li>Админ оруулсан мэдээллийг шалгаж, баталгаажуулна.</li>
      <li>Session 24 цаг хүчинтэй, нэвтрэлт хамгаалагдсан cookie-р дамжина.</li>
    </ul>
  );

  return (
    <AuthLayout
      title="Тавтай морилно уу"
      subtitle="Бүртгэлтэй хэрэглэгч нэвтэрч үргэлжлүүлнэ үү."
      side={sideBullets}
    >
      <form className="auth-form" onSubmit={handleLogin}>
        <div className="auth-form-header">
          <h2>Нэвтрэх</h2>
          <p>Имэйл болон нууц үгээ оруулна уу.</p>
        </div>

        <div className="field">
          <label htmlFor="loginEmail">Имэйл</label>
          <input
            id="loginEmail"
            type="email"
            value={loginForm.email}
            onChange={(event) =>
              setLoginForm((current) => ({ ...current, email: event.target.value }))
            }
            placeholder="researcher@must.edu.mn"
            required
            autoComplete="email"
          />
        </div>

        <div className="field">
          <label htmlFor="loginPassword">Нууц үг</label>
          <input
            id="loginPassword"
            type="password"
            value={loginForm.password}
            onChange={(event) =>
              setLoginForm((current) => ({ ...current, password: event.target.value }))
            }
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>

        <div className="auth-form-row">
          <Link to="/forgot-password" className="auth-secondary-link">
            Нууц үгээ мартсан уу?
          </Link>
        </div>

        <button type="submit" className="auth-submit" disabled={busy}>
          {busy ? "Нэвтэрч байна..." : "Нэвтрэх"}
        </button>

        {error && <p className="feedback error">{error}</p>}

        <p className="auth-form-footer">
          Бүртгэлгүй юу? <Link to="/register">Шинэ бүртгэл үүсгэх</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
