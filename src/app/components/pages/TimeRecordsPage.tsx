import { useMemo, useState } from 'react';
import { MapPin, Eye, Calendar, Search, Filter, Map, ExternalLink } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
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
import { buildGoogleMapsUrl, getLatestTimeOutEntry } from '../../utils/timekeeping';
import { timekeepingRecords } from '../../data/timekeepingData';

interface TimeRecord {
  id: string;
  employeeName: string;
  date: string;
  scheduledStart: string;
  scheduledEnd: string;
  breakMinutes: number;
  scheduledHours: string;
  actualTimeIn: string;
  timeInLocation: 'compliant' | 'outside' | 'no-data';
  timeInDistance?: number;
  timeInEntries?: Array<{
    timestamp: string;
    lat?: number;
    lng?: number;
    address?: string;
  }>;
  breakIn: string;
  breakOut: string;
  actualTimeOut: string;
  timeOutLocation: 'compliant' | 'outside' | 'no-data';
  timeOutDistance?: number;
  timeOutEntries?: Array<{
    timestamp: string;
    lat?: number;
    lng?: number;
    address?: string;
  }>;
  workedDuration: string;
  lateMinutes: number;
  status: 'on-time' | 'late' | 'absent' | 'incomplete';
}

const ALLOWED_SITE = {
  addressKeyword: 'fern building',
  lat: 14.6048,
  lng: 120.9884,
  radiusMeters: 250,
};

const mockData: TimeRecord[] = timekeepingRecords;

