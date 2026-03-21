import { Link } from "react-router-dom";

export default function ArtifactCard({ artifact }) {
  return (
    <article className="artifact-card">
      <img src={artifact.imageUrl} alt={artifact.name} className="artifact-card-image" />
      <div className="artifact-card-body">
        <div className="artifact-meta-row">
          <span>{artifact.category}</span>
          <span>{artifact.province}</span>
        </div>
        <h3>{artifact.name}</h3>
        <p className="artifact-card-title-mn">{artifact.nameMn}</p>
        <p>{artifact.shortDescription}</p>
        <div className="tag-row">
          {artifact.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
        <Link to={`/artifacts/${artifact.slug}`} className="primary-link">
          Дэлгэрэнгүй үзэх
        </Link>
      </div>
    </article>
  );
}
