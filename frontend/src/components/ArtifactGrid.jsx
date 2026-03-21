import ArtifactCard from "./ArtifactCard.jsx";

export default function ArtifactGrid({ artifacts }) {
  if (!artifacts.length) {
    return (
      <section className="empty-state">
        <h2>Таны хайлтанд тохирох өвийн бүртгэл олдсонгүй.</h2>
        <p>Өөр түлхүүр үг эсвэл өөр ангилал, аймгийн шүүлтүүр сонгож үзнэ үү.</p>
      </section>
    );
  }

  return (
    <section className="artifact-grid">
      {artifacts.map((artifact) => (
        <ArtifactCard key={artifact.id} artifact={artifact} />
      ))}
    </section>
  );
}
