import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export default function StatCard({
  title,
  value,
  change,
  description,
  icon: Icon,
  type = "blue",
}) {
  const isPositive = change?.startsWith("+");

  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div className={`stat-icon stat-icon-${type}`}>
          <Icon size={18} />
        </div>

        <span className={`stat-change ${isPositive ? "positive" : "negative"}`}>
          {isPositive ? (
            <ArrowUpRight size={13} />
          ) : (
            <ArrowDownRight size={13} />
          )}

          {change}
        </span>
      </div>

      <div className="stat-value">{value}</div>

      <div className="stat-title">{title}</div>

      <div className="stat-description">{description}</div>
    </div>
  );
}