import { useMemo, useState } from 'react';
import { Edit3, Eye, RefreshCw, Search, Trash2, Undo2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ActionFlowModal, type ActionFlowConfig } from '../ActionFlowModal';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';

interface TimeAdjustment {
  id: string;
  processId: string;
  email: string;
  storeName: string;
  date: string;
  originalTimeIn: string;
  originalTimeOut: string;
  adjustedTimeIn: string;
  adjustedTimeOut: string;
  breakIn: string;
  breakOut: string;
  adjustedBreakIn: string;
  adjustedBreakOut: string;
  reason: string;
  adjustedBy: string;
  adjustmentDate: string;
}

const initialAdjustments: TimeAdjustment[] = [
  {
    id: '1',
    processId: 'TADJ-1001',
    email: 'sarah.johnson@sparkle.local',
    storeName: 'Sparkle Star International Corporation',
    date: '2026-02-11',
    originalTimeIn: '09:15 AM',
    originalTimeOut: '05:10 PM',
    adjustedTimeIn: '09:00 AM',
    adjustedTimeOut: '05:00 PM',
    breakIn: '12:05 PM',
    breakOut: '01:00 PM',
    adjustedBreakIn: '12:00 PM',
    adjustedBreakOut: '01:00 PM',
    reason: 'Clock-in system malfunction',
    adjustedBy: 'Admin User',
    adjustmentDate: '2026-02-11 06:30 PM',
  },
  {
    id: '2',
    processId: 'TADJ-1002',
    email: 'michael.chen@sparkle.local',
    storeName: 'Sparkle Timekeeping Satellite Office',
    date: '2026-02-10',
    originalTimeIn: '08:45 AM',
    originalTimeOut: '04:05 PM',
    adjustedTimeIn: '08:00 AM',
    adjustedTimeOut: '04:00 PM',
    breakIn: '11:40 AM',
    breakOut: '12:05 PM',
    adjustedBreakIn: '11:30 AM',
    adjustedBreakOut: '12:00 PM',
    reason: 'Employee forgot to clock in on time',
    adjustedBy: 'Manager Thompson',
    adjustmentDate: '2026-02-10 05:15 PM',
  },
  {
    id: '3',
    processId: 'TADJ-1003',
    email: 'emily.rodriguez@sparkle.local',
    storeName: 'Sparkle Timekeeping Logistics Hub',
    date: '2026-02-10',
    originalTimeIn: '10:40 AM',
    originalTimeOut: '06:20 PM',
    adjustedTimeIn: '10:00 AM',
    adjustedTimeOut: '06:00 PM',
    breakIn: '01:10 PM',
    breakOut: '02:00 PM',
    adjustedBreakIn: '01:00 PM',
    adjustedBreakOut: '02:00 PM',
    reason: 'Approved late arrival due to emergency',
    adjustedBy: 'Admin User',
    adjustmentDate: '2026-02-10 07:00 PM',
  },
  {
    id: '4',
    processId: 'TADJ-1004',
    email: 'david.park@sparkle.local',
    storeName: 'Sparkle Star International Corporation',
    date: '2026-02-09',
    originalTimeIn: '07:30 AM',
    originalTimeOut: 'n/a-',
    adjustedTimeIn: '07:00 AM',
    adjustedTimeOut: 'n/a-',
    breakIn: 'n/a-',
    breakOut: 'n/a-',
    adjustedBreakIn: 'n/a-',
    adjustedBreakOut: 'n/a-',
    reason: 'Mobile app sync delay',
    adjustedBy: 'Admin User',
    adjustmentDate: '2026-02-09 04:45 PM',
  },
  {
    id: '5',
    processId: 'TADJ-1005',
    email: 'jessica.williams@sparkle.local',
    storeName: 'Sparkle Timekeeping Satellite Office',
    date: '2026-02-08',
    originalTimeIn: '09:20 AM',
    originalTimeOut: '05:15 PM',
    adjustedTimeIn: '09:00 AM',
    adjustedTimeOut: '05:00 PM',
    breakIn: '12:40 PM',
    breakOut: '01:25 PM',
    adjustedBreakIn: '12:30 PM',
    adjustedBreakOut: '01:30 PM',
    reason: 'Power outage at store affected system',
    adjustedBy: 'Manager Thompson',
    adjustmentDate: '2026-02-08 06:00 PM',
  },
  {
    id: '6',
    processId: 'TADJ-1006',
    email: 'amanda.thompson@sparkle.local',
    storeName: 'Sparkle Timekeeping Logistics Hub',
    date: '2026-02-07',
    originalTimeIn: '09:05 AM',
    originalTimeOut: 'n/a-',
    adjustedTimeIn: '09:00 AM',
    adjustedTimeOut: 'n/a-',
    breakIn: 'n/a-',
    breakOut: 'n/a-',
    adjustedBreakIn: 'n/a-',
    adjustedBreakOut: 'n/a-',
    reason: 'Employee worked off-site, manual entry required',
    adjustedBy: 'Admin User',
    adjustmentDate: '2026-02-07 07:15 PM',
  },
  {
    id: '7',
    processId: 'TADJ-1007',
    email: 'kevin.ramos@sparkle.local',
    storeName: 'Sparkle Star International Corporation',
    date: '2026-02-06',
    originalTimeIn: '08:58 AM',
    originalTimeOut: '05:06 PM',
    adjustedTimeIn: '09:00 AM',
    adjustedTimeOut: '05:00 PM',
    breakIn: '12:04 PM',
    breakOut: '01:02 PM',
    adjustedBreakIn: '12:00 PM',
    adjustedBreakOut: '01:00 PM',
    reason: 'Biometric terminal drift correction',
    adjustedBy: 'Admin User',
    adjustmentDate: '2026-02-06 06:02 PM',
  },
  {
    id: '8',
    processId: 'TADJ-1008',
    email: 'nina.flores@sparkle.local',
    storeName: 'Sparkle Timekeeping Satellite Office',
    date: '2026-02-05',
    originalTimeIn: '09:12 AM',
    originalTimeOut: 'n/a-',
    adjustedTimeIn: '09:00 AM',
    adjustedTimeOut: 'n/a-',
    breakIn: 'n/a-',
    breakOut: 'n/a-',
    adjustedBreakIn: 'n/a-',
    adjustedBreakOut: 'n/a-',
    reason: 'Open shift pending sign-off',
    adjustedBy: 'Manager Thompson',
    adjustmentDate: '2026-02-05 05:40 PM',
  },
  {
    id: '9',
    processId: 'TADJ-1009',
    email: 'paolo.santos@sparkle.local',
    storeName: 'Sparkle Timekeeping Logistics Hub',
    date: '2026-02-04',
    originalTimeIn: '10:05 AM',
    originalTimeOut: '06:24 PM',
    adjustedTimeIn: '10:00 AM',
    adjustedTimeOut: '06:00 PM',
    breakIn: '01:14 PM',
    breakOut: '02:11 PM',
    adjustedBreakIn: '01:00 PM',
    adjustedBreakOut: '02:00 PM',
    reason: 'Manual rounding based on approved timesheet',
    adjustedBy: 'Admin User',
    adjustmentDate: '2026-02-04 07:10 PM',
  },
  {
    id: '10',
    processId: 'TADJ-1010',
    email: 'lea.mendoza@sparkle.local',
    storeName: 'Sparkle Star International Corporation',
    date: '2026-02-03',
    originalTimeIn: '07:48 AM',
    originalTimeOut: 'n/a-',
    adjustedTimeIn: '08:00 AM',
    adjustedTimeOut: 'n/a-',
    breakIn: 'n/a-',
    breakOut: 'n/a-',
    adjustedBreakIn: 'n/a-',
    adjustedBreakOut: 'n/a-',
    reason: 'Employee still on active shift; record not closed',
    adjustedBy: 'Admin User',
    adjustmentDate: '2026-02-03 04:55 PM',
  },
];

