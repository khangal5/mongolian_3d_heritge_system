import { useState } from "react";
import { Link } from "react-router-dom";

export default function ArtifactListItem({ artifact }) {
  const [imageBroken, setImageBroken] = useState(false);
  const hasModel = Boolean(artifact.modelUrl);
  const showImage = artifact.imageUrl && !imageBroken;

  return (
    <Link to={`/artifacts/${artifact.slug}`} className="artifact-list-row">
      <div className="artifact-list-thumb">
        {showImage ? (
          <img
            src={artifact.imageUrl}
            alt={artifact.name}
            onError={() => setImageBroken(true)}
          />
        ) : (
          <div className="artifact-list-placeholder" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
        {hasModel && <span className="artifact-list-3d">3D</span>}
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
