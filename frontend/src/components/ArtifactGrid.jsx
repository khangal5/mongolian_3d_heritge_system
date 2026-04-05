import ArtifactCard from "./ArtifactCard.jsx";

export default function ArtifactGrid({ artifacts }) {
  if (!artifacts.length) {
    return (
      <section className="empty-state">
        <h2>Илэрц олдсонгүй.</h2>
        <p>Өөр түлхүүр үг эсвэл шүүлт сонгоод дахин хайна уу.</p>
      </section>
    );
  }

  return (
    <>
      <section className="section-heading">
        <div>
          <p className="eyebrow">Хайлтын үр дүн</p>
          <h2>Олдворууд</h2>
        </div>
        <strong>{artifacts.length} олдвор</strong>
      </section>

      <section className="artifact-grid">
        {artifacts.map((artifact) => (
          <ArtifactCard key={artifact.id} artifact={artifact} />
        ))}
      </section>
    </>
  );
}
