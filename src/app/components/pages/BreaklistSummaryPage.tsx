import { useMemo, useState } from 'react';
import { Calendar, Plus, Search, Trash2 } from 'lucide-react';
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

interface BreaklistSummaryRecord {
  id: string;
  employeeName: string;
  daysWork: number;
  hoursWork: number;
  tardinessMinutes: number;
  overtimeHours: number;
  nightDiffHours: number;
  rdWorkHours: number;
  legalHolidayHours: number;
  specialHolidayHours: number;
}

const initialRecords: BreaklistSummaryRecord[] = [
  {
    id: '1',
    employeeName: 'Juan Dela Cruz',
    daysWork: 22,
    hoursWork: 176,
    tardinessMinutes: 10,
    overtimeHours: 4,
    nightDiffHours: 2,
    rdWorkHours: 0,
    legalHolidayHours: 0,
    specialHolidayHours: 8,
  },
  {
    id: '2',
    employeeName: 'Maria Santos',
    daysWork: 21,
    hoursWork: 168,
    tardinessMinutes: 5,
    overtimeHours: 2,
    nightDiffHours: 0,
    rdWorkHours: 8,
    legalHolidayHours: 0,
    specialHolidayHours: 0,
  },
  {
    id: '3',
    employeeName: 'Carlo Reyes',
    daysWork: 20,
    hoursWork: 160,
    tardinessMinutes: 12,
    overtimeHours: 1,
    nightDiffHours: 4,
    rdWorkHours: 0,
    legalHolidayHours: 8,
    specialHolidayHours: 0,
  },
];

const defaultStores = [
  'Sparkle Star International Corporation',
  'Sparkle Timekeeping Satellite Office',
  'Sparkle Timekeeping Logistics Hub',
];

const formatNumber = (value: number, decimals: number) => value.toFixed(decimals);

