import { useState } from "react";

const initialMotion = {
  rotateX: 0,
  rotateY: 0
};

export default function Hero() {
  const [motion, setMotion] = useState(initialMotion);

  function handlePointerMove(event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;

    setMotion({
      rotateX: Number(((0.5 - y) * 14).toFixed(2)),
      rotateY: Number(((x - 0.5) * 18).toFixed(2))
    });
  }

  function resetMotion() {
    setMotion(initialMotion);
  }

  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">3D · WebGL · Heritage</p>
        <h1>Монголын түүхэн өвийг 3D орчинд амьдруулна.</h1>
        <p className="hero-text">
          Эргүүлж үзэх 3D загвар, газарзүйн байршил болон ухаалаг хайлтыг нэг
          дэлгэц дээр нэгтгэсэн интерактив веб платформ.
        </p>

        <div className="hero-actions">
          <a href="#catalog" className="action-button">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            Дурсгал хайх
          </a>
          <a href="#overview" className="secondary-button hero-link">
            Платформын тойм
          </a>
        </div>

        <div className="hero-signal-row">
          <div className="hero-signal">
            <span>Viewer</span>
            <strong>Three.js WebGL канваст GLB / GLTF загвар</strong>
          </div>
          <div className="hero-signal">
            <span>Байршил</span>
            <strong>Leaflet газрын зураг · олдворын координат</strong>
          </div>
        </div>
      </div>

      <div className="hero-panel">
        <div
          className="hero-stage-shell"
          onPointerMove={handlePointerMove}
          onPointerLeave={resetMotion}
        >
          <div className="hero-stage-aura hero-stage-aura-one" />
          <div className="hero-stage-aura hero-stage-aura-two" />
          <div
            className="hero-stage"
            style={{
              "--stage-rotate-x": `${motion.rotateX}deg`,
              "--stage-rotate-y": `${motion.rotateY}deg`
            }}
          >
            <div className="hero-stage-grid" />
            <div className="hero-stage-ring hero-stage-ring-one" />
            <div className="hero-stage-ring hero-stage-ring-two" />
            <div className="hero-stage-base" />

            <div className="hero-stage-object">
              <div className="hero-stage-face hero-stage-face-front">
                <span>Interactive</span>
                <strong>3D</strong>
              </div>
              <div className="hero-stage-face hero-stage-face-side">GLB</div>
              <div className="hero-stage-face hero-stage-face-top">XR</div>
            </div>

            <div className="hero-floating-card hero-floating-card-one">
              <span>3D Viewer</span>
              <strong>Орбит, томруулах</strong>
            </div>
            <div className="hero-floating-card hero-floating-card-two">
              <span>Каталог</span>
              <strong>Олдворын мэдээлэл</strong>
            </div>
            <div className="hero-floating-card hero-floating-card-three">
              <span>Формат</span>
              <strong>GLB / GLTF</strong>
            </div>
          </div>
        </div>

        <div className="hero-stat-grid">
          <div className="stat-card">
            <span>01 — Explore</span>
            <strong>3D моделио эргүүлж, томруулж харах</strong>
          </div>
          <div className="stat-card">
            <span>02 — Search</span>
            <strong>Нэр, үе, аймаг, түлхүүр үгээр хайх</strong>
          </div>
          <div className="stat-card">
            <span>03 — Contribute</span>
            <strong>Судлаачийн эрхээр шинэ дурсгал нэмэх</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
