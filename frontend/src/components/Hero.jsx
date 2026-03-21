export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">Дижитал хадгалалтын платформ</p>
        <h1>Монголын түүхэн өвийг хайлттай 3D веб орчинд танилцуулна.</h1>
        <p className="hero-text">
          Энэхүү MVP нь дипломын ажлын санааг бодит платформ болгон эхлүүлж байна.
          Түүхэн өвийн тайлбар, зураг, 3D үзүүлэнг нэг дор нэгтгэсэн орчин үеийн систем юм.
        </p>
      </div>

      <div className="hero-panel">
        <div className="stat-card">
          <span>Зорилтот хэрэглэгч</span>
          <strong>Судлаачид, оюутнууд, сонирхогчид</strong>
        </div>
        <div className="stat-card">
          <span>Гол модуль</span>
          <strong>Каталог, хайлт, дэлгэрэнгүй хуудас, 3D үзүүлэн</strong>
        </div>
        <div className="stat-card">
          <span>Дараагийн шат</span>
          <strong>Админ хяналт, бодит өгөгдлийн сан, газрын зураг</strong>
        </div>
      </div>
    </section>
  );
}
