import { useMemo, useState } from 'react';
import {
  Check, X, Eye, RefreshCw, Search, Users,
  ClipboardList, UserCheck, Edit3,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { KPICard } from '../KPICard';
import { ActionFlowModal, type ActionFlowConfig } from '../ActionFlowModal';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../ui/table';
import { TablePaginationControls } from '../TablePaginationControls';
import { useTablePagination } from '../hooks/useTablePagination';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

// ─── Types ────────────────────────────────────────────────────────────────────

type LeaveType = 'vacation' | 'sick' | 'emergency' | 'paternity' | 'maternity';
type LeaveStatus = 'pending' | 'approved' | 'rejected';

const LEAVE_TOTAL = 5;

interface LeaveBalance {
  id: string;
  employeeName: string;
  email: string;
  store: string;
  used: number;
}

interface LeavePolicy {
  type: LeaveType;
  minDays: number;
  maxDays: number;
}

interface LeaveRequest {
  id: string;
  requestId: string;
  employeeName: string;
  email: string;
  store: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  documents: string[];
  status: LeaveStatus;
  appliedDate: string;
  reviewedBy?: string;
  reviewedDate?: string;
  adminNotes?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const initialPolicies: LeavePolicy[] = [
  { type: 'vacation',  minDays: 1, maxDays: 5 },
  { type: 'sick',      minDays: 1, maxDays: 3 },
  { type: 'emergency', minDays: 1, maxDays: 2 },
  { type: 'paternity', minDays: 1, maxDays: 5 },
  { type: 'maternity', minDays: 1, maxDays: 5 },
];

const storeOptions = [
  'All Stores',
  'Sparkle Star International Corporation',
];

const initialBalances: LeaveBalance[] = [
  { id: 'b1', employeeName: 'Sarah Johnson',   email: 'sarah.johnson@sparkle.local',   store: 'Sparkle Star International Corporation',   used: 2 },
  { id: 'b2', employeeName: 'Michael Chen',    email: 'michael.chen@sparkle.local',    store: 'Sparkle Timekeeping Satellite Office',      used: 4 },
  { id: 'b3', employeeName: 'Emily Rodriguez', email: 'emily.rodriguez@sparkle.local', store: 'Sparkle Timekeeping Logistics Hub',         used: 1 },
  { id: 'b4', employeeName: 'David Park',      email: 'david.park@sparkle.local',      store: 'Sparkle Star International Corporation',   used: 5 },
  { id: 'b5', employeeName: 'Jessica Williams',email: 'jessica.williams@sparkle.local',store: 'Sparkle Timekeeping Satellite Office',      used: 3 },
  { id: 'b6', employeeName: 'Amanda Thompson', email: 'amanda.thompson@sparkle.local', store: 'Sparkle Timekeeping Logistics Hub',         used: 1 },
  { id: 'b7', employeeName: 'Kevin Ramos',     email: 'kevin.ramos@sparkle.local',     store: 'Sparkle Star International Corporation',   used: 0 },
  { id: 'b8', employeeName: 'Nina Flores',     email: 'nina.flores@sparkle.local',     store: 'Sparkle Timekeeping Satellite Office',      used: 4 },
  { id: 'b9', employeeName: 'Paolo Santos',    email: 'paolo.santos@sparkle.local',    store: 'Sparkle Timekeeping Logistics Hub',         used: 2 },
  { id: 'b10',employeeName: 'Lea Mendoza',     email: 'lea.mendoza@sparkle.local',     store: 'Sparkle Star International Corporation',   used: 3 },
];

const initialRequests: LeaveRequest[] = [
  {
    id: '1', requestId: 'LR-2026-001', employeeName: 'Sarah Johnson',
    email: 'sarah.johnson@sparkle.local', store: 'Sparkle Star International Corporation',
    leaveType: 'vacation', startDate: '2026-04-21', endDate: '2026-04-25',
    totalDays: 5, reason: 'Family vacation trip to Baguio.',
    documents: [],
    status: 'pending', appliedDate: '2026-04-15',
  },
  {
    id: '2', requestId: 'LR-2026-002', employeeName: 'Michael Chen',
    email: 'michael.chen@sparkle.local', store: 'Sparkle Timekeeping Satellite Office',
    leaveType: 'sick', startDate: '2026-04-16', endDate: '2026-04-17',
    totalDays: 2, reason: 'Fever and flu, medical certificate attached.',
    documents: ['Medical Certificate'],
    status: 'approved', appliedDate: '2026-04-15',
    reviewedBy: 'Admin User', reviewedDate: '2026-04-15', adminNotes: 'Approved. Get well soon.',
  },
  {
    id: '3', requestId: 'LR-2026-003', employeeName: 'Emily Rodriguez',
    email: 'emily.rodriguez@sparkle.local', store: 'Sparkle Timekeeping Logistics Hub',
    leaveType: 'emergency', startDate: '2026-04-14', endDate: '2026-04-14',
    totalDays: 1, reason: 'Family emergency – hospitalization of a relative.',
    documents: ['Hospital Admission Record', 'Doctor\'s Certificate'],
    status: 'approved', appliedDate: '2026-04-14',
    reviewedBy: 'Admin User', reviewedDate: '2026-04-14', adminNotes: 'Emergency approved.',
  },
  {
    id: '4', requestId: 'LR-2026-004', employeeName: 'David Park',
    email: 'david.park@sparkle.local', store: 'Sparkle Star International Corporation',
    leaveType: 'vacation', startDate: '2026-05-01', endDate: '2026-05-05',
    totalDays: 5, reason: 'Personal rest and recuperation.',
    documents: [],
    status: 'pending', appliedDate: '2026-04-12',
  },
  {
    id: '5', requestId: 'LR-2026-005', employeeName: 'Jessica Williams',
    email: 'jessica.williams@sparkle.local', store: 'Sparkle Timekeeping Satellite Office',
    leaveType: 'sick', startDate: '2026-04-10', endDate: '2026-04-11',
    totalDays: 2, reason: 'Migraine and vertigo episodes.',
    documents: [],
    status: 'rejected', appliedDate: '2026-04-09',
    reviewedBy: 'Admin User', reviewedDate: '2026-04-10',
    adminNotes: 'Rejected: No supporting medical certificate submitted.',
  },
  {
    id: '6', requestId: 'LR-2026-006', employeeName: 'Amanda Thompson',
    email: 'amanda.thompson@sparkle.local', store: 'Sparkle Timekeeping Logistics Hub',
    leaveType: 'vacation', startDate: '2026-04-28', endDate: '2026-04-30',
    totalDays: 3, reason: 'Pre-planned anniversary trip.',
    documents: [],
    status: 'pending', appliedDate: '2026-04-14',
  },
  {
    id: '7', requestId: 'LR-2026-007', employeeName: 'Kevin Ramos',
    email: 'kevin.ramos@sparkle.local', store: 'Sparkle Star International Corporation',
    leaveType: 'sick', startDate: '2026-04-08', endDate: '2026-04-09',
    totalDays: 2, reason: 'Dental procedure and recovery.',
    documents: ['Dental Certificate', 'Medical Certificate'],
    status: 'approved', appliedDate: '2026-04-07',
    reviewedBy: 'Admin User', reviewedDate: '2026-04-07', adminNotes: 'Approved with dental certificate.',
  },
  {
    id: '8', requestId: 'LR-2026-008', employeeName: 'Nina Flores',
    email: 'nina.flores@sparkle.local', store: 'Sparkle Timekeeping Satellite Office',
    leaveType: 'emergency', startDate: '2026-04-05', endDate: '2026-04-06',
    totalDays: 2, reason: 'Typhoon damage to residence.',
    documents: ['Barangay Calamity Certificate'],
    status: 'approved', appliedDate: '2026-04-05',
    reviewedBy: 'Admin User', reviewedDate: '2026-04-05', adminNotes: 'Emergency approved.',
  },
  {
    id: '9', requestId: 'LR-2026-009', employeeName: 'Paolo Santos',
    email: 'paolo.santos@sparkle.local', store: 'Sparkle Timekeeping Logistics Hub',
    leaveType: 'paternity', startDate: '2026-03-20', endDate: '2026-03-22',
    totalDays: 3, reason: 'Wife gave birth; availing paternity leave.',
    documents: ['Birth Certificate', 'Marriage Certificate'],
    status: 'approved', appliedDate: '2026-03-19',
    reviewedBy: 'Admin User', reviewedDate: '2026-03-19', adminNotes: 'Approved. Congratulations!',
  },
  {
    id: '10', requestId: 'LR-2026-010', employeeName: 'Lea Mendoza',
    email: 'lea.mendoza@sparkle.local', store: 'Sparkle Star International Corporation',
    leaveType: 'vacation', startDate: '2026-04-22', endDate: '2026-04-24',
    totalDays: 3, reason: 'Out-of-town family reunion.',
    documents: [],
    status: 'pending', appliedDate: '2026-04-13',
  },
  {
    id: '11', requestId: 'LR-2026-011', employeeName: 'Sarah Johnson',
    email: 'sarah.johnson@sparkle.local', store: 'Sparkle Star International Corporation',
    leaveType: 'sick', startDate: '2026-03-10', endDate: '2026-03-12',
    totalDays: 3, reason: 'Stomach flu – doctor advised rest.',
    documents: ['Medical Certificate', 'Prescription Receipt'],
    status: 'approved', appliedDate: '2026-03-09',
    reviewedBy: 'Admin User', reviewedDate: '2026-03-09', adminNotes: 'Approved.',
  },
  {
    id: '12', requestId: 'LR-2026-012', employeeName: 'Michael Chen',
    email: 'michael.chen@sparkle.local', store: 'Sparkle Timekeeping Satellite Office',
    leaveType: 'vacation', startDate: '2026-05-12', endDate: '2026-05-16',
    totalDays: 5, reason: 'Planned summer vacation with family.',
    documents: [],
    status: 'pending', appliedDate: '2026-04-14',
  },
  {
    id: '13', requestId: 'LR-2026-013', employeeName: 'Emily Rodriguez',
    email: 'emily.rodriguez@sparkle.local', store: 'Sparkle Timekeeping Logistics Hub',
    leaveType: 'sick', startDate: '2026-03-25', endDate: '2026-03-27',
    totalDays: 3, reason: 'Post-surgery recovery.',
    documents: ['Surgical Report', 'Medical Certificate'],
    status: 'rejected', appliedDate: '2026-03-24',
    reviewedBy: 'Admin User', reviewedDate: '2026-03-25',
    adminNotes: 'Rejected: Surgery not covered under current sick leave policy. Please file under medical leave.',
  },
  {
    id: '14', requestId: 'LR-2026-014', employeeName: 'David Park',
    email: 'david.park@sparkle.local', store: 'Sparkle Star International Corporation',
    leaveType: 'emergency', startDate: '2026-04-18', endDate: '2026-04-18',
    totalDays: 1, reason: 'House fire – attending to property and family needs.',
    documents: ['Fire Incident Report', 'Barangay Certificate'],
    status: 'pending', appliedDate: '2026-04-15',
  },
  {
    id: '15', requestId: 'LR-2026-015', employeeName: 'Kevin Ramos',
    email: 'kevin.ramos@sparkle.local', store: 'Sparkle Star International Corporation',
    leaveType: 'vacation', startDate: '2026-06-02', endDate: '2026-06-06',
    totalDays: 5, reason: 'Annual leave for personal travel.',
    documents: [],
    status: 'pending', appliedDate: '2026-04-15',
  },
];

// ─── Utilities ────────────────────────────────────────────────────────────────

const leaveTypeLabel: Record<LeaveType, string> = {
  vacation: 'Vacation Leave',
  sick: 'Sick Leave',
  emergency: 'Emergency Leave',
  paternity: 'Paternity Leave',
  maternity: 'Maternity Leave',
};

const statusColors: Record<LeaveStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const leaveTypeColors: Record<LeaveType, string> = {
  vacation: 'bg-blue-100 text-blue-800',
  sick: 'bg-red-100 text-red-800',
  emergency: 'bg-orange-100 text-orange-800',
  paternity: 'bg-purple-100 text-purple-800',
  maternity: 'bg-pink-100 text-pink-800',
};

// ─── Page Component ───────────────────────────────────────────────────────────

export function LeaveRequestPage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [requests, setRequests] = useState<LeaveRequest[]>(initialRequests);
  const [balances, setBalances] = useState<LeaveBalance[]>(initialBalances);
  const [policies, setPolicies] = useState<LeavePolicy[]>(initialPolicies);
  const [actionConfig, setActionConfig] = useState<ActionFlowConfig | null>(null);
  const [viewRequest, setViewRequest] = useState<LeaveRequest | null>(null);

  // ── Filters ────────────────────────────────────────────────────────────────
  const [reqFilters, setReqFilters] = useState({
    status: 'All', leaveType: 'All', store: 'All Stores', search: '',
  });
  const [appliedReqFilters, setAppliedReqFilters] = useState(reqFilters);

  const [balFilters, setBalFilters] = useState({ store: 'All Stores', search: '' });
  const [appliedBalFilters, setAppliedBalFilters] = useState(balFilters);

  // ── KPI Metrics ────────────────────────────────────────────────────────────
  const kpi = useMemo(() => {
    const today = '2026-04-15';
    const monthStr = '2026-04';
    const pending = requests.filter((r) => r.status === 'pending').length;
    const approvedMonth = requests.filter(
      (r) => r.status === 'approved' && r.reviewedDate?.startsWith(monthStr),
    ).length;
    const rejectedMonth = requests.filter(
      (r) => r.status === 'rejected' && r.reviewedDate?.startsWith(monthStr),
    ).length;
    const onLeave = requests.filter(
      (r) => r.status === 'approved' && r.startDate <= today && r.endDate >= today,
    ).length;
    return { pending, approvedMonth, rejectedMonth, onLeave };
  }, [requests]);

  // ── Filtered Requests ──────────────────────────────────────────────────────
  const filteredRequests = useMemo(() => {
    const kw = appliedReqFilters.search.trim().toLowerCase();
    return requests.filter((r) => {
      if (appliedReqFilters.status !== 'All' && r.status !== appliedReqFilters.status.toLowerCase()) return false;
      if (appliedReqFilters.leaveType !== 'All' && r.leaveType !== appliedReqFilters.leaveType) return false;
      if (appliedReqFilters.store !== 'All Stores' && r.store !== appliedReqFilters.store) return false;
      if (kw && !r.employeeName.toLowerCase().includes(kw) && !r.requestId.toLowerCase().includes(kw) && !r.email.toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [requests, appliedReqFilters]);

  // ── Filtered Balances ──────────────────────────────────────────────────────
  const filteredBalances = useMemo(() => {
    const kw = appliedBalFilters.search.trim().toLowerCase();
    return balances.filter((b) => {
      if (appliedBalFilters.store !== 'All Stores' && b.store !== appliedBalFilters.store) return false;
      if (kw && !b.employeeName.toLowerCase().includes(kw) && !b.email.toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [balances, appliedBalFilters]);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const reqPagination = useTablePagination(filteredRequests);
  const balPagination = useTablePagination(filteredBalances);

  // ── Admin Actions ──────────────────────────────────────────────────────────
  const handleApprove = (req: LeaveRequest) => {
    setActionConfig({
      title: `Approve Leave: ${req.requestId}`,
      description: `Approve leave request for ${req.employeeName} (${leaveTypeLabel[req.leaveType]}, ${req.totalDays} day${req.totalDays !== 1 ? 's' : ''}).`,
      actionLabel: 'Approve',
      successActionVerb: 'approved',
      entityLabel: `leave request ${req.requestId}`,
      fields: [
        { key: 'employee', label: 'Employee', value: req.employeeName },
        { key: 'leaveType', label: 'Leave Type', value: leaveTypeLabel[req.leaveType] },
        { key: 'startDate', label: 'Start Date', value: req.startDate },
        { key: 'endDate', label: 'End Date', value: req.endDate },
        { key: 'totalDays', label: 'Total Days', value: String(req.totalDays) },
        { key: 'adminNotes', label: 'Admin Notes', placeholder: 'Optional notes for approval…', value: '' },
      ],
      onApply: (values) => {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === req.id
              ? { ...r, status: 'approved', reviewedBy: 'Admin User', reviewedDate: '2026-04-15', adminNotes: values.adminNotes || undefined }
              : r,
          ),
        );
      },
    });
  };

  const handleReject = (req: LeaveRequest) => {
    setActionConfig({
      title: `Reject Leave: ${req.requestId}`,
      description: `Reject leave request for ${req.employeeName} (${leaveTypeLabel[req.leaveType]}, ${req.totalDays} day${req.totalDays !== 1 ? 's' : ''}).`,
      actionLabel: 'Reject',
      successActionVerb: 'rejected',
      entityLabel: `leave request ${req.requestId}`,
      fields: [
        { key: 'employee', label: 'Employee', value: req.employeeName },
        { key: 'leaveType', label: 'Leave Type', value: leaveTypeLabel[req.leaveType] },
        { key: 'startDate', label: 'Start Date', value: req.startDate },
        { key: 'endDate', label: 'End Date', value: req.endDate },
        { key: 'totalDays', label: 'Total Days', value: String(req.totalDays) },
        { key: 'adminNotes', label: 'Rejection Reason', placeholder: 'Required: state the reason for rejection…', value: '' },
      ],
      onApply: (values) => {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === req.id
              ? { ...r, status: 'rejected', reviewedBy: 'Admin User', reviewedDate: '2026-04-15', adminNotes: values.adminNotes || 'No reason provided.' }
              : r,
          ),
        );
      },
    });
  };

  const handleAdjustBalance = (bal: LeaveBalance) => {
    setActionConfig({
      title: `Adjust Leave Balance: ${bal.employeeName}`,
      description: 'Manually add or deduct leave days for this employee.',
      actionLabel: 'Apply Adjustment',
      successActionVerb: 'adjusted',
      entityLabel: `leave balance for ${bal.employeeName}`,
      fields: [
        { key: 'employee', label: 'Employee', value: bal.employeeName },
        {
          key: 'action', label: 'Action', type: 'select', value: 'Add leave credits',
          options: ['Add leave credits', 'Deduct leave credits'],
        },
        { key: 'days', label: 'Number of Days', type: 'number', placeholder: 'e.g. 2', value: '' },
        { key: 'reason', label: 'Reason', placeholder: 'Reason for manual adjustment…', value: '' },
      ],
      onApply: (values) => {
        const days = parseInt(values.days, 10) || 0;
        const adding = values.action === 'Add leave credits';
        setBalances((prev) =>
          prev.map((b) => {
            if (b.id !== bal.id) return b;
            const nextUsed = adding
              ? Math.max(b.used - days, 0)
              : Math.min(b.used + days, LEAVE_TOTAL);
            return { ...b, used: nextUsed };
          }),
        );
      },
    });
  };

  const handleViewDetails = (req: LeaveRequest) => {
    setViewRequest(req);
  };

  const handleRefreshRequests = () => {
    setRequests(initialRequests);
    const reset = { status: 'All', leaveType: 'All', store: 'All Stores', search: '' };
    setReqFilters(reset);
    setAppliedReqFilters(reset);
  };

  const handleRefreshBalances = () => {
    setBalances(initialBalances);
    const reset = { store: 'All Stores', search: '' };
    setBalFilters(reset);
    setAppliedBalFilters(reset);
  };

  const handleEditPolicy = (policy: LeavePolicy) => {
    setActionConfig({
      title: `Edit Policy: ${leaveTypeLabel[policy.type]}`,
      description: 'Set the minimum and maximum number of days allowed for this leave type.',
      actionLabel: 'Save Policy',
      successActionVerb: 'updated',
      entityLabel: `${leaveTypeLabel[policy.type]} policy`,
      fields: [
        { key: 'leaveType', label: 'Leave Type', value: leaveTypeLabel[policy.type] },
        { key: 'minDays', label: 'Minimum Days', type: 'number', value: String(policy.minDays) },
        { key: 'maxDays', label: 'Maximum Days', type: 'number', value: String(policy.maxDays) },
      ],
      onApply: (values) => {
        const minDays = Math.max(1, parseInt(values.minDays, 10) || 1);
        const maxDays = Math.max(minDays, parseInt(values.maxDays, 10) || minDays);
        setPolicies((prev) =>
          prev.map((p) => p.type === policy.type ? { ...p, minDays, maxDays } : p),
        );
      },
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Pending Requests"
          value={kpi.pending}
          icon={ClipboardList}
          color="yellow"
          trend={{ value: 'awaiting review', isPositive: false }}
        />
        <KPICard
          title="Approved This Month"
          value={kpi.approvedMonth}
          icon={UserCheck}
          color="green"
          trend={{ value: 'this month', isPositive: true }}
        />
        <KPICard
          title="Rejected This Month"
          value={kpi.rejectedMonth}
          icon={X}
          color="red"
          trend={{ value: 'this month', isPositive: false }}
        />
        <KPICard
          title="Currently On Leave"
          value={kpi.onLeave}
          icon={Users}
          color="blue"
          trend={{ value: 'as of today', isPositive: true }}
        />
      </div>

      {/* Date Calculator */}

      {/* Main Tabs */}
      <Tabs defaultValue="requests">
        <TabsList className="mb-4">
          <TabsTrigger value="requests">Leave Requests</TabsTrigger>
          <TabsTrigger value="balances">Leave Balances</TabsTrigger>
          <TabsTrigger value="policy">Leave Policy</TabsTrigger>
        </TabsList>

        {/* ─── Leave Requests Tab ──────────────────────────────────────────── */}
        <TabsContent value="requests" className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto_auto] gap-3 items-end">
              <div>
                <label className="text-sm text-gray-600">Status</label>
                <select
                  value={reqFilters.status}
                  onChange={(e) => setReqFilters((p) => ({ ...p, status: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                >
                  {['All', 'Pending', 'Approved', 'Rejected'].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600">Leave Type</label>
                <select
                  value={reqFilters.leaveType}
                  onChange={(e) => setReqFilters((p) => ({ ...p, leaveType: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                >
                  <option value="All">All Types</option>
                  {(Object.keys(leaveTypeLabel) as LeaveType[]).map((t) => (
                    <option key={t} value={t}>{leaveTypeLabel[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600">Store</label>
                <select
                  value={reqFilters.store}
                  onChange={(e) => setReqFilters((p) => ({ ...p, store: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                >
                  {storeOptions.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600">Search</label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Name, ID, or email…"
                    className="pl-10"
                    value={reqFilters.search}
                    onChange={(e) => setReqFilters((p) => ({ ...p, search: e.target.value }))}
                  />
                </div>
              </div>
              <Button
                className="h-10 bg-[#1F4FD8] hover:bg-[#1845b8]"
                onClick={() => setAppliedReqFilters(reqFilters)}
              >
                Apply
              </Button>
              <Button variant="outline" size="icon" className="h-10 w-10" title="Refresh" onClick={handleRefreshRequests}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Requests Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">Leave Requests</h3>
              <p className="text-sm text-gray-500 mt-1">
                All employee leave requests — approve, reject, or view details.
              </p>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Documents Submitted</TableHead>
                    <TableHead>Applied On</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reqPagination.paginatedItems.map((req) => (
                    <TableRow key={req.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-gray-900 whitespace-nowrap">{req.requestId}</TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{req.employeeName}</div>
                          <div className="text-xs text-gray-500">{req.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-[160px] truncate">{req.store}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${leaveTypeColors[req.leaveType]}`}>
                          {leaveTypeLabel[req.leaveType]}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 whitespace-nowrap">{req.startDate}</TableCell>
                      <TableCell className="text-sm text-gray-600 whitespace-nowrap">{req.endDate}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-800 text-sm font-bold">
                          {req.totalDays}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-[200px]">
                        <span className="line-clamp-2">{req.reason}</span>
                      </TableCell>
                      <TableCell>
                        {req.documents.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {req.documents.map((doc) => (
                              <span key={doc} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 whitespace-nowrap">
                                {doc}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 whitespace-nowrap">{req.appliedDate}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColors[req.status]}`}>
                          {req.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(req)}
                            className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                          >
                            <Eye className="w-4 h-4 mr-1" /> View
                          </Button>
                          {req.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApprove(req)}
                                className="text-green-700 hover:text-green-800 hover:bg-green-50"
                              >
                                <Check className="w-4 h-4 mr-1" /> Approve
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReject(req)}
                                className="text-red-700 hover:text-red-800 hover:bg-red-50"
                              >
                                <X className="w-4 h-4 mr-1" /> Reject
                              </Button>
                            </>
                          )}
                          {req.status !== 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove({ ...req, status: 'pending' } as LeaveRequest)}
                              className="text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                            >
                              <Edit3 className="w-4 h-4 mr-1" /> Re-review
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {reqPagination.paginatedItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-8 text-gray-400">
                        No leave requests match the current filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <TablePaginationControls
                currentPage={reqPagination.currentPage}
                totalPages={reqPagination.totalPages}
                pageSize={reqPagination.pageSize}
                totalItems={reqPagination.totalItems}
                onPrevious={reqPagination.goToPreviousPage}
                onNext={reqPagination.goToNextPage}
                onPageChange={reqPagination.goToPage}
                onPageSizeChange={reqPagination.setPageSize}
              />
            </div>
          </div>
        </TabsContent>

        {/* ─── Leave Balances Tab ──────────────────────────────────────────── */}
        <TabsContent value="balances" className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end">
              <div>
                <label className="text-sm text-gray-600">Store</label>
                <select
                  value={balFilters.store}
                  onChange={(e) => setBalFilters((p) => ({ ...p, store: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                >
                  {storeOptions.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600">Search Employee</label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Name or email…"
                    className="pl-10"
                    value={balFilters.search}
                    onChange={(e) => setBalFilters((p) => ({ ...p, search: e.target.value }))}
                  />
                </div>
              </div>
              <Button
                className="h-10 bg-[#1F4FD8] hover:bg-[#1845b8]"
                onClick={() => setAppliedBalFilters(balFilters)}
              >
                Apply
              </Button>
              <Button variant="outline" size="icon" className="h-10 w-10" title="Refresh" onClick={handleRefreshBalances}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Balances Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">Leave Balances</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Total remaining leave days per employee.
              </p>
            </div>
            <div className="overflow-x-auto">
              <Table className="w-auto min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>Leaves Remaining</TableHead>
                    <TableHead>Leaves Used</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balPagination.paginatedItems.map((bal) => {
                    const remaining = LEAVE_TOTAL - bal.used;
                    return (
                      <TableRow key={bal.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{bal.employeeName}</div>
                            <div className="text-xs text-gray-500">{bal.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 max-w-[160px] truncate">{bal.store}</TableCell>
                        <TableCell>
                          <span className="text-sm font-semibold text-gray-800">{remaining}</span>
                          <span className="text-xs text-gray-400 ml-1">/ {LEAVE_TOTAL}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-semibold text-gray-800">{bal.used}</span>
                          <span className="text-xs text-gray-400 ml-1">/ {LEAVE_TOTAL}</span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAdjustBalance(bal)}
                            className="text-[#1F4FD8] hover:text-[#1845b8] hover:bg-blue-50"
                          >
                            <Edit3 className="w-4 h-4 mr-1" /> Adjust Balance
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {balPagination.paginatedItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                        No employees match the current filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <TablePaginationControls
                currentPage={balPagination.currentPage}
                totalPages={balPagination.totalPages}
                pageSize={balPagination.pageSize}
                totalItems={balPagination.totalItems}
                onPrevious={balPagination.goToPreviousPage}
                onNext={balPagination.goToNextPage}
                onPageChange={balPagination.goToPage}
                onPageSizeChange={balPagination.setPageSize}
              />
            </div>
          </div>
        </TabsContent>

        {/* ─── Leave Policy Tab ────────────────────────────────────────────── */}
        <TabsContent value="policy">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">Leave Policy</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Configure the minimum and maximum number of days allowed per leave type.
              </p>
            </div>
            <div className="overflow-x-auto">
              <Table className="w-auto min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Minimum Days</TableHead>
                    <TableHead>Maximum Days</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policies.map((policy) => (
                    <TableRow key={policy.type} className="hover:bg-gray-50">
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${leaveTypeColors[policy.type]}`}>
                          {leaveTypeLabel[policy.type]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-semibold text-gray-800">{policy.minDays}</span>
                        <span className="text-xs text-gray-400 ml-1">day{policy.minDays !== 1 ? 's' : ''}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-semibold text-gray-800">{policy.maxDays}</span>
                        <span className="text-xs text-gray-400 ml-1">day{policy.maxDays !== 1 ? 's' : ''}</span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPolicy(policy)}
                          className="text-[#1F4FD8] hover:text-[#1845b8] hover:bg-blue-50"
                        >
                          <Edit3 className="w-4 h-4 mr-1" /> Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* View Details Dialog */}
      <Dialog open={!!viewRequest} onOpenChange={(open) => { if (!open) setViewRequest(null); }}>
        <DialogContent className="w-[96vw] max-w-lg max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Leave Request Details</DialogTitle>
            <DialogDescription>
              Full information for request {viewRequest?.requestId}.
            </DialogDescription>
          </DialogHeader>
          {viewRequest && (
            <div className="overflow-auto max-h-[65vh] space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="font-semibold text-gray-800">Request ID:</span><br /><span className="text-gray-600">{viewRequest.requestId}</span></div>
                <div><span className="font-semibold text-gray-800">Status:</span><br />
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColors[viewRequest.status]}`}>{viewRequest.status}</span>
                </div>
                <div><span className="font-semibold text-gray-800">Employee:</span><br /><span className="text-gray-600">{viewRequest.employeeName}</span></div>
                <div><span className="font-semibold text-gray-800">Email:</span><br /><span className="text-gray-600">{viewRequest.email}</span></div>
                <div><span className="font-semibold text-gray-800">Store:</span><br /><span className="text-gray-600">{viewRequest.store}</span></div>
                <div><span className="font-semibold text-gray-800">Leave Type:</span><br />
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${leaveTypeColors[viewRequest.leaveType]}`}>{leaveTypeLabel[viewRequest.leaveType]}</span>
                </div>
                <div><span className="font-semibold text-gray-800">Start Date:</span><br /><span className="text-gray-600">{viewRequest.startDate}</span></div>
                <div><span className="font-semibold text-gray-800">End Date:</span><br /><span className="text-gray-600">{viewRequest.endDate}</span></div>
                <div><span className="font-semibold text-gray-800">Total Days:</span><br /><span className="text-gray-600 font-bold text-lg text-[#1F4FD8]">{viewRequest.totalDays}</span></div>
                <div><span className="font-semibold text-gray-800">Applied On:</span><br /><span className="text-gray-600">{viewRequest.appliedDate}</span></div>
              </div>
              <div><span className="font-semibold text-gray-800">Reason:</span><br /><span className="text-gray-600">{viewRequest.reason}</span></div>
              <div>
                <span className="font-semibold text-gray-800">Documents Submitted:</span><br />
                {viewRequest.documents.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {viewRequest.documents.map((doc) => (
                      <span key={doc} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {doc}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400 italic text-sm">No documents submitted.</span>
                )}
              </div>
              {viewRequest.reviewedBy && (
                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <div><span className="font-semibold text-gray-800">Reviewed By:</span> <span className="text-gray-600">{viewRequest.reviewedBy}</span></div>
                  <div><span className="font-semibold text-gray-800">Reviewed On:</span> <span className="text-gray-600">{viewRequest.reviewedDate}</span></div>
                  {viewRequest.adminNotes && (
                    <div><span className="font-semibold text-gray-800">Admin Notes:</span><br /><span className="text-gray-600">{viewRequest.adminNotes}</span></div>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" onClick={() => setViewRequest(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ActionFlowModal config={actionConfig} onClose={() => setActionConfig(null)} />
    </div>
  );
}
