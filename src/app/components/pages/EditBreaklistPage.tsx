import { useMemo, useState } from 'react';
import { Search, Filter, Eye, Edit, Trash2 } from 'lucide-react';
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

interface EditableBreaklist {
  id: string;
  generatedBy: string;
  store: string;
  dateRange: string;
  employeeCount: number;
  createdAt: string;
  status: 'draft' | 'pending-review' | 'finalized';
  lastActionTaken: string;
}

const mockEditableBreklists: EditableBreaklist[] = [
  {
    id: '1',
    generatedBy: 'Admin User',
    store: 'Store 1 - Downtown',
    dateRange: 'Feb 16-28, 2026',
    employeeCount: 45,
    createdAt: '2026-02-12 10:30 AM',
    status: 'draft',
    lastActionTaken: 'Created draft',
  },
  {
    id: '2',
    generatedBy: 'Manager Thompson',
    store: 'Store 2 - Uptown',
    dateRange: 'Feb 16-28, 2026',
    employeeCount: 32,
    createdAt: '2026-02-12 11:00 AM',
    status: 'draft',
    lastActionTaken: 'Created draft',
  },
  {
    id: '3',
    generatedBy: 'Admin User',
    store: 'Headquarters',
    dateRange: 'Feb 16-28, 2026',
    employeeCount: 28,
    createdAt: '2026-02-11 02:15 PM',
    status: 'pending-review',
    lastActionTaken: 'Submitted for review',
  },
  {
    id: '4',
    generatedBy: 'Admin User',
    store: 'Store 3 - Westside',
    dateRange: 'Feb 1-15, 2026',
    employeeCount: 18,
    createdAt: '2026-02-10 04:00 PM',
    status: 'finalized',
    lastActionTaken: 'Finalized and locked',
  },
];

export function EditBreaklistPage() {
  const [editableBreaklists, setEditableBreaklists] = useState(mockEditableBreklists);
  const [actionConfig, setActionConfig] = useState<ActionFlowConfig | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    store: 'all',
    status: 'all',
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const handleEditBreaklist = (breaklist: EditableBreaklist) => {
    setActionConfig({
      title: `Edit Draft Breaklist: ${breaklist.store}`,
      description: 'Update draft breaklist placeholder fields.',
      actionLabel: 'Update',
      successActionVerb: 'updated',
      entityLabel: `the draft breaklist for ${breaklist.store}`,
      fields: [
        { key: 'dateRange', label: 'Date Range', value: breaklist.dateRange },
        { key: 'employeeCount', label: 'Employee Count', type: 'number', value: String(breaklist.employeeCount) },
        { key: 'lastAction', label: 'Last Action', value: breaklist.lastActionTaken },
      ],
      onApply: (values) => {
        const employeeCount = Number(values.employeeCount);
        setEditableBreaklists((prev) =>
          prev.map((item) =>
            item.id === breaklist.id
              ? {
                  ...item,
                  dateRange: values.dateRange || item.dateRange,
                  employeeCount: Number.isNaN(employeeCount) ? item.employeeCount : employeeCount,
                  lastActionTaken: values.lastAction || item.lastActionTaken,
                }
              : item
          )
        );
      },
    });
  };

  const handleDeleteBreaklist = (breaklist: EditableBreaklist) => {
    setActionConfig({
      title: `Archive Draft Breaklist: ${breaklist.store}`,
      description: 'Review placeholder archive details before applying.',
      actionLabel: 'Archive',
      successActionVerb: 'archived',
      entityLabel: `the draft breaklist for ${breaklist.store}`,
      fields: [
        { key: 'reason', label: 'Archive Reason', value: 'Superseded by updated draft' },
        { key: 'retention', label: 'Retention Label', value: '30 days' },
      ],
      onApply: () => {
        setEditableBreaklists((prev) => prev.filter((item) => item.id !== breaklist.id));
      },
    });
  };

  const handleViewBreaklist = (breaklist: EditableBreaklist) => {
    setActionConfig({
      title: `View Breaklist: ${breaklist.store}`,
      description: 'This section is view-only.',
      readOnly: true,
      fields: [
        { key: 'status', label: 'Status', type: 'select', value: breaklist.status, options: ['draft', 'pending-review', 'finalized'] },
        { key: 'notes', label: 'Review Notes', value: breaklist.lastActionTaken },
      ],
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
      'pending-review': { label: 'Pending Review', className: 'bg-amber-100 text-amber-700' },
      finalized: { label: 'Finalized', className: 'bg-green-100 text-green-700' },
    };

    const config = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
    
    return (
      <Badge className={`${config.className} hover:${config.className} text-xs`}>
        {config.label}
      </Badge>
    );
  };

  const filteredBreaklists = useMemo(() => {
    return editableBreaklists.filter((breaklist) => {
      const searchLower = appliedFilters.search.trim().toLowerCase();
      const matchesSearch =
        searchLower.length === 0 ||
        breaklist.store.toLowerCase().includes(searchLower) ||
        breaklist.generatedBy.toLowerCase().includes(searchLower);

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
  }, [editableBreaklists, appliedFilters]);

  const editBreaklistsPagination = useTablePagination(filteredBreaklists);
  const paginatedBreaklists = editBreaklistsPagination.paginatedItems;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending-review">Pending Review</SelectItem>
                <SelectItem value="finalized">Finalized</SelectItem>
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

      {/* Edit Breaklist Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Edit Breaklist</h3>
          <p className="text-sm text-gray-500 mt-1">Modify and manage breaklists before finalization</p>
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
                <TableHead>Last Action Taken</TableHead>
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
                    {breaklist.lastActionTaken}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {breaklist.status === 'draft' ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditBreaklist(breaklist)}
                            className="text-[#1F4FD8] hover:text-[#1F4FD8] hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBreaklist(breaklist)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewBreaklist(breaklist)}
                          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
<TablePaginationControls
  currentPage={editBreaklistsPagination.currentPage}
  totalPages={editBreaklistsPagination.totalPages}
  pageSize={editBreaklistsPagination.pageSize}
  totalItems={editBreaklistsPagination.totalItems}
  onPrevious={editBreaklistsPagination.goToPreviousPage}
  onNext={editBreaklistsPagination.goToNextPage}
  onPageChange={editBreaklistsPagination.goToPage}
  onPageSizeChange={editBreaklistsPagination.setPageSize}
/>
        </div>
      </div>
      <ActionFlowModal config={actionConfig} onClose={() => setActionConfig(null)} />
    </div>
  );
}




