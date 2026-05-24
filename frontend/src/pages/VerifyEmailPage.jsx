import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getCurrentUser, verifyEmail } from "../api/client.js";
import { getStoredAuth, updateStoredUser } from "../auth.js";
import Layout from "../components/Layout.jsx";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [isAuthed, setIsAuthed] = useState(() =>
    typeof window === "undefined" ? false : Boolean(getStoredAuth()?.user)
  );

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Баталгаажуулах токен URL дээр байхгүй байна.");
      return;
    }

    let ignore = false;
    setStatus("loading");

    verifyEmail(token)
      .then(async (response) => {
        if (ignore) return;
        setMessage(response.message || "Имэйл амжилттай баталгаажлаа.");
        setStatus("success");

        if (getStoredAuth()?.user) {
          try {
            const { user } = await getCurrentUser();
            updateStoredUser(user);
            setIsAuthed(true);
          } catch {
            // session might have expired; fall through
          }
        }
      })
      .catch((error) => {
        if (ignore) return;
        setMessage(error.message);
        setStatus("error");
      });

    return () => {
      ignore = true;
    };
  }, [token]);

  return (
    <Layout>
      <section className="auth-utility-shell">
        <div className="auth-utility-card auth-utility-card-narrow">
          <header className="auth-utility-header">
            <span className={`auth-utility-icon ${status === "success" ? "ok" : status === "error" ? "fail" : ""}`}>
              {status === "success" ? "✓" : status === "error" ? "✕" : "✉"}
            </span>
            <h1>
              {status === "loading" && "Шалгаж байна..."}
              {status === "success" && "Имэйл баталгаажлаа"}
              {status === "error" && "Баталгаажуулж чадсангүй"}
              {status === "idle" && "Имэйл баталгаажуулалт"}
            </h1>
            {message && <p>{message}</p>}
          </header>

          <div className="auth-form">
            {status === "loading" && (
              <p className="feedback">Таны баталгаажуулах холбоосыг шалгаж байна...</p>
            )}
            {status === "success" && (
              <Link
                to={isAuthed ? "/dashboard" : "/login"}
                className="auth-submit"
                style={{ display: "block", textAlign: "center", textDecoration: "none" }}
              >
                {isAuthed ? "Самбар руу шилжих" : "Нэвтрэх хуудас руу"}
              </Link>
            )}
            {status === "error" && (
              <Link
                to={isAuthed ? "/dashboard" : "/login"}
                className="auth-submit"
                style={{ display: "block", textAlign: "center", textDecoration: "none" }}
              >
                {isAuthed ? "Самбар руу буцах" : "Нэвтрэх хуудас руу"}
              </Link>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
