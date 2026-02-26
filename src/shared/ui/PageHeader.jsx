export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="hp-page-header">
      <div className="hp-page-header-copy">
        <h1>{title}</h1>
        {subtitle ? <p className="hp-page-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="hp-page-actions">{actions}</div> : null}
    </div>
  );
}