export function BreaklistSummaryPage() {
  const [actionConfig, setActionConfig] = useState<ActionFlowConfig | null>(null);
  const [records] = useState<BreaklistSummaryRecord[]>(initialRecords);
  const [search, setSearch] = useState('');
  const [storeOptions, setStoreOptions] = useState(defaultStores);
  const [selectedStore, setSelectedStore] = useState(defaultStores[0]);
  const [fromDate, setFromDate] = useState('2026-02-12');
  const [toDate, setToDate] = useState('2026-02-12');

  const filteredRecords = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return records;
    return records.filter((record) => record.employeeName.toLowerCase().includes(keyword));
  }, [records, search]);

  const totals = useMemo(() => {
    return filteredRecords.reduce(
      (acc, record) => ({
        daysWork: acc.daysWork + record.daysWork,
        hoursWork: acc.hoursWork + record.hoursWork,
        tardinessMinutes: acc.tardinessMinutes + record.tardinessMinutes,
        overtimeHours: acc.overtimeHours + record.overtimeHours,
        nightDiffHours: acc.nightDiffHours + record.nightDiffHours,
        rdWorkHours: acc.rdWorkHours + record.rdWorkHours,
        legalHolidayHours: acc.legalHolidayHours + record.legalHolidayHours,
        specialHolidayHours: acc.specialHolidayHours + record.specialHolidayHours,
      }),
      {
        daysWork: 0,
        hoursWork: 0,
        tardinessMinutes: 0,
        overtimeHours: 0,
        nightDiffHours: 0,
        rdWorkHours: 0,
        legalHolidayHours: 0,
        specialHolidayHours: 0,
      }
    );
  }, [filteredRecords]);

  const handleAddStore = () => {
    setActionConfig({
      title: 'Add Store',
      description: 'Add a store placeholder for Breaklist Summary filtering.',
      actionLabel: 'Save',
      successActionVerb: 'added',
      entityLabel: 'a store option',
      fields: [{ key: 'storeName', label: 'Store Name', value: 'Sparkle Timekeeping New Branch' }],
      onApply: (values) => {
        const nextStore = values.storeName?.trim() || 'Sparkle Timekeeping New Branch';
        setStoreOptions((prev) => {
          if (prev.includes(nextStore)) return prev;
          return [...prev, nextStore];
        });
        setSelectedStore(nextStore);
      },
    });
  };

  const handleRemoveStore = () => {
    setActionConfig({
      title: 'Remove Store',
      description: 'Remove the selected store placeholder from the list.',
      actionLabel: 'Remove',
      successActionVerb: 'removed',
      entityLabel: `${selectedStore}`,
      fields: [{ key: 'storeName', label: 'Store Name', value: selectedStore }],
      onApply: () => {
        setStoreOptions((prev) => {
          if (prev.length <= 1) return prev;
          const filtered = prev.filter((store) => store !== selectedStore);
          if (filtered.length > 0) {
            setSelectedStore(filtered[0]);
          }
          return filtered.length > 0 ? filtered : prev;
        });
      },
    });
  };

  const handleGenerate = () => {
    setActionConfig({
      title: 'Generate Breaklist Summary',
      description: 'Generate the summary using placeholder date range and store filters.',
      actionLabel: 'Generate',
      successActionVerb: 'generated',
      entityLabel: 'the breaklist summary',
      fields: [
        { key: 'store', label: 'Store', value: selectedStore },
        { key: 'fromDate', label: 'From', type: 'date', value: fromDate },
        { key: 'toDate', label: 'To', type: 'date', value: toDate },
      ],
      onApply: (values) => {
        setFromDate(values.fromDate || fromDate);
        setToDate(values.toDate || toDate);
      },
    });
  };

  const breaklistSummaryPagination = useTablePagination(filteredRecords);
  const paginatedRecords = breaklistSummaryPagination.paginatedItems;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 lg:p-6 space-y-4">
        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_auto_auto_220px_220px_auto] gap-3 items-end">
          <div>
            <label className="text-sm text-gray-600">Store</label>
            <select
              value={selectedStore}
              onChange={(event) => setSelectedStore(event.target.value)}
              className="mt-1 h-11 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
            >
              {storeOptions.map((store) => (
                <option key={store} value={store}>
                  {store}
                </option>
              ))}
            </select>
          </div>

          <Button variant="outline" size="icon" onClick={handleAddStore} className="h-11 w-11">
            <Plus className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleRemoveStore} className="h-11 w-11" disabled={storeOptions.length <= 1}>
            <Trash2 className="w-4 h-4" />
          </Button>

          <div className="relative">
            <label className="text-sm text-gray-600">From</label>
            <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="mt-1 h-11 pr-10" />
            <Calendar className="absolute right-3 top-[38px] w-4 h-4 text-gray-500" />
          </div>

          <div className="relative">
            <label className="text-sm text-gray-600">To</label>
            <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="mt-1 h-11 pr-10" />
            <Calendar className="absolute right-3 top-[38px] w-4 h-4 text-gray-500" />
          </div>

          <Button className="h-11" onClick={handleGenerate}>Generate</Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search"
            className="pl-10 h-11"
          />
        </div>

        <div className="rounded-lg border border-gray-200 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee Name</TableHead>
                <TableHead>Days Work</TableHead>
                <TableHead>Hours Work</TableHead>
                <TableHead>Tardiness (Minutes)</TableHead>
                <TableHead>Overtime (Hours)</TableHead>
                <TableHead>Night Diff (Hours)</TableHead>
                <TableHead>RD Work (Hours)</TableHead>
                <TableHead>Legal Holiday (Hours)</TableHead>
                <TableHead>Special Holiday (Hours)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRecords.map((record) => (
                <TableRow key={record.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-gray-900">{record.employeeName}</TableCell>
                  <TableCell>{formatNumber(record.daysWork, 1)}</TableCell>
                  <TableCell>{formatNumber(record.hoursWork, 2)}</TableCell>
                  <TableCell>{formatNumber(record.tardinessMinutes, 2)}</TableCell>
                  <TableCell>{formatNumber(record.overtimeHours, 2)}</TableCell>
                  <TableCell>{formatNumber(record.nightDiffHours, 2)}</TableCell>
                  <TableCell>{formatNumber(record.rdWorkHours, 2)}</TableCell>
                  <TableCell>{formatNumber(record.legalHolidayHours, 2)}</TableCell>
                  <TableCell>{formatNumber(record.specialHolidayHours, 2)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-gray-100 font-semibold">
                <TableCell>Total</TableCell>
                <TableCell>{formatNumber(totals.daysWork, 1)}</TableCell>
                <TableCell>{formatNumber(totals.hoursWork, 2)}</TableCell>
                <TableCell>{formatNumber(totals.tardinessMinutes, 2)}</TableCell>
                <TableCell>{formatNumber(totals.overtimeHours, 2)}</TableCell>
                <TableCell>{formatNumber(totals.nightDiffHours, 2)}</TableCell>
                <TableCell>{formatNumber(totals.rdWorkHours, 2)}</TableCell>
                <TableCell>{formatNumber(totals.legalHolidayHours, 2)}</TableCell>
                <TableCell>{formatNumber(totals.specialHolidayHours, 2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
<TablePaginationControls
  currentPage={breaklistSummaryPagination.currentPage}
  totalPages={breaklistSummaryPagination.totalPages}
  pageSize={breaklistSummaryPagination.pageSize}
  totalItems={breaklistSummaryPagination.totalItems}
  onPrevious={breaklistSummaryPagination.goToPreviousPage}
  onNext={breaklistSummaryPagination.goToNextPage}
  onPageChange={breaklistSummaryPagination.goToPage}
  onPageSizeChange={breaklistSummaryPagination.setPageSize}
/>
        </div>
      </div>

      <ActionFlowModal config={actionConfig} onClose={() => setActionConfig(null)} />
    </div>
  );
}




