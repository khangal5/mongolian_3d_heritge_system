import { useState } from "react";
import { Link } from "react-router-dom";
import { getCurrentUser, login } from "../api/client.js";
import { setStoredAuth } from "../auth.js";
import Layout from "../components/Layout.jsx";

const initialLogin = {
  email: "",
  password: ""
};

export default function LoginPage() {
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await login(loginForm);
      setStoredAuth(response);
      await getCurrentUser();
      setMessage("Амжилттай нэвтэрлээ.");
      window.location.href = "/artifacts/new";
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <Layout>
      <section className="auth-shell">
        <section className="auth-side">
          <p className="eyebrow">Нэвтрэх</p>
          <h1>Бүртгэлтэй хэрэглэгч нэвтэрнэ.</h1>
          <p className="hero-text">
            Нэвтэрсний дараа шинэ дурсгал болон 3D файл нэмэх боломжтой.
          </p>
          <div className="auth-note-list">
            <p>Зөвхөн нэвтэрсэн хэрэглэгч шинэ дурсгал нэмнэ.</p>
            <p>Бүртгэлгүй бол шинэ хэрэглэгч үүсгэнэ.</p>
          </div>
          <Link to="/register" className="secondary-link">
            Шинэ бүртгэл үүсгэх
          </Link>
        </section>

        <form className="auth-card" onSubmit={handleLogin}>
          <div className="auth-card-header">
            <h2>Нэвтрэх</h2>
            <p>Имэйл болон нууц үгээ оруулна.</p>
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
              placeholder="researcher@example.mn"
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
              placeholder="Нууц үг"
            />
          </div>

          <button type="submit" className="action-button">
            Нэвтрэх
          </button>

          {message && <p className="feedback">{message}</p>}
          {error && <p className="feedback error">{error}</p>}
        </form>
      </section>
    </Layout>
  );
}
