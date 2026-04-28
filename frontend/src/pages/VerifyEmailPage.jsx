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
      <section className="auth-shell">
        <section className="auth-card auth-card-narrow">
          <div className="auth-card-header">
            <p className="eyebrow">Имэйл баталгаажуулалт</p>
            <h2>
              {status === "loading" && "Шалгаж байна..."}
              {status === "success" && "Амжилттай баталгаажлаа"}
              {status === "error" && "Баталгаажуулж чадсангүй"}
            </h2>
          </div>

          {status === "loading" && (
            <p className="feedback">Таны баталгаажуулах холбоосыг шалгаж байна...</p>
          )}

          {status === "success" && (
            <>
              <p className="feedback">{message}</p>
              {isAuthed ? (
                <Link
                  to="/dashboard"
                  className="action-button"
                  style={{ display: "inline-flex" }}
                >
                  Самбар руу
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="action-button"
                  style={{ display: "inline-flex" }}
                >
                  Нэвтрэх хуудас руу
                </Link>
              )}
            </>
          )}

          {status === "error" && (
            <>
              <p className="feedback error">{message}</p>
              {isAuthed ? (
                <Link to="/dashboard" className="ghost-button">
                  Самбар руу
                </Link>
              ) : (
                <Link to="/login" className="ghost-button">
                  Нэвтрэх хуудас руу
                </Link>
              )}
            </>
          )}
        </section>
      </section>
    </Layout>
  );
}