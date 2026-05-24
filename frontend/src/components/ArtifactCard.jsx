import { useState } from "react";
import { Link } from "react-router-dom";

export default function ArtifactCard({ artifact }) {
  const [imageBroken, setImageBroken] = useState(false);
  const hasModel = Boolean(artifact.modelUrl);
  const showImage = artifact.imageUrl && !imageBroken;

  return (
    <article className="artifact-card">
      <div className="artifact-card-media">
        {showImage ? (
          <img
            src={artifact.imageUrl}
            alt={artifact.name}
            className="artifact-card-image"
            onError={() => setImageBroken(true)}
          />
        ) : (
          <div className="artifact-card-placeholder" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
        {hasModel && <span className="artifact-card-badge">3D Ready</span>}
        <div className="artifact-card-overlay">
          <span>{artifact.category}</span>
          <span>{artifact.period}</span>
        </div>
      </div>

      <div className="artifact-card-body">
        <div className="artifact-meta-row">
          <span>{artifact.province}</span>
          <span>{artifact.location}</span>
        </div>
        <h3>{artifact.nameMn || artifact.name}</h3>
        {artifact.name && artifact.name !== artifact.nameMn && (
          <p className="artifact-card-title-mn">{artifact.name}</p>
        )}
        <p>{artifact.shortDescription}</p>
        <div className="tag-row">
          {artifact.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
        <Link to={`/artifacts/${artifact.slug}`} className="primary-link">
          {hasModel ? "3D-ээр үзэх" : "Дэлгэрэнгүй"}
        </Link>
      </div>
    </article>
  );
}
