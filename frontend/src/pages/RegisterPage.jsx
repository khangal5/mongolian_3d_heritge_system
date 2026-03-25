import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { registerResearcher } from "../api/client.js";
import Layout from "../components/Layout.jsx";

const initialRegister = {
  fullName: "",
  email: "",
  institutionEmail: "",
  password: "",
  confirmPassword: "",
  organization: "",
  departmentName: "",
  positionTitle: "",
  phoneNumber: "",
  employeeCode: "",
  researchFocus: ""
};

export default function RegisterPage() {
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [proofImage, setProofImage] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const passwordMismatch = useMemo(
    () =>
      registerForm.confirmPassword &&
      registerForm.password !== registerForm.confirmPassword,
    [registerForm.confirmPassword, registerForm.password]
  );

  async function handleRegister(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (passwordMismatch) {
      setError("Нууц үг давтан оруулсан утгатай таарахгүй байна.");
      return;
    }

    if (!proofImage) {
      setError("Байгууллагын үнэмлэх эсвэл баталгаажуулах зураг шаардлагатай.");
      return;
    }

    const payload = new FormData();
    Object.entries(registerForm).forEach(([key, value]) => {
      if (key !== "confirmPassword") {
        payload.set(key, value);
      }
    });
    payload.set("proofImage", proofImage);

    try {
      const response = await registerResearcher(payload);
      setMessage(response.message);
      setRegisterForm(initialRegister);
      setProofImage(null);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <Layout>
      <section className="auth-shell auth-shell-wide">
        <section className="auth-side">
          <p className="eyebrow">Шинэ бүртгэл</p>
          <h1>Судлаачийн профайлыг илүү бүрэн мэдээлэлтэй үүсгэнэ.</h1>
          <p className="hero-text">
            Энд байгууллагын харьяалал, албан тушаал, байгууллагын имэйл, баталгаажуулах
            баримтын зураг зэрэг талбаруудыг бөглөснөөр илүү бодит судлаачийн бүртгэлийн
            туршилт хийх боломжтой.
          </p>
          <div className="auth-note-list">
            <p>Байгууллагын имэйл болон хувийн нэвтрэх имэйл тусдаа байж болно.</p>
            <p>Ажилтны үнэмлэх, судлаачийн карт, эсвэл байгууллагын баталгааны зураг оруулна.</p>
            <p>Бүртгэл үүссэний дараа шууд нэвтэрч орж дурсгал нэмэх боломжтой.</p>
          </div>
          <Link to="/login" className="secondary-link">
            Бүртгэлтэй хэрэглэгч нэвтрэх
          </Link>
        </section>

        <form className="auth-card auth-card-wide" onSubmit={handleRegister}>
          <div className="auth-card-header">
            <h2>Шинэ хэрэглэгч бүртгэх</h2>
            <p>Судалгааны байгууллагын харьяалал, баталгаажуулах мэдээллээ бөглөнө үү.</p>
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="fullName">Овог нэр</label>
              <input id="fullName" value={registerForm.fullName} onChange={(e) => setRegisterForm((c) => ({ ...c, fullName: e.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="email">Нэвтрэх имэйл</label>
              <input id="email" type="email" value={registerForm.email} onChange={(e) => setRegisterForm((c) => ({ ...c, email: e.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="institutionEmail">Байгууллагын имэйл</label>
              <input id="institutionEmail" type="email" value={registerForm.institutionEmail} onChange={(e) => setRegisterForm((c) => ({ ...c, institutionEmail: e.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="organization">Байгууллага</label>
              <input id="organization" value={registerForm.organization} onChange={(e) => setRegisterForm((c) => ({ ...c, organization: e.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="departmentName">Хэлтэс / лаборатори</label>
              <input id="departmentName" value={registerForm.departmentName} onChange={(e) => setRegisterForm((c) => ({ ...c, departmentName: e.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="positionTitle">Албан тушаал</label>
              <input id="positionTitle" value={registerForm.positionTitle} onChange={(e) => setRegisterForm((c) => ({ ...c, positionTitle: e.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="phoneNumber">Утасны дугаар</label>
              <input id="phoneNumber" value={registerForm.phoneNumber} onChange={(e) => setRegisterForm((c) => ({ ...c, phoneNumber: e.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="employeeCode">Ажилтны код / үнэмлэх №</label>
              <input id="employeeCode" value={registerForm.employeeCode} onChange={(e) => setRegisterForm((c) => ({ ...c, employeeCode: e.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="password">Нууц үг</label>
              <input id="password" type="password" value={registerForm.password} onChange={(e) => setRegisterForm((c) => ({ ...c, password: e.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="confirmPassword">Нууц үг давтах</label>
              <input id="confirmPassword" type="password" value={registerForm.confirmPassword} onChange={(e) => setRegisterForm((c) => ({ ...c, confirmPassword: e.target.value }))} />
            </div>
          </div>

          <div className="field">
            <label htmlFor="researchFocus">Судалгааны чиглэл</label>
            <textarea id="researchFocus" rows="4" value={registerForm.researchFocus} onChange={(e) => setRegisterForm((c) => ({ ...c, researchFocus: e.target.value }))} placeholder="Археологи, хадны зураг, чулуун бичээс, 3D баримтжуулалт гэх мэт" />
          </div>

          <div className="field">
            <label htmlFor="proofImage">Баталгаажуулах зураг</label>
            <input
              id="proofImage"
              type="file"
              accept="image/*,.pdf"
              onChange={(event) => setProofImage(event.target.files?.[0] || null)}
            />
            <p className="field-help">
              Байгууллагын үнэмлэх, ажилтны карт, эсвэл таны харьяаллыг нотлох зураг/PDF файл.
            </p>
          </div>

          {passwordMismatch && (
            <p className="feedback error">Нууц үг давтан оруулсан утгатай таарахгүй байна.</p>
          )}
          {proofImage && (
            <div className="selected-files">
              <span>{proofImage.name}</span>
            </div>
          )}

          <button type="submit" className="action-button" disabled={passwordMismatch}>
            Бүртгэл үүсгэх
          </button>

          {message && <p className="feedback">{message}</p>}
          {error && <p className="feedback error">{error}</p>}
        </form>
      </section>
    </Layout>
  );
}
