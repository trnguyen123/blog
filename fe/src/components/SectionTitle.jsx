export default function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {subtitle && <p className="text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
