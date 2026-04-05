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
      rotateX: Number(((0.5 - y) * 16).toFixed(2)),
      rotateY: Number(((x - 0.5) * 20).toFixed(2))
    });
  }

  function resetMotion() {
    setMotion(initialMotion);
  }

  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">3D Өвийн Сан</p>
        <h1>Монголын түүхэн өвийг 3D орчинд үзэх веб платформ.</h1>
        <p className="hero-text">
          Дурсгалын мэдээлэл, зураг, 3D моделио нэг дороос үзэж, хайж, удирдана.
        </p>

        <div className="hero-actions">
          <a href="#catalog" className="action-button">
            Каталог руу орох
          </a>
          <a href="#overview" className="secondary-link hero-link">
            Платформын тойм
          </a>
        </div>

        <div className="hero-signal-row">
          <div className="hero-signal">
            <span>Үндсэн хэсэг</span>
            <strong>Каталог ба 3D үзүүлэн</strong>
          </div>
          <div className="hero-signal">
            <span>Зорилго</span>
            <strong>Ойлгомжтой, цэвэр, орчин үеийн интерфэйс</strong>
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
              <strong>Эргүүлж үзэх</strong>
            </div>
            <div className="hero-floating-card hero-floating-card-two">
              <span>Каталог</span>
              <strong>Дурсгалын мэдээлэл</strong>
            </div>
            <div className="hero-floating-card hero-floating-card-three">
              <span>Файл</span>
              <strong>GLB / GLTF</strong>
            </div>
          </div>
        </div>

        <div className="hero-stat-grid">
          <div className="stat-card">
            <span>Харах</span>
            <strong>3D моделио шууд үзэх</strong>
          </div>
          <div className="stat-card">
            <span>Хайх</span>
            <strong>Ангилал, аймаг, нэрээр шүүх</strong>
          </div>
          <div className="stat-card">
            <span>Нэмэх</span>
            <strong>Шинэ дурсгал, 3D файл бүртгэх</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
