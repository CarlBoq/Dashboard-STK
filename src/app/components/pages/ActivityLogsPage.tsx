import { useMemo, useState } from 'react';
import { FileText, AlertTriangle, XCircle, Activity, Calendar, Search, Filter } from 'lucide-react';
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

interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  affectedEmployee: string;
  activity: string;
  category: 'time-record' | 'user-management' | 'adjustment' | 'system';
  status: 'success' | 'failed';
  details: string;
}

const mockLogs: ActivityLog[] = [
  {
    id: '1',
    timestamp: '2026-02-12 09:15:23',
    user: 'Sarah Johnson',
    role: 'Employee',
    affectedEmployee: 'Sarah Johnson',
    activity: 'Clocked in',
    category: 'time-record',
    status: 'success',
    details: 'Time-in recorded at Store 1 - Downtown',
  },
  {
    id: '2',
    timestamp: '2026-02-12 09:18:45',
    user: 'Michael Chen',
    role: 'Employee',
    affectedEmployee: 'Michael Chen',
    activity: 'Late clock-in',
    category: 'time-record',
    status: 'success',
    details: 'Clocked in 15 minutes late',
  },
  {
    id: '3',
    timestamp: '2026-02-12 09:22:10',
    user: 'Admin User',
    role: 'Administrator',
    affectedEmployee: 'Emily Rodriguez',
    activity: 'Time adjustment',
    category: 'adjustment',
    status: 'success',
    details: 'Manually adjusted time-in from 10:40 AM to 10:00 AM',
  },
  {
    id: '4',
    timestamp: '2026-02-12 09:35:12',
    user: 'Emily Rodriguez',
    role: 'Employee',
    affectedEmployee: 'Emily Rodriguez',
    activity: 'Location violation',
    category: 'time-record',
    status: 'success',
    details: 'Clocked in outside allowed radius (580m from reference)',
  },
  {
    id: '5',
    timestamp: '2026-02-12 09:40:33',
    user: 'David Park',
    role: 'Employee',
    affectedEmployee: 'David Park',
    activity: 'Clocked in',
    category: 'time-record',
    status: 'success',
    details: 'Time-in recorded at Headquarters',
  },
  {
    id: '6',
    timestamp: '2026-02-12 10:12:05',
    user: 'Unknown User',
    role: 'N/A',
    affectedEmployee: 'N/A',
    activity: 'Authentication failed',
    category: 'system',
    status: 'failed',
    details: 'Failed login attempt - Invalid credentials',
  },
  {
    id: '7',
    timestamp: '2026-02-12 10:25:18',
    user: 'Admin User',
    role: 'Administrator',
    affectedEmployee: 'New Employee',
    activity: 'User created',
    category: 'user-management',
    status: 'success',
    details: 'New employee account created',
  },
  {
    id: '8',
    timestamp: '2026-02-12 11:08:42',
    user: 'Admin User',
    role: 'Administrator',
    affectedEmployee: 'Robert Martinez',
    activity: 'Schedule updated',
    category: 'user-management',
    status: 'success',
    details: 'Assigned to new schedule: Morning Shift',
  },
  {
    id: '9',
    timestamp: '2026-02-12 11:30:55',
    user: 'Christopher Lee',
    role: 'Employee',
    affectedEmployee: 'Christopher Lee',
    activity: 'Clocked in',
    category: 'time-record',
    status: 'success',
    details: 'Time-in recorded at Store 2 - Uptown',
  },
  {
    id: '10',
    timestamp: '2026-02-12 05:03:17',
    user: 'Sarah Johnson',
    role: 'Employee',
    affectedEmployee: 'Sarah Johnson',
    activity: 'Clocked out',
    category: 'time-record',
    status: 'success',
    details: 'Time-out recorded at Store 1 - Downtown',
  },
];

export function ActivityLogsPage() {
  const [filters, setFilters] = useState({
    date: '2026-02-12',
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
    return mockLogs.filter((log) => {
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

      const detailsLower = log.details.toLowerCase();
      const matchesCompanyStore =
        appliedFilters.companyStore === 'all' ||
        (appliedFilters.companyStore === 'hq' && detailsLower.includes('headquarters')) ||
        (appliedFilters.companyStore === 'store1' && detailsLower.includes('store 1')) ||
        (appliedFilters.companyStore === 'store2' && detailsLower.includes('store 2'));

      const matchesActivityType =
        appliedFilters.activityType === 'all' ||
        log.category === appliedFilters.activityType;

      return matchesSearch && matchesDate && matchesCompanyStore && matchesActivityType;
    });
  }, [appliedFilters]);

  const logsPagination = useTablePagination(filteredLogs);
  const paginatedLogs = logsPagination.paginatedItems;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Activities"
          value="2,847"
          icon={FileText}
          color="blue"
        />
        <KPICard
          title="Today's Activities"
          value="247"
          icon={Activity}
          color="green"
          trend={{ value: "+18", isPositive: true }}
        />
        <KPICard
          title="This Week"
          value="1,432"
          icon={Calendar}
          color="purple"
        />
        <KPICard
          title="Failed Attempts"
          value="3"
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




