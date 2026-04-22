import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api/client.js";
import Layout from "../components/Layout.jsx";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [devLink, setDevLink] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    setDevLink("");
    setPreviewUrl("");
    setSubmitting(true);

    try {
      const response = await forgotPassword(email.trim());
      setMessage(response.message);
      if (response.devLink) setDevLink(response.devLink);
      if (response.previewUrl) setPreviewUrl(response.previewUrl);
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
            <h1>Нууц үгээ мартсан уу?</h1>
            <p>Бүртгэлтэй имэйлээ оруулна уу. Бид нэг удаагийн сэргээх холбоосыг тань руу илгээнэ.</p>
          </header>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="forgotEmail">Имэйл</label>
              <input
                id="forgotEmail"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="researcher@must.edu.mn"
                required
                autoComplete="email"
              />
            </div>

            <button type="submit" className="auth-submit" disabled={submitting}>
              {submitting ? "Илгээж байна..." : "Сэргээх холбоос илгээх"}
            </button>

            {message && <p className="feedback">{message}</p>}
            {devLink && (
              <p className="feedback">
                Dev линк: <a href={devLink} target="_blank" rel="noreferrer">{devLink}</a>
              </p>
            )}
            {previewUrl && (
              <p className="feedback">
                Имэйл preview: <a href={previewUrl} target="_blank" rel="noreferrer">{previewUrl}</a>
              </p>
            )}
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
