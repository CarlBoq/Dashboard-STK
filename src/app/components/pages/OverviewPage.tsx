import { useMemo, useState } from 'react';
import { Users, UserCheck, Clock, UserX, TrendingUp, AlertTriangle } from 'lucide-react';
import { KPICard } from '../KPICard';
import { AttendanceChart } from '../AttendanceChart';
import { LateEmployeesTrendChart } from '../LateEmployeesTrendChart';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { sortBreakdownRows, sumBreakdownValues } from '../../utils/timekeeping';

interface UserAttendanceSummary {
  id: string;
  name: string;
  timedIn: boolean;
  lateMinutes: number;
  totalHours: number;
  locationViolation: boolean;
}

interface KpiBreakdownRow {
  userName: string;
  value: number;
  secondaryInfo: string;
}

interface KpiCardConfig {
  id: string;
  title: string;
  value: number;
  icon: typeof Users;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  trend?: {
    value: string;
    isPositive: boolean;
  };
  breakdownRows: KpiBreakdownRow[];
}

const attendanceSnapshot: UserAttendanceSummary[] = [
  { id: 'u1', name: 'Sarah Johnson', timedIn: true, lateMinutes: 0, totalHours: 8.1, locationViolation: false },
  { id: 'u2', name: 'Michael Chen', timedIn: true, lateMinutes: 15, totalHours: 7.4, locationViolation: false },
  { id: 'u3', name: 'Emily Rodriguez', timedIn: true, lateMinutes: 35, totalHours: 6.7, locationViolation: true },
  { id: 'u4', name: 'David Park', timedIn: true, lateMinutes: 0, totalHours: 7.2, locationViolation: false },
  { id: 'u5', name: 'Jessica Williams', timedIn: true, lateMinutes: 0, totalHours: 7.0, locationViolation: false },
  { id: 'u6', name: 'Robert Martinez', timedIn: false, lateMinutes: 0, totalHours: 0, locationViolation: false },
  { id: 'u7', name: 'Amanda Thompson', timedIn: true, lateMinutes: 8, totalHours: 7.8, locationViolation: false },
  { id: 'u8', name: 'Kevin Ramos', timedIn: true, lateMinutes: 0, totalHours: 8.0, locationViolation: true },
];

const toHoursLabel = (hours: number) => `${hours.toFixed(1)}h`;

