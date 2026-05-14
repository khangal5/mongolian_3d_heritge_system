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
      <section className="auth-shell">
        <section className="auth-side">
          <p className="eyebrow">Нууц үг сэргээх</p>
          <h1>Нууц үгээ мартсан уу?</h1>
          <p className="hero-text">
            Бүртгэлтэй имэйлээ оруулна уу. Бид нууц үг сэргээх холбоосыг тань руу илгээнэ.
          </p>
          <Link to="/login" className="secondary-link">
            Нэвтрэх хуудас руу буцах
          </Link>
        </section>

        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="auth-card-header">
            <h2>Сэргээх холбоос авах</h2>
            <p>Бүртгэлтэй имэйлээ оруулна.</p>
          </div>

          <div className="field">
            <label htmlFor="forgotEmail">Имэйл</label>
            <input
              id="forgotEmail"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="researcher@example.mn"
              required
            />
          </div>

          <button type="submit" className="action-button" disabled={submitting}>
            {submitting ? "Илгээж байна..." : "Сэргээх холбоос илгээх"}
          </button>

          {message && <p className="feedback">{message}</p>}
          {devLink && (
            <p className="feedback">
              Dev линк:{" "}
              <a href={devLink} target="_blank" rel="noreferrer">
                {devLink}
              </a>
            </p>
          )}
          {previewUrl && (
            <p className="feedback">
              Имэйл preview:{" "}
              <a href={previewUrl} target="_blank" rel="noreferrer">
                {previewUrl}
              </a>
            </p>
          )}
          {error && <p className="feedback error">{error}</p>}
        </form>
      </section>
    </Layout>
  );
}
