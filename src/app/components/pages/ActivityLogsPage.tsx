import { useMemo, useState } from 'react';
import { FileText, XCircle, Activity, Calendar, Search, Filter } from 'lucide-react';
import { KPICard } from '../KPICard';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { TablePaginationControls } from '../TablePaginationControls';
import { useTablePagination } from '../hooks/useTablePagination';
import { activityLogs } from '../../data/timekeepingData';

const getLatestLogDate = () => activityLogs[0]?.timestamp.slice(0, 10) ?? '';

export function ActivityLogsPage() {
  const [filters, setFilters] = useState({
    date: getLatestLogDate(),
    companyStore: 'all',
    activityType: 'all',
    search: '',
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const getCategoryBadge = (category: string) => {
    const categoryMap: Record<string, { label: string; className: string }> = {
      'time-record': { label: 'Time Record', className: 'bg-blue-100 text-blue-700' },
      'user-management': { label: 'User Management', className: 'bg-purple-100 text-purple-700' },
      'adjustment': { label: 'Adjustment', className: 'bg-amber-100 text-amber-700' },
      'system': { label: 'System', className: 'bg-gray-100 text-gray-700' },
    };

    const config = categoryMap[category] || { label: category, className: 'bg-gray-100 text-gray-700' };
    
    return (
      <Badge className={`${config.className} hover:${config.className} text-xs`}>
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      success: { label: 'Success', className: 'bg-green-100 text-green-700' },
      failed: { label: 'Failed', className: 'bg-red-100 text-red-700' },
    };

    const config = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
    
    return (
      <Badge className={`${config.className} hover:${config.className} text-xs`}>
        {config.label}
      </Badge>
    );
  };

  const filteredLogs = useMemo(() => {
    return activityLogs.filter((log) => {
      const searchLower = appliedFilters.search.trim().toLowerCase();
      const matchesSearch =
        searchLower.length === 0 ||
        log.user.toLowerCase().includes(searchLower) ||
        log.affectedEmployee.toLowerCase().includes(searchLower) ||
        log.activity.toLowerCase().includes(searchLower) ||
        log.details.toLowerCase().includes(searchLower);

      const matchesDate =
        appliedFilters.date.length === 0 ||
        log.timestamp.startsWith(appliedFilters.date);

      const matchesCompanyStore =
        appliedFilters.companyStore === 'all' ||
        (appliedFilters.companyStore === 'hq' && log.storeKey === 'hq') ||
        (appliedFilters.companyStore === 'store1' && log.storeKey === 'store1') ||
        (appliedFilters.companyStore === 'store2' && log.storeKey === 'store2');

      const matchesActivityType =
        appliedFilters.activityType === 'all' ||
        log.category === appliedFilters.activityType;

      return matchesSearch && matchesDate && matchesCompanyStore && matchesActivityType;
    });
  }, [appliedFilters]);

  const todayActivities = useMemo(() => {
    if (appliedFilters.date.length === 0) return 0;
    return activityLogs.filter((log) => log.timestamp.startsWith(appliedFilters.date)).length;
  }, [appliedFilters.date]);

  const thisWeekActivities = useMemo(() => {
    const referenceDate = appliedFilters.date.length > 0 ? new Date(appliedFilters.date) : new Date();
    const startDate = new Date(referenceDate);
    startDate.setDate(referenceDate.getDate() - 6);
    const endDate = referenceDate.getTime();
    return activityLogs.filter((log) => {
      const logDate = new Date(log.timestamp.slice(0, 10)).getTime();
      return logDate >= startDate.getTime() && logDate <= endDate;
    }).length;
  }, [appliedFilters.date]);

  const failedAttempts = useMemo(() => activityLogs.filter((log) => log.status === 'failed').length, []);

  const logsPagination = useTablePagination(filteredLogs);
  const paginatedLogs = logsPagination.paginatedItems;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Activities"
          value={activityLogs.length.toLocaleString()}
          icon={FileText}
          color="blue"
        />
        <KPICard
          title="Today's Activities"
          value={todayActivities.toLocaleString()}
          icon={Activity}
          color="green"
        />
        <KPICard
          title="This Week"
          value={thisWeekActivities.toLocaleString()}
          icon={Calendar}
          color="purple"
        />
        <KPICard
          title="Failed Attempts"
          value={failedAttempts.toLocaleString()}
          icon={XCircle}
          color="red"
        />
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              type="date" 
              className="pl-10"
              value={filters.date}
              onChange={(event) => setFilters((prev) => ({ ...prev, date: event.target.value }))}
            />
          </div>

          <div className="relative">
            <Select
              value={filters.companyStore}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, companyStore: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Company / Store" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                <SelectItem value="hq">Headquarters</SelectItem>
                <SelectItem value="store1">Store 1</SelectItem>
                <SelectItem value="store2">Store 2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Select
              value={filters.activityType}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, activityType: value }))}
            >
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="Activity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="time-record">Time Record</SelectItem>
                <SelectItem value="user-management">User Management</SelectItem>
                <SelectItem value="adjustment">Adjustment</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              type="text" 
              placeholder="Search..." 
              className="pl-10"
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="button" variant="outline" onClick={() => setAppliedFilters(filters)}>
            Apply Filters
          </Button>
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Activity Logs</h3>
          <p className="text-sm text-gray-500 mt-1">Audit trail of all system activities and events</p>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Affected Employee</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Details / Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-gray-50">
                  <TableCell className="text-sm text-gray-600">
                    {log.timestamp}
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">
                    {log.user}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {log.role}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {log.affectedEmployee}
                  </TableCell>
                  <TableCell className="text-sm text-gray-900">
                    {log.activity}
                  </TableCell>
                  <TableCell>
                    {getCategoryBadge(log.category)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(log.status)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 max-w-xs">
                    {log.details}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
<TablePaginationControls
  currentPage={logsPagination.currentPage}
  totalPages={logsPagination.totalPages}
  pageSize={logsPagination.pageSize}
  totalItems={logsPagination.totalItems}
  onPrevious={logsPagination.goToPreviousPage}
  onNext={logsPagination.goToNextPage}
  onPageChange={logsPagination.goToPage}
  onPageSizeChange={logsPagination.setPageSize}
/>
        </div>
      </div>
    </div>
  );
}




