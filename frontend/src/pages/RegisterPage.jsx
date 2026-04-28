import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { registerResearcher } from "../api/client.js";
import Layout from "../components/Layout.jsx";
import { validateCyrillicName } from "../utils/validators.js";

const initialRegister = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  organization: "",
  departmentName: "",
  positionTitle: "",
  phoneNumber: "",
  employeeCode: "",
  researchFocus: ""
};

function RequiredMark() {
  return <span className="required-mark" aria-hidden="true">*</span>;
}

export default function RegisterPage() {
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [proofImage, setProofImage] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState({});

  const passwordMismatch = useMemo(
    () =>
      registerForm.confirmPassword &&
      registerForm.password !== registerForm.confirmPassword,
    [registerForm.confirmPassword, registerForm.password]
  );

  const fullNameError = useMemo(
    () => (touched.fullName ? validateCyrillicName(registerForm.fullName) : null),
    [registerForm.fullName, touched.fullName]
  );

  const passwordTooShort =
    touched.password && registerForm.password && registerForm.password.length < 8;

  function handleField(name, value) {
    setRegisterForm((current) => ({ ...current, [name]: value }));
  }

  function markTouched(name) {
    setTouched((current) => ({ ...current, [name]: true }));
  }

  async function handleRegister(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
      organization: true,
      positionTitle: true
    });

    const nameError = validateCyrillicName(registerForm.fullName);
    if (nameError) {
      setError(nameError);
      return;
    }

    if (registerForm.password.length < 8) {
      setError("Нууц үг хамгийн багадаа 8 тэмдэгт байна.");
      return;
    }

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
      setTouched({});
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <Layout>
      <section className="auth-shell auth-shell-wide">
        <section className="auth-side">
          <p className="eyebrow">Бүртгүүлэх</p>
          <h1>Шинэ хэрэглэгчийн бүртгэл үүсгэнэ.</h1>
          <p className="hero-text">
            Үндсэн мэдээллээ оруулаад баталгаажуулах файлаа хавсаргана.
          </p>
          <div className="auth-note-list">
            <p>
              <span className="required-mark">*</span> тэмдэгтэй талбарууд заавал
              бөглөх ёстой.
            </p>
            <p>Овог нэрийг кирилл (монгол) үсгээр бичнэ.</p>
            <p>
              Зөвхөн албан имэйл хүлээн зөвшөөрнө (жишээ:{" "}
              <code>@must.edu.mn</code>, <code>@num.edu.mn</code>,{" "}
              <code>@mas.ac.mn</code>).
            </p>
            <p>Бүртгэл үүсэхэд имэйл рүү баталгаажуулах холбоос явагдана.</p>
          </div>
          <Link to="/login" className="secondary-link">
            Бүртгэлтэй хэрэглэгч нэвтрэх
          </Link>
        </section>

        <form className="auth-card auth-card-wide" onSubmit={handleRegister} noValidate>
          <div className="auth-card-header">
            <h2>Шинэ хэрэглэгч бүртгэх</h2>
            <p>Мэдээллээ бөглөөд бүртгэл үүсгэнэ.</p>
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="fullName">
                Овог нэр <RequiredMark />
              </label>
              <input
                id="fullName"
                value={registerForm.fullName}
                onChange={(e) => handleField("fullName", e.target.value)}
                onBlur={() => markTouched("fullName")}
                placeholder="Н.Хангал"
                aria-invalid={Boolean(fullNameError)}
                aria-describedby={fullNameError ? "fullName-error" : undefined}
                required
              />
              {fullNameError && (
                <p className="field-error" id="fullName-error">{fullNameError}</p>
              )}
            </div>
            <div className="field">
              <label htmlFor="email">
                Албан имэйл <RequiredMark />
              </label>
              <input
                id="email"
                type="email"
                value={registerForm.email}
                onChange={(e) => handleField("email", e.target.value)}
                onBlur={() => markTouched("email")}
                placeholder="khangal@must.edu.mn"
                required
              />
              <p className="field-help">
                Нэвтрэх ба баталгаажуулах имэйл. Зөвхөн @*.edu.mn / *.ac.mn / *.gov.mn.
              </p>
            </div>
            <div className="field">
              <label htmlFor="organization">
                Байгууллага <RequiredMark />
              </label>
              <input
                id="organization"
                value={registerForm.organization}
                onChange={(e) => handleField("organization", e.target.value)}
                onBlur={() => markTouched("organization")}
                placeholder="ШУТИС - МХТС"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="departmentName">Хэлтэс / лаборатори</label>
              <input
                id="departmentName"
                value={registerForm.departmentName}
                onChange={(e) => handleField("departmentName", e.target.value)}
                placeholder="Компьютерын ухааны тэнхим"
              />
            </div>
            <div className="field">
              <label htmlFor="positionTitle">
                Албан тушаал <RequiredMark />
              </label>
              <input
                id="positionTitle"
                value={registerForm.positionTitle}
                onChange={(e) => handleField("positionTitle", e.target.value)}
                onBlur={() => markTouched("positionTitle")}
                placeholder="Эрдэм шинжилгээний ажилтан"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="phoneNumber">Утасны дугаар</label>
              <input
                id="phoneNumber"
                value={registerForm.phoneNumber}
                onChange={(e) => handleField("phoneNumber", e.target.value)}
                placeholder="99112233"
              />
            </div>
            <div className="field">
              <label htmlFor="employeeCode">Ажилтны код / үнэмлэх №</label>
              <input
                id="employeeCode"
                value={registerForm.employeeCode}
                onChange={(e) => handleField("employeeCode", e.target.value)}
                placeholder="D071405-001"
              />
            </div>
            <div className="field">
              <label htmlFor="password">
                Нууц үг <RequiredMark />
              </label>
              <input
                id="password"
                type="password"
                value={registerForm.password}
                onChange={(e) => handleField("password", e.target.value)}
                onBlur={() => markTouched("password")}
                placeholder="Хамгийн багадаа 8 тэмдэгт"
                minLength={8}
                required
              />
              {passwordTooShort && (
                <p className="field-error">Нууц үг 8-аас доош тэмдэгт байж болохгүй</p>
              )}
            </div>
            <div className="field">
              <label htmlFor="confirmPassword">
                Нууц үг давтах <RequiredMark />
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={registerForm.confirmPassword}
                onChange={(e) => handleField("confirmPassword", e.target.value)}
                onBlur={() => markTouched("confirmPassword")}
                placeholder="Дээрх нууц үгээ давтан оруулна уу"
                required
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="researchFocus">Судалгааны чиглэл</label>
            <textarea
              id="researchFocus"
              rows="4"
              value={registerForm.researchFocus}
              onChange={(e) => handleField("researchFocus", e.target.value)}
              placeholder="Археологи, хадны зураг, чулуун бичээс, 3D баримтжуулалт..."
            />
          </div>

          <div className="field">
            <label htmlFor="proofImage">
              Баталгаажуулах зураг <RequiredMark />
            </label>
            <input
              id="proofImage"
              type="file"
              accept="image/*,.pdf"
              onChange={(event) => setProofImage(event.target.files?.[0] || null)}
              required
            />
            <p className="field-help">
              Байгууллагын үнэмлэх эсвэл албан тушаалыг гэрчлэх PDF/зураг.
            </p>
          </div>

          {passwordMismatch && (
            <p className="field-error">Нууц үг давтан оруулсан утгатай таарахгүй байна.</p>
          )}
          {proofImage && (
            <div className="selected-files">
              <span>{proofImage.name}</span>
            </div>
          )}

          <button
            type="submit"
            className="action-button"
            disabled={passwordMismatch || Boolean(fullNameError) || passwordTooShort}
          >
            Бүртгэл үүсгэх
          </button>

          {message && <p className="feedback">{message}</p>}
          {error && <p className="feedback error">{error}</p>}
        </form>
      </section>
    </Layout>
  );
}