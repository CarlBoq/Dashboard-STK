import { useMemo, useState } from 'react';
import { Search, Filter, Eye, RotateCcw } from 'lucide-react';
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

interface ArchivedUser {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  archiveDate: string;
  lastTimeInRecorded: string;
  lastWorkingDay: string;
  archiveReason: string;
}

const archivedUserSeed = [
  'John Smith',
  'Maria Garcia',
  'James Wilson',
  'Lisa Anderson',
  'Thomas Brown',
  'Patricia Davis',
  'Anthony Rivera',
  'Grace Villanueva',
  'Brian Scott',
  'Naomi Lopez',
  'Paul Reyes',
  'Erica Santos',
  'Kenneth Lim',
  'Faith Molina',
  'Jordan Lee',
  'Trisha Bautista',
  'Carl Navarro',
  'Aira Cruz',
  'Noah Gonzales',
  'Megan Yap',
];

const archiveReasons = [
  'Resignation',
  'Contract Ended',
  'Termination',
  'Transferred to Another Branch',
  'Retirement',
  'Personal Reasons',
] as const;

const roles = ['Employee', 'Employee', 'Team Leader', 'Manager'] as const;

const mockArchivedUsers: ArchivedUser[] = Array.from({ length: 48 }, (_, index) => {
  const baseName = archivedUserSeed[index % archivedUserSeed.length];
  const company = index % 2 === 0 ? 'TechCorp' : 'RetailCo';
  const role = roles[index % roles.length];
  const archiveDateObj = new Date(2025, 10 + (index % 4), 1 + ((index * 3) % 27));
  const lastWorkingDayObj = new Date(archiveDateObj);
  lastWorkingDayObj.setDate(archiveDateObj.getDate() - 1);
  const formattedArchiveDate = archiveDateObj.toISOString().slice(0, 10);
  const formattedLastDay = lastWorkingDayObj.toISOString().slice(0, 10);
  const clockInHour = 7 + (index % 4);
  const clockInMinute = (index * 7) % 60;
  const ampm = clockInHour >= 12 ? 'PM' : 'AM';
  const hour12 = clockInHour % 12 === 0 ? 12 : clockInHour % 12;

  return {
    id: `arch-${index + 1}`,
    name: `${baseName} ${index >= archivedUserSeed.length ? `#${Math.floor(index / archivedUserSeed.length) + 1}` : ''}`.trim(),
    email: `${baseName.toLowerCase().replace(/\s+/g, '.')}+${index + 1}@${company.toLowerCase()}.com`,
    company,
    role,
    archiveDate: formattedArchiveDate,
    lastTimeInRecorded: `${formattedLastDay} ${hour12.toString().padStart(2, '0')}:${clockInMinute.toString().padStart(2, '0')} ${ampm}`,
    lastWorkingDay: formattedLastDay,
    archiveReason: archiveReasons[index % archiveReasons.length],
  };
});