export function OverviewPage() {
  const [selectedKpiId, setSelectedKpiId] = useState<string | null>(null);
  const [isBreakdownLoading, setIsBreakdownLoading] = useState(false);

  const kpiCards = useMemo<KpiCardConfig[]>(() => {
    const totalWorkedHours = attendanceSnapshot.reduce((sum, user) => sum + user.totalHours, 0);
    const activeUsersRows = attendanceSnapshot.map((user) => ({
      userName: user.name,
      value: Number(user.totalHours.toFixed(1)),
      secondaryInfo: `Worked ${toHoursLabel(user.totalHours)} today`,
    }));
    const timedInRows = attendanceSnapshot
      .filter((user) => user.timedIn)
      .map((user) => ({
        userName: user.name,
        value: 1,
        secondaryInfo: `Checked in | ${toHoursLabel(user.totalHours)} productive hours`,
      }));
    const notTimedInRows = attendanceSnapshot
      .filter((user) => !user.timedIn)
      .map((user) => ({
        userName: user.name,
        value: 1,
        secondaryInfo: 'No time-in recorded | requires follow-up',
      }));
    const lateUsersRows = attendanceSnapshot
      .filter((user) => user.timedIn && user.lateMinutes > 0)
      .map((user) => ({
        userName: user.name,
        value: user.lateMinutes,
        secondaryInfo: `Late by ${user.lateMinutes} minutes`,
      }));
    const onTimeRows = attendanceSnapshot
      .filter((user) => user.timedIn && user.lateMinutes === 0)
      .map((user) => ({
        userName: user.name,
        value: 1,
        secondaryInfo: `On-time compliance | ${toHoursLabel(user.totalHours)} worked`,
      }));
    const locationViolationRows = attendanceSnapshot
      .filter((user) => user.locationViolation)
      .map((user) => ({
        userName: user.name,
        value: 1,
        secondaryInfo: 'Outside allowed radius | validate attendance',
      }));

    return [
      {
        id: 'active-users',
        title: 'Total Worked Hours Today',
        value: totalWorkedHours.toFixed(1),
        icon: Users,
        color: 'blue',
        breakdownRows: activeUsersRows,
      },
      {
        id: 'timed-in',
        title: 'Users Who Timed In',
        value: timedInRows.length,
        icon: UserCheck,
        color: 'green',
        trend: { value: `${((timedInRows.length / attendanceSnapshot.length) * 100).toFixed(1)}%`, isPositive: true },
        breakdownRows: timedInRows,
      },
      {
        id: 'not-timed-in',
        title: 'Users Not Timed In',
        value: notTimedInRows.length,
        icon: UserX,
        color: 'red',
        breakdownRows: notTimedInRows,
      },
      {
        id: 'late-users',
        title: 'Total Late Minutes',
        value: lateUsersRows.reduce((sum, row) => sum + row.value, 0),
        icon: Clock,
        color: 'yellow',
        breakdownRows: lateUsersRows,
      },
      {
        id: 'on-time',
        title: 'On-Time Users',
        value: onTimeRows.length,
        icon: TrendingUp,
        color: 'green',
        trend: { value: `${((onTimeRows.length / Math.max(timedInRows.length, 1)) * 100).toFixed(1)}%`, isPositive: true },
        breakdownRows: onTimeRows,
      },
      {
        id: 'location-violations',
        title: 'Location Violations',
        value: locationViolationRows.length,
        icon: AlertTriangle,
        color: 'red',
        breakdownRows: locationViolationRows,
      },
    ];
  }, []);

  const selectedKpi = kpiCards.find((kpi) => kpi.id === selectedKpiId) ?? null;
  const sortedBreakdownRows = useMemo(
    () => sortBreakdownRows(selectedKpi?.breakdownRows ?? []),
    [selectedKpi]
  );
  const breakdownTotal = useMemo(() => sumBreakdownValues(selectedKpi?.breakdownRows ?? []), [selectedKpi]);
  const topContributor = sortedBreakdownRows[0] ?? null;
  const averageValue = sortedBreakdownRows.length > 0 ? (breakdownTotal / sortedBreakdownRows.length).toFixed(2) : '0.00';
  const formattedBreakdownTotal = useMemo(() => {
    if (!selectedKpi) return '0';
    if (selectedKpi.id === 'active-users') {
      return breakdownTotal.toFixed(1);
    }
    return `${Math.round(breakdownTotal)}`;
  }, [breakdownTotal, selectedKpi]);

  const handleOpenBreakdown = (kpiId: string) => {
    setSelectedKpiId(kpiId);
    setIsBreakdownLoading(true);
    window.setTimeout(() => {
      setIsBreakdownLoading(false);
    }, 250);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {kpiCards.map((kpi) => (
          <KPICard
            key={kpi.id}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
            color={kpi.color}
            trend={kpi.trend}
            onBreakdownClick={() => handleOpenBreakdown(kpi.id)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceChart />
        <LateEmployeesTrendChart />
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-l-4 border-green-500 pl-4">
            <p className="text-sm text-gray-600">On-Time Rate</p>
            <p className="text-2xl font-semibold text-gray-900">
              {((kpiCards.find((k) => k.id === 'on-time')?.value ?? 0) / Math.max(kpiCards.find((k) => k.id === 'timed-in')?.value ?? 1, 1) * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-green-600 mt-1">+ 2.3% from yesterday</p>
          </div>
          <div className="border-l-4 border-amber-500 pl-4">
            <p className="text-sm text-gray-600">Average Late Time</p>
            <p className="text-2xl font-semibold text-gray-900">
              {(() => {
                const lateUsers = attendanceSnapshot.filter((user) => user.lateMinutes > 0);
                if (lateUsers.length === 0) return '0 min';
                const totalLate = lateUsers.reduce((sum, user) => sum + user.lateMinutes, 0);
                return `${Math.round(totalLate / lateUsers.length)} min`;
              })()}
            </p>
            <p className="text-xs text-amber-600 mt-1">- 3 min from yesterday</p>
          </div>
          <div className="border-l-4 border-blue-500 pl-4">
            <p className="text-sm text-gray-600">Location Compliance</p>
            <p className="text-2xl font-semibold text-gray-900">
              {((1 - (kpiCards.find((k) => k.id === 'location-violations')?.value ?? 0) / attendanceSnapshot.length) * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {kpiCards.find((k) => k.id === 'location-violations')?.value ?? 0} violations detected
            </p>
          </div>
        </div>
      </div>

      <Dialog open={Boolean(selectedKpi)} onOpenChange={(open) => !open && setSelectedKpiId(null)}>
        <DialogContent className="w-[96vw] max-w-[900px] max-h-[90vh] overflow-hidden p-0">
          <DialogHeader>
            <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white px-6 py-5">
              <DialogTitle className="text-xl text-gray-900">{selectedKpi?.title} Breakdown</DialogTitle>
              <DialogDescription className="mt-1">
                Ranked by KPI value descending for the current overview range.
              </DialogDescription>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-blue-200 bg-white p-3">
                  <p className="text-xs text-gray-500">Aggregated Total</p>
                  <p className="text-lg font-semibold text-gray-900">{formattedBreakdownTotal}</p>
                </div>
                <div className="rounded-lg border border-blue-200 bg-white p-3">
                  <p className="text-xs text-gray-500">Users in Breakdown</p>
                  <p className="text-lg font-semibold text-gray-900">{sortedBreakdownRows.length}</p>
                </div>
                <div className="rounded-lg border border-blue-200 bg-white p-3">
                  <p className="text-xs text-gray-500">Average Per User</p>
                  <p className="text-lg font-semibold text-gray-900">{averageValue}</p>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="max-h-[65vh] overflow-auto px-6 py-4">
            {isBreakdownLoading ? (
              <div className="rounded-lg border border-gray-200 p-6 text-sm text-gray-600">Loading breakdown...</div>
            ) : sortedBreakdownRows.length === 0 ? (
              <div className="rounded-lg border border-gray-200 p-6 text-sm text-gray-600">No user breakdown data available for this KPI.</div>
            ) : (
              <div className="space-y-3">
                {topContributor && (
                  <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                    <div>
                      <p className="text-xs text-blue-700">Top Contributor</p>
                      <p className="text-sm font-semibold text-blue-900">{topContributor.userName}</p>
                    </div>
                    <Badge className="bg-blue-600 text-white hover:bg-blue-600">{topContributor.value}</Badge>
                  </div>
                )}
                <div className="rounded-lg border border-gray-200">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>KPI Value</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedBreakdownRows.map((row, index) => (
                        <TableRow key={`${selectedKpi?.id}-${row.userName}`}>
                          <TableCell className="text-sm text-gray-500">{index + 1}</TableCell>
                          <TableCell className="font-medium text-gray-900">{row.userName}</TableCell>
                          <TableCell className="text-sm text-gray-700">{row.value}</TableCell>
                          <TableCell className="text-sm text-gray-600">{row.secondaryInfo}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
