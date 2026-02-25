import { useMemo, useState } from 'react';
import { Users, UserCheck, Clock, UserX, TrendingUp, AlertTriangle } from 'lucide-react';
import { KPICard } from '../KPICard';
import { AttendanceChart } from '../AttendanceChart';
import { LateEmployeesTrendChart } from '../LateEmployeesTrendChart';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  getPresetRange,
  isDateInRange,
  normalizeRange,
  sortBreakdownRows,
  sumBreakdownValues,
} from '../../utils/timekeeping';

type TimeFilterOption = 'today' | 'this-week' | 'this-2-weeks' | 'this-month' | 'custom';

interface AttendanceRecord {
  userId: string;
  userName: string;
  date: string;
  timedIn: boolean;
  totalHours: number;
  lateMinutes: number;
  locationViolation: boolean;
}

interface UserSummary {
  userId: string;
  userName: string;
  totalHours: number;
  timedInCount: number;
  notTimedInCount: number;
  lateMinutes: number;
  onTimeCount: number;
  locationViolationCount: number;
  lastActivityDate: string | null;
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

const users = [
  { id: 'u1', name: 'Sarah Johnson' },
  { id: 'u2', name: 'Michael Chen' },
  { id: 'u3', name: 'Emily Rodriguez' },
  { id: 'u4', name: 'David Park' },
  { id: 'u5', name: 'Jessica Williams' },
  { id: 'u6', name: 'Robert Martinez' },
  { id: 'u7', name: 'Amanda Thompson' },
  { id: 'u8', name: 'Kevin Ramos' },
];

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const generateActivityDates = (startDateStr: string, endDate: Date) => {
  const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
  const cursor = new Date(startYear, startMonth - 1, startDay);
  const dates: string[] = [];

  while (cursor <= endDate) {
    const dayOfWeek = cursor.getDay();
    // Skip Saturday (6) and Sunday (0) to keep timekeeping data workday-only.
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      dates.push(formatDate(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
};

const today = new Date();
const activityDates = generateActivityDates('2026-01-30', today);

const attendanceRecords: AttendanceRecord[] = activityDates.flatMap((date, dateIndex) =>
  users.map((user, userIndex) => {
    const userAbsentPattern = (userIndex === 5 && dateIndex % 4 === 0) || (userIndex === 2 && dateIndex % 7 === 0);
    const timedIn = !userAbsentPattern;
    const lateSeed = ((dateIndex + 2) * (userIndex + 3)) % 31;
    const lateMinutes = timedIn && lateSeed >= 16 ? lateSeed - 9 : 0;
    const totalHours = timedIn ? Number((6.8 + ((dateIndex + userIndex) % 4) * 0.5).toFixed(1)) : 0;
    const locationViolation = timedIn && (dateIndex + userIndex) % 10 === 0;

    return {
      userId: user.id,
      userName: user.name,
      date,
      timedIn,
      totalHours,
      lateMinutes,
      locationViolation,
    };
  })
);

const toHoursLabel = (hours: number) => `${hours.toFixed(1)}h`;

const filterLabels: Record<TimeFilterOption, string> = {
  today: 'Today',
  'this-week': 'This Week',
  'this-2-weeks': 'This 2 Weeks',
  'this-month': 'This Month',
  custom: 'Custom',
};

export function OverviewPage() {
  const [selectedKpiId, setSelectedKpiId] = useState<string | null>(null);
  const [isBreakdownLoading, setIsBreakdownLoading] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilterOption>('today');

  const latestRecordDate = useMemo(() => formatDate(new Date()), []);

  const defaultCustomRange = useMemo(() => getPresetRange('this-week', latestRecordDate), [latestRecordDate]);
  const [customStartDate, setCustomStartDate] = useState(defaultCustomRange.start);
  const [customEndDate, setCustomEndDate] = useState(defaultCustomRange.end);

  const activeRange = useMemo(() => {
    if (timeFilter === 'custom') {
      return normalizeRange(customStartDate, customEndDate);
    }
    return getPresetRange(timeFilter, latestRecordDate);
  }, [timeFilter, customStartDate, customEndDate, latestRecordDate]);

  const rangeLabel = useMemo(() => {
    if (!activeRange.start || !activeRange.end) {
      return 'Select a valid date range';
    }
    return `${activeRange.start} to ${activeRange.end}`;
  }, [activeRange]);

  const lateTrendTitleSuffix = useMemo(() => {
    if (!activeRange.start || !activeRange.end) {
      return filterLabels[timeFilter];
    }
    if (timeFilter === 'today') {
      return activeRange.end;
    }
    return rangeLabel;
  }, [activeRange, timeFilter, rangeLabel]);

  const filteredRecords = useMemo(() => {
    if (!activeRange.start || !activeRange.end) {
      return [];
    }
    return attendanceRecords.filter((record) => isDateInRange(record.date, activeRange.start, activeRange.end));
  }, [activeRange]);

  const attendanceDistributionData = useMemo(() => {
    const onTimeCount = filteredRecords.filter((record) => record.timedIn && record.lateMinutes === 0).length;
    const lateCount = filteredRecords.filter((record) => record.timedIn && record.lateMinutes > 0).length;
    const absentCount = filteredRecords.filter((record) => !record.timedIn).length;

    return [
      { name: 'On-Time', value: onTimeCount, color: '#10b981' },
      { name: 'Late', value: lateCount, color: '#f59e0b' },
      { name: 'Absent', value: absentCount, color: '#ef4444' },
    ];
  }, [filteredRecords]);

  const lateTrendData = useMemo(() => {
    const dateToLateCount = new Map<string, number>();
    filteredRecords.forEach((record) => {
      if (record.lateMinutes <= 0) return;
      dateToLateCount.set(record.date, (dateToLateCount.get(record.date) ?? 0) + 1);
    });

    return [...dateToLateCount.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({
        date: new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count,
      }));
  }, [filteredRecords]);

  const userSummaries = useMemo<UserSummary[]>(() => {
    const initialMap = new Map<string, UserSummary>();
    users.forEach((user) => {
      initialMap.set(user.id, {
        userId: user.id,
        userName: user.name,
        totalHours: 0,
        timedInCount: 0,
        notTimedInCount: 0,
        lateMinutes: 0,
        onTimeCount: 0,
        locationViolationCount: 0,
        lastActivityDate: null,
      });
    });

    filteredRecords.forEach((record) => {
      const summary = initialMap.get(record.userId);
      if (!summary) return;

      summary.totalHours += record.totalHours;
      if (record.timedIn) {
        summary.timedInCount += 1;
        if (summary.lastActivityDate === null || record.date > summary.lastActivityDate) {
          summary.lastActivityDate = record.date;
        }
      } else {
        summary.notTimedInCount += 1;
      }
      if (record.lateMinutes > 0) {
        summary.lateMinutes += record.lateMinutes;
      } else if (record.timedIn) {
        summary.onTimeCount += 1;
      }
      if (record.locationViolation) {
        summary.locationViolationCount += 1;
      }
    });

    return [...initialMap.values()];
  }, [filteredRecords]);

  const kpiCards = useMemo<KpiCardConfig[]>(() => {
    const workedHoursRows = userSummaries
      .filter((user) => user.totalHours > 0)
      .map((user) => ({
        userName: user.userName,
        value: Number(user.totalHours.toFixed(1)),
        secondaryInfo: `Worked ${toHoursLabel(user.totalHours)} in selected range`,
      }));
    const timedInRows = userSummaries
      .filter((user) => user.timedInCount > 0)
      .map((user) => ({
        userName: user.userName,
        value: user.timedInCount,
        secondaryInfo: `${user.timedInCount} time-in event(s)`,
      }));
    const notTimedInRows = userSummaries
      .filter((user) => user.notTimedInCount > 0)
      .map((user) => ({
        userName: user.userName,
        value: user.notTimedInCount,
        secondaryInfo: `${user.notTimedInCount} missed time-in record(s)`,
      }));
    const lateRows = userSummaries
      .filter((user) => user.lateMinutes > 0)
      .map((user) => ({
        userName: user.userName,
        value: user.lateMinutes,
        secondaryInfo: `${user.lateMinutes} late minute(s) total`,
      }));
    const onTimeRows = userSummaries
      .filter((user) => user.onTimeCount > 0)
      .map((user) => ({
        userName: user.userName,
        value: user.onTimeCount,
        secondaryInfo: `${user.onTimeCount} on-time shift(s)`,
      }));
    const locationViolationRows = userSummaries
      .filter((user) => user.locationViolationCount > 0)
      .map((user) => ({
        userName: user.userName,
        value: user.locationViolationCount,
        secondaryInfo: `${user.locationViolationCount} location violation event(s)`,
      }));

    const timedInTotal = sumBreakdownValues(timedInRows);
    const notTimedInTotal = sumBreakdownValues(notTimedInRows);
    const onTimeTotal = sumBreakdownValues(onTimeRows);

    return [
      {
        id: 'worked-hours',
        title: 'Total Worked Hours',
        value: Number(sumBreakdownValues(workedHoursRows).toFixed(1)),
        icon: Users,
        color: 'blue',
        breakdownRows: workedHoursRows,
      },
      {
        id: 'timed-in',
        title: 'Users Who Timed In',
        value: timedInTotal,
        icon: UserCheck,
        color: 'green',
        trend: {
          value: `${(((timedInTotal / Math.max(timedInTotal + notTimedInTotal, 1)) * 100).toFixed(1))}%`,
          isPositive: true,
        },
        breakdownRows: timedInRows,
      },
      {
        id: 'not-timed-in',
        title: 'Users Not Timed In',
        value: notTimedInTotal,
        icon: UserX,
        color: 'red',
        breakdownRows: notTimedInRows,
      },
      {
        id: 'late-minutes',
        title: 'Total Late Minutes',
        value: sumBreakdownValues(lateRows),
        icon: Clock,
        color: 'yellow',
        breakdownRows: lateRows,
      },
      {
        id: 'on-time',
        title: 'On-Time Users',
        value: onTimeTotal,
        icon: TrendingUp,
        color: 'green',
        trend: {
          value: `${(((onTimeTotal / Math.max(timedInTotal, 1)) * 100).toFixed(1))}%`,
          isPositive: true,
        },
        breakdownRows: onTimeRows,
      },
      {
        id: 'location-violations',
        title: 'Location Violations',
        value: sumBreakdownValues(locationViolationRows),
        icon: AlertTriangle,
        color: 'red',
        breakdownRows: locationViolationRows,
      },
    ];
  }, [userSummaries]);

  const selectedKpi = kpiCards.find((kpi) => kpi.id === selectedKpiId) ?? null;
  const sortedBreakdownRows = useMemo(() => sortBreakdownRows(selectedKpi?.breakdownRows ?? []), [selectedKpi]);
  const breakdownTotal = useMemo(() => sumBreakdownValues(selectedKpi?.breakdownRows ?? []), [selectedKpi]);
  const formattedBreakdownTotal = useMemo(() => {
    if (!selectedKpi) return '0';
    if (selectedKpi.id === 'worked-hours') return breakdownTotal.toFixed(1);
    return `${Math.round(breakdownTotal)}`;
  }, [breakdownTotal, selectedKpi]);
  const topContributor = sortedBreakdownRows[0] ?? null;
  const averageValue = sortedBreakdownRows.length > 0 ? (breakdownTotal / sortedBreakdownRows.length).toFixed(2) : '0.00';

  const handleOpenBreakdown = (kpiId: string) => {
    setSelectedKpiId(kpiId);
    setIsBreakdownLoading(true);
    window.setTimeout(() => {
      setIsBreakdownLoading(false);
    }, 250);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="w-full md:max-w-[240px]">
            <label className="text-sm text-gray-600">Time Filter</label>
            <Select value={timeFilter} onValueChange={(value) => setTimeFilter(value as TimeFilterOption)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-2-weeks">This 2 Weeks</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {timeFilter === 'custom' && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label className="text-sm text-gray-600">Start Date</label>
                <Input type="date" value={customStartDate} onChange={(event) => setCustomStartDate(event.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm text-gray-600">End Date</label>
                <Input type="date" value={customEndDate} onChange={(event) => setCustomEndDate(event.target.value)} className="mt-1" />
              </div>
            </div>
          )}
          <p className="text-sm text-gray-500">Range: {rangeLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {kpiCards.map((kpi) => (
          <KPICard
            key={kpi.id}
            title={kpi.title}
            value={kpi.id === 'worked-hours' ? Number(kpi.value).toFixed(1) : Math.round(kpi.value)}
            icon={kpi.icon}
            color={kpi.color}
            trend={kpi.trend}
            onBreakdownClick={() => handleOpenBreakdown(kpi.id)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceChart data={attendanceDistributionData} />
        <LateEmployeesTrendChart data={lateTrendData} titleSuffix={lateTrendTitleSuffix} />
      </div>

      <Dialog open={Boolean(selectedKpi)} onOpenChange={(open) => !open && setSelectedKpiId(null)}>
        <DialogContent className="w-[96vw] max-w-[900px] max-h-[90vh] overflow-hidden p-0">
          <DialogHeader>
            <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white px-6 py-5">
              <DialogTitle className="text-xl text-gray-900">{selectedKpi?.title} Breakdown</DialogTitle>
              <DialogDescription className="mt-1">
                Ranked by KPI value descending for {filterLabels[timeFilter]} ({rangeLabel}).
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
              <div className="rounded-lg border border-gray-200 p-6 text-sm text-gray-600">No user breakdown data available for this KPI and time range.</div>
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
