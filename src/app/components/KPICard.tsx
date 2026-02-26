import { BarChart3, LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  onBreakdownClick?: () => void;
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  yellow: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
};

export function KPICard({ title, value, icon: Icon, trend, color, onBreakdownClick }: KPICardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-2">{title}</p>
          <p className="text-3xl font-semibold text-gray-900">{value}</p>
          {onBreakdownClick && (
            <button
              type="button"
              onClick={onBreakdownClick}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-[#1F4FD8] transition-colors hover:border-blue-300 hover:bg-blue-100 hover:text-[#1845b8] focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Breakdown
            </button>
          )}
          {trend && (
            <p className={`text-xs mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '+' : '-'} {trend.value}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6 stroke-[2.25]" />
        </div>
      </div>
    </div>
  );
}
