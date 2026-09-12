import type { ReactNode } from 'react';
import { ArrowUpRight, ChevronRight } from 'lucide-react';

export function SectionHeading({
  title,
  aside,
  onClick,
}: {
  title: string;
  aside?: string;
  onClick?: () => void;
}) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      {aside && (
        <button className="text-button" onClick={onClick}>
          {aside}
          <ArrowUpRight size={15} />
        </button>
      )}
    </div>
  );
}
export function AssetIcon({ text, color }: { text: string; color: string }) {
  return <span className={`asset-icon ${color}`}>{text}</span>;
}
export function EmptyState({
  icon,
  title,
  text,
}: {
  icon?: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="empty-state">
      {icon}
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
export function MetricCard({
  label,
  value,
  detail,
  icon,
  onClick,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button className="metric-card" onClick={onClick}>
      <span className="metric-top">
        {icon}
        <ChevronRight size={18} />
      </span>
      <span className="muted">{label}</span>
      <strong>{value}</strong>
      <span className="metric-detail">{detail}</span>
    </button>
  );
}
