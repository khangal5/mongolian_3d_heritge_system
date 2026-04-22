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
      <section className="auth-utility-shell">
        <div className="auth-utility-card">
          <header className="auth-utility-header">
            <span className="auth-side-mark">◆</span>
            <h1>Шинэ нууц үг тохируулах</h1>
            <p>Шинэ нууц үгээ оруулна уу. Идэвхтэй бүх session устгагдаж, та шинээр нэвтрэх шаардлагатай болно.</p>
          </header>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="newPassword">Шинэ нууц үг</label>
              <input
                id="newPassword"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Хамгийн багадаа 8 тэмдэгт"
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
                placeholder="Дээрх нууц үгээ давтан оруулна уу"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>

            <button type="submit" className="auth-submit" disabled={submitting || !token}>
              {submitting ? "Хадгалж байна..." : "Нууц үг шинэчлэх"}
            </button>

            {message && <p className="feedback">{message}</p>}
            {error && <p className="feedback error">{error}</p>}

            <p className="auth-form-footer">
              <Link to="/login">← Нэвтрэх хуудас руу буцах</Link>
            </p>
          </form>
        </div>
      </section>
    </Layout>
  );
}