const storeOptions = [
  'All Stores',
  'Sparkle Star International Corporation',
  'Sparkle Timekeeping Satellite Office',
  'Sparkle Timekeeping Logistics Hub',
];

export function TimeAdjustmentPage() {
  const [actionConfig, setActionConfig] = useState<ActionFlowConfig | null>(null);
  const [adjustments, setAdjustments] = useState<TimeAdjustment[]>(initialAdjustments);
  const [filters, setFilters] = useState({
    storeName: 'All Stores',
    searchTerm: '',
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState<TimeAdjustment | null>(null);

  const filteredAdjustments = useMemo(() => {
    const keyword = appliedFilters.searchTerm.trim().toLowerCase();

    return adjustments.filter((adjustment) => {
      const matchesStore =
        appliedFilters.storeName === 'All Stores' || adjustment.storeName === appliedFilters.storeName;

      const matchesSearch =
        keyword.length === 0 ||
        adjustment.processId.toLowerCase().includes(keyword) ||
        adjustment.email.toLowerCase().includes(keyword);

      return matchesStore && matchesSearch;
    });
  }, [adjustments, appliedFilters]);

  const adjustmentsPagination = useTablePagination(filteredAdjustments);
  const paginatedAdjustments = adjustmentsPagination.paginatedItems;

  const handleSearch = () => {
    setAppliedFilters(filters);
  };

  const handleRefresh = () => {
    setAdjustments(initialAdjustments);
    const resetFilters = { storeName: 'All Stores', searchTerm: '' };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
  };

  const handleEditRecord = (adjustment: TimeAdjustment) => {
    setActionConfig({
      title: `Edit Record: ${adjustment.processId}`,
      description: 'Update placeholder values for this adjustment record.',
      actionLabel: 'Update',
      successActionVerb: 'updated',
      entityLabel: `record ${adjustment.processId}`,
      fields: [
        { key: 'email', label: 'Email', value: adjustment.email },
        {
          key: 'storeName',
          label: 'Store Name',
          type: 'select',
          value: adjustment.storeName,
          options: storeOptions.filter((store) => store !== 'All Stores'),
        },
        { key: 'date', label: 'Date', type: 'date', value: adjustment.date },
        { key: 'adjustedTimeIn', label: 'Adjusted Time-In', value: adjustment.adjustedTimeIn },
        { key: 'adjustedTimeOut', label: 'Adjusted Time-Out', value: adjustment.adjustedTimeOut },
        { key: 'adjustedBreakIn', label: 'Adjusted Break In', value: adjustment.adjustedBreakIn },
        { key: 'adjustedBreakOut', label: 'Adjusted Break Out', value: adjustment.adjustedBreakOut },
        { key: 'reason', label: 'Reason', value: adjustment.reason },
        { key: 'adjustedBy', label: 'Adjusted By', value: adjustment.adjustedBy },
      ],
      onApply: (values) => {
        setAdjustments((prev) =>
          prev.map((item) =>
            item.id === adjustment.id
              ? {
                  ...item,
                  email: values.email || item.email,
                  storeName: values.storeName || item.storeName,
                  date: values.date || item.date,
                  adjustedTimeIn: values.adjustedTimeIn || item.adjustedTimeIn,
                  adjustedTimeOut: values.adjustedTimeOut || item.adjustedTimeOut,
                  adjustedBreakIn: values.adjustedBreakIn || item.adjustedBreakIn,
                  adjustedBreakOut: values.adjustedBreakOut || item.adjustedBreakOut,
                  reason: values.reason || item.reason,
                  adjustedBy: values.adjustedBy || item.adjustedBy,
                }
              : item
          )
        );
      },
    });
  };

  const handleDeleteRecord = (adjustment: TimeAdjustment) => {
    setActionConfig({
      title: `Delete Record: ${adjustment.processId}`,
      description: 'This action removes the selected record from the table.',
      actionLabel: 'Delete',
      successActionVerb: 'deleted',
      entityLabel: `record ${adjustment.processId}`,
      fields: [
        { key: 'processId', label: 'Process ID', value: adjustment.processId },
        { key: 'email', label: 'Email', value: adjustment.email },
      ],
      onApply: () => {
        setAdjustments((prev) => prev.filter((item) => item.id !== adjustment.id));
      },
    });
  };

  const handleDeletePreviousRecord = (adjustment: TimeAdjustment) => {
    const currentIndex = adjustments.findIndex((item) => item.id === adjustment.id);
    const previousRecord = currentIndex > 0 ? adjustments[currentIndex - 1] : null;

    setActionConfig({
      title: `Delete Previous Record: ${adjustment.processId}`,
      description: 'This action removes the record immediately before the selected record.',
      actionLabel: 'Delete Previous',
      successActionVerb: 'deleted',
      entityLabel: previousRecord ? `previous record ${previousRecord.processId}` : 'no previous record',
      fields: previousRecord
        ? [
            { key: 'processId', label: 'Previous Process ID', value: previousRecord.processId },
            { key: 'email', label: 'Previous Email', value: previousRecord.email },
          ]
        : [{ key: 'notice', label: 'Notice', value: 'No previous record available for this row.' }],
      onApply: () => {
        if (!previousRecord) return;
        setAdjustments((prev) => prev.filter((item) => item.id !== previousRecord.id));
      },
    });
  };

  const handleViewSummary = (adjustment: TimeAdjustment) => {
    setSelectedAdjustment(adjustment);
    setIsSummaryOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_auto_auto] gap-3 items-end">
          <div>
            <label className="text-sm text-gray-600">Store Name</label>
            <select
              value={filters.storeName}
              onChange={(event) => setFilters((prev) => ({ ...prev, storeName: event.target.value }))}
              className="mt-1 h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
            >
              {storeOptions.map((store) => (
                <option key={store} value={store}>
                  {store}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600">Search (ID / Email)</label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by ID or email"
                className="pl-10"
                value={filters.searchTerm}
                onChange={(event) => setFilters((prev) => ({ ...prev, searchTerm: event.target.value }))}
              />
            </div>
          </div>

          <Button onClick={handleSearch} className="h-10 bg-[#1F4FD8] hover:bg-[#1845b8]">
            Search
          </Button>

          <Button type="button" variant="outline" onClick={() => setIsLogOpen(true)} className="h-10">
            Logs
          </Button>

          <Button type="button" variant="outline" size="icon" onClick={handleRefresh} className="h-10 w-10" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Time Adjustments</h3>
          <p className="text-sm text-gray-500 mt-1">Manual attendance corrections and adjustments</p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Process ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Original Time-In</TableHead>
                <TableHead>Original Time-Out</TableHead>
                <TableHead>Break In</TableHead>
                <TableHead>Break Out</TableHead>
                <TableHead>Adjusted Time-In</TableHead>
                <TableHead>Adjusted Time-Out</TableHead>
                <TableHead>Adjusted Break In</TableHead>
                <TableHead>Adjusted Break Out</TableHead>
                <TableHead>Reason for Adjustment</TableHead>
                <TableHead>Adjusted By</TableHead>
                <TableHead>Adjustment Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedAdjustments.map((adjustment) => (
                <TableRow key={adjustment.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-gray-900">{adjustment.processId}</TableCell>
                  <TableCell className="text-sm text-gray-600">{adjustment.email}</TableCell>
                  <TableCell className="text-sm text-gray-600">{adjustment.date}</TableCell>
                  <TableCell className="text-sm text-gray-600">{adjustment.originalTimeIn}</TableCell>
                  <TableCell className="text-sm text-gray-600">{adjustment.originalTimeOut}</TableCell>
                  <TableCell className="text-sm text-gray-600">{adjustment.breakIn}</TableCell>
                  <TableCell className="text-sm text-gray-600">{adjustment.breakOut}</TableCell>
                  <TableCell className="text-sm font-medium text-blue-600">{adjustment.adjustedTimeIn}</TableCell>
                  <TableCell className="text-sm font-medium text-blue-600">{adjustment.adjustedTimeOut}</TableCell>
                  <TableCell className="text-sm font-medium text-blue-600">{adjustment.adjustedBreakIn}</TableCell>
                  <TableCell className="text-sm font-medium text-blue-600">{adjustment.adjustedBreakOut}</TableCell>
                  <TableCell className="text-sm text-gray-900 max-w-xs">{adjustment.reason}</TableCell>
                  <TableCell className="text-sm text-gray-600">{adjustment.adjustedBy}</TableCell>
                  <TableCell className="text-sm text-gray-600">{adjustment.adjustmentDate}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewSummary(adjustment)}
                        className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRecord(adjustment)}
                        className="text-[#1F4FD8] hover:text-[#1F4FD8] hover:bg-blue-50"
                      >
                        <Edit3 className="w-4 h-4 mr-1" />
                        Edit Record
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRecord(adjustment)}
                        className="text-red-700 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete Record
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePreviousRecord(adjustment)}
                        className="text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                      >
                        <Undo2 className="w-4 h-4 mr-1" />
                        Delete Previous Record
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePaginationControls
            currentPage={adjustmentsPagination.currentPage}
            totalPages={adjustmentsPagination.totalPages}
            pageSize={adjustmentsPagination.pageSize}
            totalItems={adjustmentsPagination.totalItems}
            onPrevious={adjustmentsPagination.goToPreviousPage}
            onNext={adjustmentsPagination.goToNextPage}
            onPageChange={adjustmentsPagination.goToPage}
            onPageSizeChange={adjustmentsPagination.setPageSize}
          />
        </div>
      </div>

      <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
        <DialogContent className="!w-[calc(100vw-1rem)] !max-w-[calc(100vw-1rem)] !sm:max-w-[calc(100vw-1rem)] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Adjustment Log</DialogTitle>
            <DialogDescription>
              Email, process ID, adjustment timestamp, break entries, adjusted time entries, and reason.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[72vh] overflow-auto rounded-lg border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Process ID</TableHead>
                  <TableHead>Adjusted At</TableHead>
                  <TableHead>Break In</TableHead>
                  <TableHead>Break Out</TableHead>
                  <TableHead>Adjusted Time-In</TableHead>
                  <TableHead>Adjusted Time-Out</TableHead>
                  <TableHead>Adjusted Break In</TableHead>
                  <TableHead>Adjusted Break Out</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map((record) => (
                  <TableRow key={`log-${record.id}`}>
                    <TableCell className="text-sm text-gray-700">{record.email}</TableCell>
                    <TableCell className="font-medium text-gray-900">{record.processId}</TableCell>
                    <TableCell className="text-sm text-gray-700">{record.adjustmentDate}</TableCell>
                    <TableCell className="text-sm text-gray-700">{record.breakIn}</TableCell>
                    <TableCell className="text-sm text-gray-700">{record.breakOut}</TableCell>
                    <TableCell className="text-sm text-gray-700">{record.adjustedTimeIn}</TableCell>
                    <TableCell className="text-sm text-gray-700">{record.adjustedTimeOut}</TableCell>
                    <TableCell className="text-sm text-gray-700">{record.adjustedBreakIn}</TableCell>
                    <TableCell className="text-sm text-gray-700">{record.adjustedBreakOut}</TableCell>
                    <TableCell className="text-sm text-gray-700">{record.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button type="button" onClick={() => setIsLogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
        <DialogContent className="w-[96vw] max-w-[1200px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Time Adjustment Summary</DialogTitle>
            <DialogDescription>
              Full column summary for the selected user record.
            </DialogDescription>
          </DialogHeader>

          {selectedAdjustment && (
            <div className="max-h-[70vh] overflow-auto rounded-lg border border-gray-200 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div><span className="font-semibold text-gray-900">Process ID:</span> <span className="text-gray-700">{selectedAdjustment.processId}</span></div>
                <div><span className="font-semibold text-gray-900">Email:</span> <span className="text-gray-700">{selectedAdjustment.email}</span></div>
                <div><span className="font-semibold text-gray-900">Store Name:</span> <span className="text-gray-700">{selectedAdjustment.storeName}</span></div>
                <div><span className="font-semibold text-gray-900">Date:</span> <span className="text-gray-700">{selectedAdjustment.date}</span></div>
                <div><span className="font-semibold text-gray-900">Original Time-In:</span> <span className="text-gray-700">{selectedAdjustment.originalTimeIn}</span></div>
                <div><span className="font-semibold text-gray-900">Original Time-Out:</span> <span className="text-gray-700">{selectedAdjustment.originalTimeOut}</span></div>
                <div><span className="font-semibold text-gray-900">Break In:</span> <span className="text-gray-700">{selectedAdjustment.breakIn}</span></div>
                <div><span className="font-semibold text-gray-900">Break Out:</span> <span className="text-gray-700">{selectedAdjustment.breakOut}</span></div>
                <div><span className="font-semibold text-gray-900">Adjusted Time-In:</span> <span className="text-blue-700 font-medium">{selectedAdjustment.adjustedTimeIn}</span></div>
                <div><span className="font-semibold text-gray-900">Adjusted Time-Out:</span> <span className="text-blue-700 font-medium">{selectedAdjustment.adjustedTimeOut}</span></div>
                <div><span className="font-semibold text-gray-900">Adjusted Break In:</span> <span className="text-blue-700 font-medium">{selectedAdjustment.adjustedBreakIn}</span></div>
                <div><span className="font-semibold text-gray-900">Adjusted Break Out:</span> <span className="text-blue-700 font-medium">{selectedAdjustment.adjustedBreakOut}</span></div>
                <div className="md:col-span-2"><span className="font-semibold text-gray-900">Reason for Adjustment:</span> <span className="text-gray-700">{selectedAdjustment.reason}</span></div>
                <div><span className="font-semibold text-gray-900">Adjusted By:</span> <span className="text-gray-700">{selectedAdjustment.adjustedBy}</span></div>
                <div><span className="font-semibold text-gray-900">Adjustment Date:</span> <span className="text-gray-700">{selectedAdjustment.adjustmentDate}</span></div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" onClick={() => setIsSummaryOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ActionFlowModal config={actionConfig} onClose={() => setActionConfig(null)} />
    </div>
  );
}







