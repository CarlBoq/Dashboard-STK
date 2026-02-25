import { useMemo, useState } from 'react';
import { Search, Filter, Eye, Edit, Archive, QrCode } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { ActionFlowModal, type ActionFlowConfig } from '../ActionFlowModal';
import { Dialog, DialogContent } from '../ui/dialog';
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
import { dashboardUsers, type DashboardUser } from '../../data/timekeepingData';

const QR_SIZE = 29;

function buildExampleQr(seed: string): boolean[][] {
  const matrix = Array.from({ length: QR_SIZE }, () => Array<boolean>(QR_SIZE).fill(false));
  const reserved = Array.from({ length: QR_SIZE }, () => Array<boolean>(QR_SIZE).fill(false));

  const drawFinder = (rowStart: number, colStart: number) => {
    for (let row = rowStart; row < rowStart + 7; row += 1) {
      for (let col = colStart; col < colStart + 7; col += 1) {
        const topOrBottom = row === rowStart || row === rowStart + 6;
        const leftOrRight = col === colStart || col === colStart + 6;
        const inner = row >= rowStart + 2 && row <= rowStart + 4 && col >= colStart + 2 && col <= colStart + 4;
        matrix[row][col] = topOrBottom || leftOrRight || inner;
        reserved[row][col] = true;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, QR_SIZE - 7);
  drawFinder(QR_SIZE - 7, 0);

  let hash = 7;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 2147483647;
  }

  for (let row = 0; row < QR_SIZE; row += 1) {
    for (let col = 0; col < QR_SIZE; col += 1) {
      if (reserved[row][col]) continue;
      hash = (hash * 48271) % 2147483647;
      matrix[row][col] = hash % 3 !== 0;
    }
  }

  return matrix;
}

export function UsersPage() {
  const [actionConfig, setActionConfig] = useState<ActionFlowConfig | null>(null);
  const [users, setUsers] = useState<DashboardUser[]>(dashboardUsers);
  const [qrUser, setQrUser] = useState<DashboardUser | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    company: 'all',
    role: 'all',
    status: 'all',
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const handleEditUser = (user: DashboardUser) => {
    setActionConfig({
      title: `Edit User: ${user.name}`,
      description: 'Update user placeholder fields.',
      actionLabel: 'Update',
      successActionVerb: 'updated',
      entityLabel: `the user profile for ${user.name}`,
      fields: [
        { key: 'role', label: 'Role', value: user.role },
        { key: 'status', label: 'Status', type: 'select', value: user.accountStatus, options: ['active', 'suspended', 'inactive'] },
        { key: 'company', label: 'Company', value: user.company },
      ],
      onApply: (values) => {
        setUsers((prev) =>
          prev.map((item) =>
            item.id === user.id
              ? {
                  ...item,
                  role: values.role || item.role,
                  accountStatus: (values.status as DashboardUser['accountStatus']) || item.accountStatus,
                  company: values.company || item.company,
                }
              : item
          )
        );
      },
    });
  };

  const handleViewUser = (user: DashboardUser) => {
    setActionConfig({
      title: `View User Details: ${user.name}`,
      description: 'This section is view-only.',
      readOnly: true,
      fields: [
        { key: 'email', label: 'Email', value: user.email },
        { key: 'phone', label: 'Phone', value: user.phone },
        { key: 'verified', label: 'Verified', value: user.verificationStatus },
      ],
    });
  };

  const handleArchiveUser = (user: DashboardUser) => {
    setActionConfig({
      title: `Archive User: ${user.name}`,
      description: 'Archive user placeholder action.',
      actionLabel: 'Archive',
      successActionVerb: 'archived',
      entityLabel: `the user ${user.name}`,
      fields: [
        { key: 'reason', label: 'Archive Reason', value: 'Inactive account' },
        { key: 'status', label: 'Status', type: 'select', value: 'inactive', options: ['inactive', 'suspended'] },
      ],
      onApply: (values) => {
        setUsers((prev) =>
          prev.map((item) =>
            item.id === user.id
              ? {
                  ...item,
                  accountStatus: (values.status as DashboardUser['accountStatus']) || 'inactive',
                }
              : item
          )
        );
      },
    });
  };

  const getVerificationBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      verified: { label: 'Verified', className: 'bg-green-100 text-green-700' },
      pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
      unverified: { label: 'Unverified', className: 'bg-red-100 text-red-700' },
    };

    const config = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
    return <Badge className={`${config.className} hover:${config.className} text-xs`}>{config.label}</Badge>;
  };

  const getAccountStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      active: { label: 'Active', className: 'bg-green-100 text-green-700' },
      suspended: { label: 'Suspended', className: 'bg-red-100 text-red-700' },
      inactive: { label: 'Inactive', className: 'bg-gray-100 text-gray-700' },
    };

    const config = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
    return <Badge className={`${config.className} hover:${config.className} text-xs`}>{config.label}</Badge>;
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchLower = appliedFilters.search.trim().toLowerCase();
      const matchesSearch =
        searchLower.length === 0 ||
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower);

      const matchesCompany = appliedFilters.company === 'all' || user.company.toLowerCase() === appliedFilters.company;
      const normalizedRole = user.role.toLowerCase().replace(/\s+/g, '-');
      const matchesRole = appliedFilters.role === 'all' || normalizedRole === appliedFilters.role;
      const matchesStatus = appliedFilters.status === 'all' || user.accountStatus === appliedFilters.status;

      return matchesSearch && matchesCompany && matchesRole && matchesStatus;
    });
  }, [users, appliedFilters]);

  const qrMatrix = useMemo(() => {
    if (!qrUser) return [];
    return buildExampleQr(`${qrUser.id}-${qrUser.name}`);
  }, [qrUser]);

  const usersPagination = useTablePagination(filteredUsers);
  const paginatedUsers = usersPagination.paginatedItems;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              className="pl-10"
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            />
          </div>

          <div className="relative">
            <Select value={filters.company} onValueChange={(value) => setFilters((prev) => ({ ...prev, company: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                <SelectItem value="techcorp">TechCorp</SelectItem>
                <SelectItem value="retailco">RetailCo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Select value={filters.role} onValueChange={(value) => setFilters((prev) => ({ ...prev, role: value }))}>
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="team-leader">Team Leader</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
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
          <h3 className="text-lg font-semibold text-gray-900">Active Users</h3>
          <p className="text-sm text-gray-500 mt-1">Manage employee accounts and information</p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email address</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>QR Code</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-gray-900">{user.name}</TableCell>
                  <TableCell className="text-sm text-gray-600">{user.email}</TableCell>
                  <TableCell className="text-sm text-gray-600">{user.company}</TableCell>
                  <TableCell className="text-sm text-gray-600">{user.phone}</TableCell>
                  <TableCell className="text-sm text-gray-900">{user.role}</TableCell>
                  <TableCell>{getVerificationBadge(user.verificationStatus)}</TableCell>
                  <TableCell>{getAccountStatusBadge(user.accountStatus)}</TableCell>
                  <TableCell>
                    {user.missingDocuments > 0 ? (
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">{user.missingDocuments} Missing</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">Complete</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQrUser(user)}
                      className="text-[#1F4FD8] hover:text-[#1F4FD8] hover:bg-blue-50"
                    >
                      <QrCode className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{user.lastTimeIn}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        className="text-[#1F4FD8] hover:text-[#1F4FD8] hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewUser(user)}
                        className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleArchiveUser(user)}
                        className="text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                      >
                        <Archive className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
<TablePaginationControls
  currentPage={usersPagination.currentPage}
  totalPages={usersPagination.totalPages}
  pageSize={usersPagination.pageSize}
  totalItems={usersPagination.totalItems}
  onPrevious={usersPagination.goToPreviousPage}
  onNext={usersPagination.goToNextPage}
  onPageChange={usersPagination.goToPage}
  onPageSizeChange={usersPagination.setPageSize}
/>
        </div>
      </div>

      <ActionFlowModal config={actionConfig} onClose={() => setActionConfig(null)} />

      <Dialog open={Boolean(qrUser)} onOpenChange={(open) => !open && setQrUser(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          {qrUser && (
            <div className="bg-[#efefef] px-8 py-6">
              <h3 className="text-3xl font-semibold text-center text-gray-800 mb-6">{qrUser.name}</h3>
              <div className="mx-auto w-fit bg-white p-3">
                <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${QR_SIZE}, 9px)` }}>
                  {qrMatrix.flatMap((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={cell ? 'bg-black w-[9px] h-[9px]' : 'bg-white w-[9px] h-[9px]'}
                      />
                    ))
                  )}
                </div>
              </div>
              <div className="mt-6">
                <button
                  type="button"
                  className="w-full rounded-xl bg-[#4cd92b] text-[#0f2a0f] text-2xl font-semibold py-4 shadow-sm"
                >
                  Print QR
                  <br />
                  For {qrUser.name}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}




