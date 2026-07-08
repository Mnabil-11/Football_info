interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  /** Tailwind text color class for the value, e.g. "text-green-600". */
  accent?: string;
}

const StatCard = ({ label, value, icon, accent = 'text-gray-900' }: StatCardProps) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
    {icon && <div className="text-2xl mb-1">{icon}</div>}
    <div className={`text-3xl font-bold ${accent}`}>{value}</div>
    <div className="text-xs text-gray-500 mt-1">{label}</div>
  </div>
);

export default StatCard;
