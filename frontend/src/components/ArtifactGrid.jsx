import ArtifactCard from "./ArtifactCard.jsx";
import ArtifactListItem from "./ArtifactListItem.jsx";

export default function ArtifactGrid({ artifacts, hideHeader = false, view = "grid" }) {
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
      {!hideHeader && (
        <section className="section-heading">
          <div>
            <p className="eyebrow">Хайлтын үр дүн</p>
            <h2>Олдворууд</h2>
          </div>
          <strong>{artifacts.length} олдвор</strong>
        </section>
      )}

      {view === "list" ? (
        <section className="artifact-list">
          {artifacts.map((artifact) => (
            <ArtifactListItem key={artifact.id} artifact={artifact} />
          ))}
        </section>
      ) : (
        <section className="artifact-grid">
          {artifacts.map((artifact) => (
            <ArtifactCard key={artifact.id} artifact={artifact} />
          ))}
        </section>
      )}
    </>
  );
}