export function TimeRecordsPage() {
  const [selectedRecord, setSelectedRecord] = useState<TimeRecord | null>(null);
  const latestRecordDate = mockData.reduce((latest, current) => (current.date > latest ? current.date : latest), mockData[0]?.date ?? '');
  const [filters, setFilters] = useState({
    store: 'all',
    date: latestRecordDate,
    search: '',
    distance: 'all',
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const getStoreForRecord = (employeeName: string) => {
    const storeMap: Record<string, string> = {
      'Sarah Johnson': 'store1',
      'Michael Chen': 'store1',
      'Emily Rodriguez': 'store2',
      'David Park': 'hq',
      'Jessica Williams': 'store3',
      'Robert Martinez': 'store1',
    };

    return storeMap[employeeName] ?? 'hq';
  };

  const handleViewOnMap = () => {
    window.open('https://maps.google.com/?q=14.6048,120.9884', '_blank', 'noopener,noreferrer');
  };

  const handleViewDetails = (record: TimeRecord) => {
    setSelectedRecord(record);
  };

  const getLocationBadge = (status: string, distance?: number) => {
    switch (status) {
      case 'compliant':
        return (
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">
              Within allowed radius
            </Badge>
            {distance && <span className="text-xs text-gray-500">{distance}m</span>}
          </div>
        );
      case 'outside':
        return (
          <div className="flex items-center gap-2">
            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">
              Outside allowed radius
            </Badge>
            {distance && <span className="text-xs text-gray-500">{distance}m</span>}
          </div>
        );
      case 'no-data':
        return (
          <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100 text-xs">
            No location data
          </Badge>
        );
      default:
        return null;
    }
  };

  const getDistanceMeters = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const toRadians = (value: number) => (value * Math.PI) / 180;
    const earthRadius = 6371000;
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(earthRadius * c);
  };

  const isAllowedLocation = (location?: { lat?: number; lng?: number; address?: string } | null) => {
    if (!location) return { isAllowed: false, distance: undefined as number | undefined };

    if (typeof location.address === 'string' && location.address.toLowerCase().includes(ALLOWED_SITE.addressKeyword)) {
      return { isAllowed: true, distance: 0 };
    }

    if (Number.isFinite(location.lat) && Number.isFinite(location.lng)) {
      const distance = getDistanceMeters(location.lat as number, location.lng as number, ALLOWED_SITE.lat, ALLOWED_SITE.lng);
      return { isAllowed: distance <= ALLOWED_SITE.radiusMeters, distance };
    }

    return { isAllowed: false, distance: undefined as number | undefined };
  };

  const getEffectiveLocationStatus = (
    locationEntry: { lat?: number; lng?: number; address?: string } | null,
    fallbackStatus: 'compliant' | 'outside' | 'no-data'
  ) => {
    if (!locationEntry) return { status: 'no-data' as const, distance: undefined as number | undefined };

    const evaluation = isAllowedLocation(locationEntry);
    if (evaluation.isAllowed) {
      return { status: 'compliant' as const, distance: evaluation.distance };
    }

    if (evaluation.distance === undefined && fallbackStatus === 'no-data') {
      return { status: 'no-data' as const, distance: undefined as number | undefined };
    }

    return { status: 'outside' as const, distance: evaluation.distance };
  };

  const getTimeOutLocationLink = (record: TimeRecord) => {
    const latestTimeOutEntry = getLatestTimeOutEntry(record.timeOutEntries);
    const mapUrl = buildGoogleMapsUrl(latestTimeOutEntry);

    if (!latestTimeOutEntry || !mapUrl) {
      return null;
    }

    const hasCoordinates = Number.isFinite(latestTimeOutEntry.lat) && Number.isFinite(latestTimeOutEntry.lng);
    const label = hasCoordinates
      ? `${latestTimeOutEntry.lat}, ${latestTimeOutEntry.lng}`
      : latestTimeOutEntry.address ?? 'View on map';

    return { mapUrl, label };
  };

  const getTimeInLocationLink = (record: TimeRecord) => {
    const latestTimeInEntry = getLatestTimeOutEntry(record.timeInEntries);
    const mapUrl = buildGoogleMapsUrl(latestTimeInEntry);

    if (!latestTimeInEntry || !mapUrl) {
      return null;
    }

    const hasCoordinates = Number.isFinite(latestTimeInEntry.lat) && Number.isFinite(latestTimeInEntry.lng);
    const label = hasCoordinates
      ? `${latestTimeInEntry.lat}, ${latestTimeInEntry.lng}`
      : latestTimeInEntry.address ?? 'View on map';

    return { mapUrl, label };
  };

  const getTimeInLocationMeta = (record: TimeRecord) => {
    const latestTimeInEntry = getLatestTimeOutEntry(record.timeInEntries);
    return getEffectiveLocationStatus(latestTimeInEntry, record.timeInLocation);
  };

  const getTimeOutLocationMeta = (record: TimeRecord) => {
    const latestTimeOutEntry = getLatestTimeOutEntry(record.timeOutEntries);
    return getEffectiveLocationStatus(latestTimeOutEntry, record.timeOutLocation);
  };

  const getCompactLocationText = (label: string) => {
    if (!label) return '';
    const trimmed = label.trim();
    if (trimmed.length <= 42) return trimmed;
    return `${trimmed.slice(0, 42)}...`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      'on-time': { label: 'On Time', className: 'bg-green-100 text-green-700' },
      late: { label: 'Late', className: 'bg-amber-100 text-amber-700' },
      absent: { label: 'Absent', className: 'bg-red-100 text-red-700' },
      incomplete: { label: 'Incomplete', className: 'bg-blue-100 text-blue-700' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-700' };

    return <Badge className={`${config.className} hover:${config.className}`}>{config.label}</Badge>;
  };

  const getRowClass = (record: TimeRecord) => {
    if (record.status === 'absent') return 'bg-red-50';
    if (record.status === 'late') return 'bg-amber-50';
    if (record.status === 'on-time') return 'bg-green-50';
    return 'bg-white hover:bg-gray-50';
  };

  const filteredRecords = useMemo(() => {
    return mockData.filter((record) => {
      const searchLower = appliedFilters.search.trim().toLowerCase();
      const matchesSearch =
        searchLower.length === 0 ||
        record.employeeName.toLowerCase().includes(searchLower);

      const matchesStore =
        appliedFilters.store === 'all' ||
        getStoreForRecord(record.employeeName) === appliedFilters.store;

      const matchesDate =
        appliedFilters.date.length === 0 ||
        record.date === appliedFilters.date;

      const matchesDistance =
        appliedFilters.distance === 'all' ||
        (appliedFilters.distance === 'nodata'
          ? getTimeInLocationMeta(record).status === 'no-data'
          : getTimeInLocationMeta(record).status === appliedFilters.distance);

      return matchesSearch && matchesStore && matchesDate && matchesDistance;
    });
  }, [appliedFilters]);

  const recordsPagination = useTablePagination(filteredRecords);
  const paginatedRecords = recordsPagination.paginatedItems;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Store Location</h3>
            <div className="space-y-1 text-sm">
              <p className="text-gray-600">
                <span className="font-medium">Address:</span> Unit 503, 5th Floor, FERN Building I, 827 P. Paredes Street, Sampaloc, Barangay 468
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Coordinates:</span> 14.6048 N, 120.9884 E
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Reference:</span> Store 1 - Headquarters
              </p>
            </div>
          </div>
          <Button onClick={handleViewOnMap} className="bg-[#1F4FD8] hover:bg-[#1845b8]">
            <Map className="w-4 h-4 mr-2" />
            View on Map
          </Button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Select
              value={filters.store}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, store: value }))}
            >
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="Select Store" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stores</SelectItem>
                <SelectItem value="hq">Headquarters</SelectItem>
                <SelectItem value="store1">Store 1 - Downtown</SelectItem>
                <SelectItem value="store2">Store 2 - Uptown</SelectItem>
                <SelectItem value="store3">Store 3 - Westside</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search employee..."
              className="pl-10"
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Select
              value={filters.distance}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, distance: value }))}
            >
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="Distance Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Distances</SelectItem>
                <SelectItem value="compliant">Within Radius</SelectItem>
                <SelectItem value="outside">Outside Radius</SelectItem>
                <SelectItem value="nodata">No Location Data</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="button" variant="outline" onClick={() => setAppliedFilters(filters)}>
            Apply Filters
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Time Records</h3>
          <p className="text-sm text-gray-500 mt-1">Complete attendance and time tracking records</p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Scheduled Shift</TableHead>
                <TableHead>Break (min)</TableHead>
                <TableHead>Scheduled Hours</TableHead>
                <TableHead>Actual Time-In</TableHead>
                <TableHead>Time-In Location</TableHead>
                <TableHead>Break In / Out</TableHead>
                <TableHead>Actual Time-Out</TableHead>
                <TableHead>Time-Out Location</TableHead>
                <TableHead>Worked Duration</TableHead>
                <TableHead>Late (min)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRecords.map((record) => (
                <TableRow key={record.id} className={getRowClass(record)}>
                  <TableCell className="font-medium text-gray-900">{record.employeeName}</TableCell>
                  <TableCell className="text-sm text-gray-600">{record.date}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {record.scheduledStart} - {record.scheduledEnd}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{record.breakMinutes}</TableCell>
                  <TableCell className="text-sm text-gray-600">{record.scheduledHours}</TableCell>
                  <TableCell className="text-sm">
                    {record.actualTimeIn === '-' ? (
                      <span className="text-red-600 font-medium">No Time-In</span>
                    ) : (
                      <span className={record.lateMinutes > 0 ? 'text-amber-600 font-medium' : 'text-green-600 font-medium'}>
                        {record.actualTimeIn}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const timeInLocationLink = getTimeInLocationLink(record);
                      return (
                        <div className="space-y-1">
                          {(() => {
                            const meta = getTimeInLocationMeta(record);
                            return getLocationBadge(meta.status, meta.distance ?? record.timeInDistance);
                          })()}
                          {timeInLocationLink ? (
                            <a
                              href={timeInLocationLink.mapUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-[#1F4FD8] hover:text-[#1845b8] hover:underline"
                              title={timeInLocationLink.label}
                            >
                              <span className="max-w-[180px] truncate">{getCompactLocationText(timeInLocationLink.label)}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="inline-block text-xs text-gray-400">N/A</span>
                          )}
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {record.breakIn} / {record.breakOut}
                  </TableCell>
                  <TableCell className="text-sm">
                    {record.actualTimeOut === '-' ? (
                      <span className="text-gray-400">-</span>
                    ) : (
                      <span className="text-gray-900 font-medium">{record.actualTimeOut}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const timeOutLocationLink = getTimeOutLocationLink(record);
                      return (
                        <div className="space-y-1">
                          {(() => {
                            const meta = getTimeOutLocationMeta(record);
                            return getLocationBadge(meta.status, meta.distance ?? record.timeOutDistance);
                          })()}
                          {timeOutLocationLink ? (
                            <a
                              href={timeOutLocationLink.mapUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-[#1F4FD8] hover:text-[#1845b8] hover:underline"
                              title={timeOutLocationLink.label}
                            >
                              <span className="max-w-[180px] truncate">{getCompactLocationText(timeOutLocationLink.label)}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="inline-block text-xs text-gray-400">N/A</span>
                          )}
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-gray-900">{record.workedDuration}</TableCell>
                  <TableCell>
                    {record.lateMinutes > 0 ? (
                      <span className="text-amber-700 font-semibold">{record.lateMinutes} min</span>
                    ) : (
                      <span className="text-green-600">-</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(record.status)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(record)}
                      className="text-[#1F4FD8] hover:text-[#1F4FD8] hover:bg-blue-50"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePaginationControls
            currentPage={recordsPagination.currentPage}
            totalPages={recordsPagination.totalPages}
            pageSize={recordsPagination.pageSize}
            totalItems={recordsPagination.totalItems}
            onPrevious={recordsPagination.goToPreviousPage}
            onNext={recordsPagination.goToNextPage}
            onPageChange={recordsPagination.goToPage}
            onPageSizeChange={recordsPagination.setPageSize}
          />
        </div>
      </div>
      <Dialog open={Boolean(selectedRecord)} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Time Record Details</DialogTitle>
            <DialogDescription>This section is read-only.</DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="grid grid-cols-1 gap-2 text-sm text-gray-700">
              <p><span className="font-medium">Employee:</span> {selectedRecord.employeeName}</p>
              <p><span className="font-medium">Date:</span> {selectedRecord.date}</p>
              <p><span className="font-medium">Scheduled Shift:</span> {selectedRecord.scheduledStart} - {selectedRecord.scheduledEnd}</p>
              <p><span className="font-medium">Actual Time In:</span> {selectedRecord.actualTimeIn}</p>
              <p><span className="font-medium">Actual Time Out:</span> {selectedRecord.actualTimeOut}</p>
              <p><span className="font-medium">Break:</span> {selectedRecord.breakIn} / {selectedRecord.breakOut}</p>
              <p><span className="font-medium">Status:</span> {selectedRecord.status}</p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setSelectedRecord(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
