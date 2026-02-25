import { useMemo, useState } from 'react';
import { Search, Filter, Calendar, Eye, Download, CheckCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
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

interface GeneratedBreaklist {
  id: string;
  generatedBy: string;
  store: string;
  dateRange: string;
  employeeCount: number;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedAt: string;
  approvedBy: string;
  notificationRecipient: string;
}

const stores = ['Headquarters', 'Store 1 - Downtown', 'Store 2 - Uptown', 'Store 3 - Westside'] as const;
const generators = ['Admin User', 'Manager Thompson', 'Operations Lead'] as const;
const recipients: Record<(typeof stores)[number], string> = {
  Headquarters: 'hq-team@company.com',
  'Store 1 - Downtown': 'store1-team@company.com',
  'Store 2 - Uptown': 'store2-team@company.com',
  'Store 3 - Westside': 'store3-team@company.com',
};

const formatDateTime = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours24 = date.getHours();
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  const meridiem = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${year}-${month}-${day} ${hours12.toString().padStart(2, '0')}:${minutes} ${meridiem}`;
};

const formatRangeLabel = (start: Date, end: Date) => {
  const monthShort = start.toLocaleString('en-US', { month: 'short' });
  return `${monthShort} ${start.getDate()}-${end.getDate()}, ${end.getFullYear()}`;
};

const mockGeneratedBreklists: GeneratedBreaklist[] = Array.from({ length: 40 }, (_, index) => {
  const store = stores[index % stores.length];
  const generatedBy = generators[index % generators.length];
  const status: GeneratedBreaklist['status'] =
    index % 7 === 0 ? 'rejected' : index % 4 === 0 ? 'pending' : 'approved';
  const periodStart = new Date(2025, 10 + (index % 4), 1 + ((index % 2) * 15));
  const periodEnd = new Date(periodStart);
  periodEnd.setDate(periodStart.getDate() + 13);
  const createdAtObj = new Date(periodEnd);
  createdAtObj.setHours(14 + (index % 5), (index * 9) % 60, 0, 0);
  const approvedAtObj = new Date(createdAtObj);
  approvedAtObj.setMinutes(createdAtObj.getMinutes() + 30 + (index % 20));

  return {
    id: `gen-${index + 1}`,
    generatedBy,
    store,
    dateRange: formatRangeLabel(periodStart, periodEnd),
    employeeCount: 18 + ((index * 3) % 42),
    createdAt: formatDateTime(createdAtObj),
    status,
    approvedAt: status === 'pending' ? '-' : formatDateTime(approvedAtObj),
    approvedBy: status === 'pending' ? '-' : (index % 2 === 0 ? 'Admin User' : 'Manager Thompson'),
    notificationRecipient: recipients[store],
  };
});

export function GeneratedBreaklistPage() {
  const [generatedBreaklists, setGeneratedBreaklists] = useState(mockGeneratedBreklists);
  const [actionConfig, setActionConfig] = useState<ActionFlowConfig | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    store: 'all',
    status: 'all',
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const handleGenerateBreaklist = () => {
    setActionConfig({
      title: 'Generate New Breaklist',
      description: 'Set placeholder values for breaklist generation.',
      actionLabel: 'Generate',
      successActionVerb: 'generated',
      entityLabel: 'a new breaklist',
      fields: [
        { key: 'store', label: 'Store', value: 'Store 1 - Downtown' },
        { key: 'dateRange', label: 'Date Range', value: 'Feb 16-29, 2026' },
        { key: 'employeeCount', label: 'Employee Count', type: 'number', value: '40' },
      ],
      onApply: (values) => {
        const createdAt = new Date().toLocaleString();
        const newBreaklist: GeneratedBreaklist = {
          id: `gen-${Date.now()}`,
          generatedBy: 'Admin User',
          store: values.store || 'Store 1 - Downtown',
          dateRange: values.dateRange || 'Feb 16-29, 2026',
          employeeCount: Number(values.employeeCount) || 40,
          createdAt,
          status: 'pending',
          approvedAt: '-',
          approvedBy: '-',
          notificationRecipient: 'operations@company.com',
        };

        setGeneratedBreaklists((prev) => [newBreaklist, ...prev]);
      },
    });
  };

  const handleViewBreaklist = (breaklist: GeneratedBreaklist) => {
    setActionConfig({
      title: `View Breaklist: ${breaklist.store}`,
      description: 'This section is view-only.',
      readOnly: true,
      fields: [
        { key: 'dateRange', label: 'Date Range', value: breaklist.dateRange },
        { key: 'employeeCount', label: 'Employee Count', type: 'number', value: String(breaklist.employeeCount) },
        { key: 'recipient', label: 'Notification Recipient', value: breaklist.notificationRecipient },
      ],
    });
  };

  const handleDownloadBreaklist = (breaklist: GeneratedBreaklist) => {
    setActionConfig({
      title: `Download Breaklist: ${breaklist.store}`,
      description: 'Select placeholder download options.',
      actionLabel: 'Download',
      successActionVerb: 'downloaded',
      entityLabel: `the breaklist file for ${breaklist.store}`,
      fields: [
        { key: 'fileType', label: 'File Type', type: 'select', value: 'JSON', options: ['JSON', 'CSV', 'PDF'] },
        { key: 'includeMeta', label: 'Include Metadata', type: 'select', value: 'Yes', options: ['Yes', 'No'] },
      ],
      onApply: () => {
        const content = JSON.stringify(breaklist, null, 2);
        const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `breaklist-${breaklist.id}.json`;
        link.click();
        URL.revokeObjectURL(url);
      },
    });
  };

  const handleApproveBreaklist = (breaklist: GeneratedBreaklist) => {
    setActionConfig({
      title: `Approve Breaklist: ${breaklist.store}`,
      description: 'Update placeholder approval values.',
      actionLabel: 'Approve',
      successActionVerb: 'approved',
      entityLabel: `the breaklist for ${breaklist.store}`,
      fields: [
        { key: 'approvedBy', label: 'Approved By', value: 'Admin User' },
        { key: 'notes', label: 'Approval Notes', value: 'Approved for publishing' },
      ],
      onApply: () => {
        const approvedAt = new Date().toLocaleString();
        setGeneratedBreaklists((prev) =>
          prev.map((item) =>
            item.id === breaklist.id
              ? { ...item, status: 'approved', approvedAt, approvedBy: 'Admin User' }
              : item
          )
        );
      },
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      approved: { label: 'Approved', className: 'bg-green-100 text-green-700' },
      pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
      rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
    };

    const config = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
    
    return (
      <Badge className={`${config.className} hover:${config.className} text-xs`}>
        {config.label}
      </Badge>
    );
  };

  const filteredBreaklists = useMemo(() => {
    return generatedBreaklists.filter((breaklist) => {
      const searchLower = appliedFilters.search.trim().toLowerCase();
      const matchesSearch =
        searchLower.length === 0 ||
        breaklist.store.toLowerCase().includes(searchLower) ||
        breaklist.generatedBy.toLowerCase().includes(searchLower) ||
        breaklist.notificationRecipient.toLowerCase().includes(searchLower);

      const storeValueMap: Record<string, string> = {
        'Headquarters': 'hq',
        'Store 1 - Downtown': 'store1',
        'Store 2 - Uptown': 'store2',
        'Store 3 - Westside': 'store3',
      };
      const currentStore = storeValueMap[breaklist.store] ?? 'hq';
      const matchesStore =
        appliedFilters.store === 'all' ||
        currentStore === appliedFilters.store;

      const matchesStatus =
        appliedFilters.status === 'all' ||
        breaklist.status === appliedFilters.status;

      return matchesSearch && matchesStore && matchesStatus;
    });
  }, [generatedBreaklists, appliedFilters]);

  const generatedBreaklistsPagination = useTablePagination(filteredBreaklists);
  const paginatedBreaklists = generatedBreaklistsPagination.paginatedItems;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          <div className="relative">
            <Select
              value={filters.store}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, store: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Store" />
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
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleGenerateBreaklist} className="bg-[#1F4FD8] hover:bg-[#1845b8]">
            Generate New Breaklist
          </Button>
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="button" variant="outline" onClick={() => setAppliedFilters(filters)}>
            Apply Filters
          </Button>
        </div>
      </div>

      {/* Generated Breaklist Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Generated Breaklists</h3>
          <p className="text-sm text-gray-500 mt-1">View and manage generated employee breaklists</p>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Generated By</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Date Range</TableHead>
                <TableHead>Employee Count</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approved At</TableHead>
                <TableHead>Approved By</TableHead>
                <TableHead>Notification Recipient</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedBreaklists.map((breaklist) => (
                <TableRow key={breaklist.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-gray-900">
                    {breaklist.generatedBy}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {breaklist.store}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {breaklist.dateRange}
                  </TableCell>
                  <TableCell className="text-sm text-gray-900">
                    {breaklist.employeeCount}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {breaklist.createdAt}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(breaklist.status)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {breaklist.approvedAt}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {breaklist.approvedBy}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {breaklist.notificationRecipient}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewBreaklist(breaklist)}
                        className="text-[#1F4FD8] hover:text-[#1F4FD8] hover:bg-blue-50"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadBreaklist(breaklist)}
                        className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      {breaklist.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleApproveBreaklist(breaklist)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
<TablePaginationControls
  currentPage={generatedBreaklistsPagination.currentPage}
  totalPages={generatedBreaklistsPagination.totalPages}
  pageSize={generatedBreaklistsPagination.pageSize}
  totalItems={generatedBreaklistsPagination.totalItems}
  onPrevious={generatedBreaklistsPagination.goToPreviousPage}
  onNext={generatedBreaklistsPagination.goToNextPage}
  onPageChange={generatedBreaklistsPagination.goToPage}
  onPageSizeChange={generatedBreaklistsPagination.setPageSize}
/>
        </div>
      </div>
      <ActionFlowModal config={actionConfig} onClose={() => setActionConfig(null)} />
    </div>
  );
}




