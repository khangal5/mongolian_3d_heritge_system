import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { registerResearcher } from "../api/client.js";
import AuthLayout from "../components/AuthLayout.jsx";
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
  const [busy, setBusy] = useState(false);

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

    setBusy(true);
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
    } finally {
      setBusy(false);
    }
  }

  const sideBullets = (
    <ul className="auth-bullets">
      <li>Зөвхөн албан имэйл (<code>.edu.mn</code>, <code>.ac.mn</code>, <code>.gov.mn</code>).</li>
      <li>Овог нэрийг кирилл үсгээр бичнэ.</li>
      <li>Бүртгэл үүссэний дараа имэйл рүү баталгаажуулах холбоос явагдана.</li>
      <li>Админ хавсаргасан баримтыг шалгаж эрх олгоно.</li>
    </ul>
  );

  return (
    <AuthLayout
      title="Шинэ хэрэглэгчийн бүртгэл"
      subtitle="Судлаачийн эрхтэй хэрэглэгч болохын тулд мэдээллээ бөглөнө үү."
      side={sideBullets}
    >
      <form className="auth-form auth-form-wide" onSubmit={handleRegister} noValidate>
        <div className="auth-form-header">
          <h2>Бүртгүүлэх</h2>
          <p><RequiredMark /> тэмдэгтэй талбарууд заавал бөглөх ёстой.</p>
        </div>

        <div className="auth-form-grid">
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
              autoComplete="email"
            />
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
            <label htmlFor="departmentName">Хэлтэс / тэнхим</label>
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

          <div className="field auth-form-grid-full">
            <label htmlFor="researchFocus">Судалгааны чиглэл</label>
            <textarea
              id="researchFocus"
              rows="3"
              value={registerForm.researchFocus}
              onChange={(e) => handleField("researchFocus", e.target.value)}
              placeholder="Археологи, хадны зураг, чулуун бичээс, 3D баримтжуулалт..."
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
              autoComplete="new-password"
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
              placeholder="Дээрх нууц үгийг давтан оруулна уу"
              required
              autoComplete="new-password"
            />
            {passwordMismatch && (
              <p className="field-error">Нууц үг таарахгүй байна.</p>
            )}
          </div>

          <div className="field auth-form-grid-full">
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
            {proofImage && (
              <div className="selected-file-pill">{proofImage.name}</div>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="auth-submit"
          disabled={busy || passwordMismatch || Boolean(fullNameError) || passwordTooShort}
        >
          {busy ? "Илгээж байна..." : "Бүртгэл үүсгэх"}
        </button>

        {message && <p className="feedback">{message}</p>}
        {error && <p className="feedback error">{error}</p>}

        <p className="auth-form-footer">
          Бүртгэлтэй юу? <Link to="/login">Нэвтрэх</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
