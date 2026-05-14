import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/client.js";
import Layout from "../components/Layout.jsx";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => params.get("token") || "", [params]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!token) {
      setError("Холбоос буруу байна. Имэйлээс ирсэн линкээр нэвтэрнэ үү.");
      return;
    }

    if (password.length < 8) {
      setError("Шинэ нууц үг хамгийн багадаа 8 тэмдэгт байна");
      return;
    }

    if (password !== confirmPassword) {
      setError("Нууц үг таарахгүй байна");
      return;
    }

    setSubmitting(true);
    try {
      const response = await resetPassword(token, password);
      setMessage(response.message);
      setTimeout(() => navigate("/login"), 1500);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout>
      <section className="auth-shell">
        <section className="auth-side">
          <p className="eyebrow">Шинэ нууц үг</p>
          <h1>Нууц үгээ шинэчлэх</h1>
          <p className="hero-text">
            Шинэ нууц үгээ оруулна уу. Хуучин бүх төхөөрөмжөөс автоматаар гарна.
          </p>
          <Link to="/login" className="secondary-link">
            Нэвтрэх хуудас руу буцах
          </Link>
        </section>

        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="auth-card-header">
            <h2>Шинэ нууц үг</h2>
            <p>Хамгийн багадаа 8 тэмдэгт байна.</p>
          </div>

          <div className="field">
            <label htmlFor="newPassword">Шинэ нууц үг</label>
            <input
              id="newPassword"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>
          <div className="field">
            <label htmlFor="confirmPassword">Нууц үг давтах</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>

          <button type="submit" className="action-button" disabled={submitting || !token}>
            {submitting ? "Хадгалж байна..." : "Нууц үг шинэчлэх"}
          </button>

          {message && <p className="feedback">{message}</p>}
          {error && <p className="feedback error">{error}</p>}
        </form>
      </section>
    </Layout>
  );
}
