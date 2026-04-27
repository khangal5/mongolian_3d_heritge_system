import { Link } from "react-router-dom";

export default function ArtifactListItem({ artifact }) {
  return (
    <Link to={`/artifacts/${artifact.slug}`} className="artifact-list-row">
      <div className="artifact-list-thumb">
        <img src={artifact.imageUrl} alt={artifact.name} />
        <span className="artifact-list-3d">3D</span>
      </div>

      <div className="artifact-list-body">
        <div className="artifact-list-head">
          <h3>{artifact.nameMn || artifact.name}</h3>
          <span className="artifact-list-period">{artifact.period}</span>
        </div>
        <p className="artifact-list-desc">{artifact.shortDescription}</p>
        <div className="artifact-list-meta">
          <span>{artifact.category}</span>
          <span>·</span>
          <span>{artifact.province} аймаг{artifact.location ? `, ${artifact.location}` : ""}</span>
        </div>
        {artifact.tags && artifact.tags.length > 0 && (
          <div className="artifact-list-tags">
            {artifact.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="detail-tag">{tag}</span>
            ))}
          </div>
        )}
      </div>

      <div className="artifact-list-action">
        <span>Үзэх →</span>
      </div>
    </Link>
  );
}
