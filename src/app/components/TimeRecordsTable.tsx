import { MapPin, Eye } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { TablePaginationControls } from './TablePaginationControls';
import { useTablePagination } from './hooks/useTablePagination';

interface TimeRecord {
  id: string;
  employeeName: string;
  scheduledStart: string;
  scheduledEnd: string;
  breakDuration: string;
  actualTimeIn: string;
  actualTimeOut: string;
  lateMinutes: number;
  totalHours: string;
  locationStatus: 'compliant' | 'outside' | 'no-data';
  distance?: number;
}

const mockData: TimeRecord[] = [
  {
    id: '1',
    employeeName: 'Sarah Johnson',
    scheduledStart: '09:00 AM',
    scheduledEnd: '05:00 PM',
    breakDuration: '1h 00m',
    actualTimeIn: '08:55 AM',
    actualTimeOut: '05:03 PM',
    lateMinutes: 0,
    totalHours: '7h 08m',
    locationStatus: 'compliant',
    distance: 45,
  },
  {
    id: '2',
    employeeName: 'Michael Chen',
    scheduledStart: '08:00 AM',
    scheduledEnd: '04:00 PM',
    breakDuration: '30m',
    actualTimeIn: '08:15 AM',
    actualTimeOut: '04:10 PM',
    lateMinutes: 15,
    totalHours: '7h 25m',
    locationStatus: 'compliant',
    distance: 120,
  },
  {
    id: '3',
    employeeName: 'Emily Rodriguez',
    scheduledStart: '10:00 AM',
    scheduledEnd: '06:00 PM',
    breakDuration: '1h 00m',
    actualTimeIn: '10:35 AM',
    actualTimeOut: '06:15 PM',
    lateMinutes: 35,
    totalHours: '6h 40m',
    locationStatus: 'outside',
    distance: 580,
  },
  {
    id: '4',
    employeeName: 'David Park',
    scheduledStart: '07:00 AM',
    scheduledEnd: '03:00 PM',
    breakDuration: '30m',
    actualTimeIn: '06:58 AM',
    actualTimeOut: '-',
    lateMinutes: 0,
    totalHours: '-',
    locationStatus: 'compliant',
    distance: 85,
  },
  {
    id: '5',
    employeeName: 'Jessica Williams',
    scheduledStart: '09:00 AM',
    scheduledEnd: '05:00 PM',
    breakDuration: '1h 00m',
    actualTimeIn: '09:00 AM',
    actualTimeOut: '05:00 PM',
    lateMinutes: 0,
    totalHours: '7h 00m',
    locationStatus: 'no-data',
  },
  {
    id: '6',
    employeeName: 'Robert Martinez',
    scheduledStart: '08:30 AM',
    scheduledEnd: '04:30 PM',
    breakDuration: '30m',
    actualTimeIn: '-',
    actualTimeOut: '-',
    lateMinutes: 0,
    totalHours: '-',
    locationStatus: 'no-data',
  },
  {
    id: '7',
    employeeName: 'Amanda Thompson',
    scheduledStart: '09:00 AM',
    scheduledEnd: '05:00 PM',
    breakDuration: '1h 00m',
    actualTimeIn: '09:08 AM',
    actualTimeOut: '05:12 PM',
    lateMinutes: 8,
    totalHours: '7h 04m',
    locationStatus: 'compliant',
    distance: 95,
  },
  {
    id: '8',
    employeeName: 'Christopher Lee',
    scheduledStart: '10:00 AM',
    scheduledEnd: '06:00 PM',
    breakDuration: '1h 00m',
    actualTimeIn: '10:00 AM',
    actualTimeOut: '06:05 PM',
    lateMinutes: 0,
    totalHours: '7h 05m',
    locationStatus: 'compliant',
    distance: 65,
  },
];

export function TimeRecordsTable() {
  const getLocationBadge = (status: string, distance?: number) => {
    switch (status) {
      case 'compliant':
        return (
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
              Within allowed radius
            </Badge>
            <span className="text-xs text-gray-500">{distance}m</span>
          </div>
        );
      case 'outside':
        return (
          <div className="flex items-center gap-2">
            <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
              Outside allowed radius
            </Badge>
            <span className="text-xs text-gray-500">{distance}m</span>
          </div>
        );
      case 'no-data':
        return (
          <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100">
            No location data
          </Badge>
        );
      default:
        return null;
    }
  };

  const getRowClass = (record: TimeRecord) => {
    if (record.actualTimeIn === '-') return 'bg-red-50';
    if (record.lateMinutes > 0) return 'bg-amber-50';
    return 'bg-white hover:bg-gray-50';
  };

  const tablePagination = useTablePagination(mockData);
  const paginatedRecords = tablePagination.paginatedItems;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Time Records</h3>
        <p className="text-sm text-gray-500 mt-1">Today's attendance and time tracking details</p>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee Name</TableHead>
              <TableHead>Scheduled Shift</TableHead>
              <TableHead>Break</TableHead>
              <TableHead>Time In</TableHead>
              <TableHead>Time Out</TableHead>
              <TableHead>Late</TableHead>
              <TableHead>Total Hours</TableHead>
              <TableHead>Location Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRecords.map((record) => (
              <TableRow key={record.id} className={getRowClass(record)}>
                <TableCell className="font-medium text-gray-900">
                  {record.employeeName}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {record.scheduledStart} - {record.scheduledEnd}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {record.breakDuration}
                </TableCell>
                <TableCell className="text-sm">
                  {record.actualTimeIn === '-' ? (
                    <span className="text-red-600 font-medium">No Time-In</span>
                  ) : (
                    <span className={record.lateMinutes > 0 ? 'text-amber-600' : 'text-green-600'}>
                      {record.actualTimeIn}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {record.actualTimeOut === '-' ? (
                    <span className="text-gray-400">-</span>
                  ) : (
                    <span className="text-gray-900">{record.actualTimeOut}</span>
                  )}
                </TableCell>
                <TableCell>
                  {record.lateMinutes > 0 ? (
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                      {record.lateMinutes} min
                    </Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                      On-time
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm font-medium text-gray-900">
                  {record.totalHours}
                </TableCell>
                <TableCell>
                  {getLocationBadge(record.locationStatus, record.distance)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-[#1F4FD8] hover:text-[#1F4FD8] hover:bg-blue-50">
                      <MapPin className="w-4 h-4 mr-1" />
                      Map
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                      <Eye className="w-4 h-4 mr-1" />
                      Details
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
<TablePaginationControls
  currentPage={tablePagination.currentPage}
  totalPages={tablePagination.totalPages}
  pageSize={tablePagination.pageSize}
  totalItems={tablePagination.totalItems}
  onPrevious={tablePagination.goToPreviousPage}
  onNext={tablePagination.goToNextPage}
  onPageChange={tablePagination.goToPage}
  onPageSizeChange={tablePagination.setPageSize}
/>
      </div>
    </div>
  );
}




