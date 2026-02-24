import { Users, UserCheck, Clock, UserX, TrendingUp, AlertTriangle } from 'lucide-react';
import { KPICard } from '../KPICard';
import { AttendanceChart } from '../AttendanceChart';
import { LateEmployeesTrendChart } from '../LateEmployeesTrendChart';

export function OverviewPage() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <KPICard
          title="Total Active Users Today"
          value="173"
          icon={Users}
          color="blue"
        />
        <KPICard
          title="Users Who Timed In"
          value="165"
          icon={UserCheck}
          color="green"
          trend={{ value: "95.4%", isPositive: true }}
        />
        <KPICard
          title="Users Not Timed In"
          value="8"
          icon={UserX}
          color="red"
        />
        <KPICard
          title="Late Users"
          value="23"
          icon={Clock}
          color="yellow"
        />
        <KPICard
          title="On-Time Users"
          value="142"
          icon={TrendingUp}
          color="green"
          trend={{ value: "86.1%", isPositive: true }}
        />
        <KPICard
          title="Location Violations"
          value="12"
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Visual Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceChart />
        <LateEmployeesTrendChart />
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-l-4 border-green-500 pl-4">
            <p className="text-sm text-gray-600">On-Time Rate</p>
            <p className="text-2xl font-semibold text-gray-900">86.1%</p>
            <p className="text-xs text-green-600 mt-1">↑ 2.3% from yesterday</p>
          </div>
          <div className="border-l-4 border-amber-500 pl-4">
            <p className="text-sm text-gray-600">Average Late Time</p>
            <p className="text-2xl font-semibold text-gray-900">12 min</p>
            <p className="text-xs text-amber-600 mt-1">↓ 3 min from yesterday</p>
          </div>
          <div className="border-l-4 border-blue-500 pl-4">
            <p className="text-sm text-gray-600">Location Compliance</p>
            <p className="text-2xl font-semibold text-gray-900">92.7%</p>
            <p className="text-xs text-blue-600 mt-1">12 violations detected</p>
          </div>
        </div>
      </div>
    </div>
  );
}