export function ArchivedUsersPage() {
  const [archivedUsers, setArchivedUsers] = useState(mockArchivedUsers);
  const [actionConfig, setActionConfig] = useState<ActionFlowConfig | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    company: 'all',
    reason: 'all',
    archiveDate: '',
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const handleViewUser = (user: ArchivedUser) => {
    setActionConfig({
      title: `View Archived User: ${user.name}`,
      description: 'This section is view-only.',
      readOnly: true,
      fields: [
        { key: 'archiveReason', label: 'Archive Reason', value: user.archiveReason },
        { key: 'lastWorkingDay', label: 'Last Working Day', type: 'date', value: user.lastWorkingDay },
        { key: 'role', label: 'Role', value: user.role },
      ],
    });
  };

  const handleRestoreUser = (user: ArchivedUser) => {
    setActionConfig({
      title: `Restore User: ${user.name}`,
      description: 'Update placeholder values before restoring the user.',
      actionLabel: 'Restore',
      successActionVerb: 'restored',
      entityLabel: `the user ${user.name}`,
      fields: [
        { key: 'assignedStore', label: 'Assigned Store', value: user.company === 'TechCorp' ? 'Headquarters' : 'Store 1 - Downtown' },
        { key: 'accountStatus', label: 'Account Status', type: 'select', value: 'active', options: ['active', 'inactive'] },
      ],
      onApply: () => {
        setArchivedUsers((prev) => prev.filter((item) => item.id !== user.id));
      },
    });
  };

  const filteredArchivedUsers = useMemo(() => {
    return archivedUsers.filter((user) => {
      const searchLower = appliedFilters.search.trim().toLowerCase();
      const matchesSearch =
        searchLower.length === 0 ||
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower);

      const matchesCompany =
        appliedFilters.company === 'all' ||
        user.company.toLowerCase() === appliedFilters.company;

      const reasonValue = user.archiveReason.toLowerCase().replace(/\s+/g, '-');
      const matchesReason =
        appliedFilters.reason === 'all' ||
        reasonValue.includes(appliedFilters.reason);

      const matchesDate =
        appliedFilters.archiveDate.length === 0 ||
        user.archiveDate === appliedFilters.archiveDate;

      return matchesSearch && matchesCompany && matchesReason && matchesDate;
    });
  }, [archivedUsers, appliedFilters]);

  const archivedUsersPagination = useTablePagination(filteredArchivedUsers);
  const paginatedArchivedUsers = archivedUsersPagination.paginatedItems;

  return (
    <div className="space-y-6">
      {/* Filters */}
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
            <Select
              value={filters.company}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, company: value }))}
            >
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
            <Select
              value={filters.reason}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, reason: value }))}
            >
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="Archive Reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reasons</SelectItem>
                <SelectItem value="resignation">Resignation</SelectItem>
                <SelectItem value="termination">Termination</SelectItem>
                <SelectItem value="contract-ended">Contract Ended</SelectItem>
                <SelectItem value="retirement">Retirement</SelectItem>
                <SelectItem value="transferred">Transferred</SelectItem>
                <SelectItem value="personal">Personal Reasons</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative">
            <Input 
              type="date" 
              className=""
              placeholder="Archive Date"
              value={filters.archiveDate}
              onChange={(event) => setFilters((prev) => ({ ...prev, archiveDate: event.target.value }))}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="button" variant="outline" onClick={() => setAppliedFilters(filters)}>
            Apply Filters
          </Button>
        </div>
      </div>

      {/* Archived Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Archived Users</h3>
          <p className="text-sm text-gray-500 mt-1">Inactive employee accounts and historical records</p>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Archive Date</TableHead>
                <TableHead>Last Time-In Recorded</TableHead>
                <TableHead>Last Working Day</TableHead>
                <TableHead>Archive Reason</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedArchivedUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-gray-900">
                    {user.name}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {user.email}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {user.company}
                  </TableCell>
                  <TableCell className="text-sm text-gray-900">
                    {user.role}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {user.archiveDate}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {user.lastTimeInRecorded}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {user.lastWorkingDay}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 text-xs">
                      {user.archiveReason}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewUser(user)}
                        className="text-[#1F4FD8] hover:text-[#1F4FD8] hover:bg-blue-50"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestoreUser(user)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Restore
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
<TablePaginationControls
  currentPage={archivedUsersPagination.currentPage}
  totalPages={archivedUsersPagination.totalPages}
  pageSize={archivedUsersPagination.pageSize}
  totalItems={archivedUsersPagination.totalItems}
  onPrevious={archivedUsersPagination.goToPreviousPage}
  onNext={archivedUsersPagination.goToNextPage}
  onPageChange={archivedUsersPagination.goToPage}
  onPageSizeChange={archivedUsersPagination.setPageSize}
/>
        </div>
      </div>
      <ActionFlowModal config={actionConfig} onClose={() => setActionConfig(null)} />
    </div>
  );
}




