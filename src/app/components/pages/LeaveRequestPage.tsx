import { useMemo, useState, useRef, useEffect } from 'react';
import {
  Check, X, Eye, RefreshCw, Search, Users,
  ClipboardList, UserCheck, Edit3, Plus, Trash2,
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

type LeaveStatus = 'pending' | 'approved' | 'revision';

interface LeaveType {
  id: string;
  name: string;
  defaultCredits: number;
  resetFrequency: 'annual' | 'monthly' | 'never';
  resetMonth: number | null;
  resetDay: number | null;
}

interface EmployeeLeaveEntry {
  leaveTypeId: string;
  leaveTypeName: string;
  totalCredits: number;
  used: number;
  expiresOn: string | null;
  resetOn: string | null;
}

interface LeaveBalance {
  id: string;
  employeeName: string;
  email: string;
  store: string;
  leaves: EmployeeLeaveEntry[];
}

interface LeaveRequest {
  id: string;
  requestId: string;
  employeeName: string;
  email: string;
  store: string;
  leaveType: string;
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const TODAY = '2026-04-16';

function nextResetDates(lt: LeaveType): { expiresOn: string; resetOn: string } {
  if (lt.resetFrequency === 'never' || lt.resetDay === null) return { expiresOn: '', resetOn: '' };

  const today = new Date(TODAY);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  let resetDate: Date;

  if (lt.resetFrequency === 'monthly') {
    const candidate = new Date(today.getFullYear(), today.getMonth(), lt.resetDay);
    resetDate = candidate > today ? candidate : new Date(today.getFullYear(), today.getMonth() + 1, lt.resetDay);
  } else {
    const m = (lt.resetMonth ?? 1) - 1;
    const candidate = new Date(today.getFullYear(), m, lt.resetDay);
    resetDate = candidate > today ? candidate : new Date(today.getFullYear() + 1, m, lt.resetDay);
  }

  const expires = new Date(resetDate);
  expires.setDate(expires.getDate() - 1);
  return { expiresOn: fmt(expires), resetOn: fmt(resetDate) };
}

function formatResetDate(lt: LeaveType): string {
  if (lt.resetFrequency === 'never') return 'Never';
  if (lt.resetFrequency === 'monthly') return lt.resetDay !== null ? `Day ${lt.resetDay} of every month` : 'Never';
  if (lt.resetMonth === null || lt.resetDay === null) return 'Never';
  return `${MONTHS[lt.resetMonth - 1]} ${lt.resetDay} (annually)`;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const storeOptions = ['All Stores', 'Sparkle Star International Corporation'];

const initialLeaveTypes: LeaveType[] = [
  { id: 'lt1', name: 'Vacation Leave',  defaultCredits: 5, resetFrequency: 'annual', resetMonth: 1, resetDay: 1 },
  { id: 'lt2', name: 'Sick Leave',      defaultCredits: 5, resetFrequency: 'annual', resetMonth: 1, resetDay: 1 },
  { id: 'lt3', name: 'Emergency Leave', defaultCredits: 3, resetFrequency: 'never',  resetMonth: null, resetDay: null },
  { id: 'lt4', name: 'Paternity Leave', defaultCredits: 7, resetFrequency: 'never',  resetMonth: null, resetDay: null },
];

const initialBalances: LeaveBalance[] = [
  {
    id: 'b1', employeeName: 'Sarah Johnson', email: 'sarah.johnson@sparkle.local',
    store: 'Sparkle Star International Corporation',
    leaves: [
      { leaveTypeId: 'lt1', leaveTypeName: 'Vacation Leave', totalCredits: 5, used: 2, expiresOn: '2026-12-31', resetOn: '2027-01-01' },
      { leaveTypeId: 'lt2', leaveTypeName: 'Sick Leave',     totalCredits: 5, used: 0, expiresOn: '2026-12-31', resetOn: '2027-01-01' },
    ],
  },
  {
    id: 'b2', employeeName: 'Michael Chen', email: 'michael.chen@sparkle.local',
    store: 'Sparkle Star International Corporation',
    leaves: [
      { leaveTypeId: 'lt1', leaveTypeName: 'Vacation Leave',  totalCredits: 5, used: 4, expiresOn: '2026-12-31', resetOn: '2027-01-01' },
      { leaveTypeId: 'lt2', leaveTypeName: 'Sick Leave',      totalCredits: 5, used: 2, expiresOn: '2026-12-31', resetOn: '2027-01-01' },
      { leaveTypeId: 'lt3', leaveTypeName: 'Emergency Leave', totalCredits: 3, used: 0, expiresOn: null,         resetOn: null },
    ],
  },
  {
    id: 'b3', employeeName: 'Emily Rodriguez', email: 'emily.rodriguez@sparkle.local',
    store: 'Sparkle Star International Corporation',
    leaves: [
      { leaveTypeId: 'lt1', leaveTypeName: 'Vacation Leave', totalCredits: 5, used: 1, expiresOn: '2026-12-31', resetOn: '2027-01-01' },
      { leaveTypeId: 'lt2', leaveTypeName: 'Sick Leave',     totalCredits: 5, used: 3, expiresOn: '2026-12-31', resetOn: '2027-01-01' },
    ],
  },
  {
    id: 'b4', employeeName: 'David Park', email: 'david.park@sparkle.local',
    store: 'Sparkle Star International Corporation',
    leaves: [
      { leaveTypeId: 'lt1', leaveTypeName: 'Vacation Leave',  totalCredits: 5, used: 5, expiresOn: '2026-12-31', resetOn: '2027-01-01' },
      { leaveTypeId: 'lt3', leaveTypeName: 'Emergency Leave', totalCredits: 3, used: 1, expiresOn: null,         resetOn: null },
    ],
  },
  {
    id: 'b5', employeeName: 'Jessica Williams', email: 'jessica.williams@sparkle.local',
    store: 'Sparkle Star International Corporation',
    leaves: [
      { leaveTypeId: 'lt2', leaveTypeName: 'Sick Leave', totalCredits: 5, used: 3, expiresOn: '2026-12-31', resetOn: '2027-01-01' },
    ],
  },
  {
    id: 'b6', employeeName: 'Amanda Thompson', email: 'amanda.thompson@sparkle.local',
    store: 'Sparkle Star International Corporation',
    leaves: [
      { leaveTypeId: 'lt1', leaveTypeName: 'Vacation Leave', totalCredits: 5, used: 1, expiresOn: '2026-12-31', resetOn: '2027-01-01' },
      { leaveTypeId: 'lt2', leaveTypeName: 'Sick Leave',     totalCredits: 5, used: 0, expiresOn: '2026-12-31', resetOn: '2027-01-01' },
    ],
  },
  {
    id: 'b7', employeeName: 'Kevin Ramos', email: 'kevin.ramos@sparkle.local',
    store: 'Sparkle Star International Corporation',
    leaves: [
      { leaveTypeId: 'lt1', leaveTypeName: 'Vacation Leave', totalCredits: 5, used: 0, expiresOn: '2026-12-31', resetOn: '2027-01-01' },
      { leaveTypeId: 'lt2', leaveTypeName: 'Sick Leave',     totalCredits: 5, used: 2, expiresOn: '2026-12-31', resetOn: '2027-01-01' },
    ],
  },
  {
    id: 'b8', employeeName: 'Nina Flores', email: 'nina.flores@sparkle.local',
    store: 'Sparkle Star International Corporation',
    leaves: [
      { leaveTypeId: 'lt1', leaveTypeName: 'Vacation Leave', totalCredits: 5, used: 4, expiresOn: '2026-12-31', resetOn: '2027-01-01' },
    ],
  },
  {
    id: 'b9', employeeName: 'Paolo Santos', email: 'paolo.santos@sparkle.local',
    store: 'Sparkle Star International Corporation',
    leaves: [
      { leaveTypeId: 'lt1', leaveTypeName: 'Vacation Leave',  totalCredits: 5, used: 2, expiresOn: '2026-12-31', resetOn: '2027-01-01' },
      { leaveTypeId: 'lt4', leaveTypeName: 'Paternity Leave', totalCredits: 7, used: 3, expiresOn: null,         resetOn: null },
    ],
  },
  {
    id: 'b10', employeeName: 'Lea Mendoza', email: 'lea.mendoza@sparkle.local',
    store: 'Sparkle Star International Corporation',
    leaves: [
      { leaveTypeId: 'lt1', leaveTypeName: 'Vacation Leave', totalCredits: 5, used: 3, expiresOn: '2026-12-31', resetOn: '2027-01-01' },
      { leaveTypeId: 'lt2', leaveTypeName: 'Sick Leave',     totalCredits: 5, used: 0, expiresOn: '2026-12-31', resetOn: '2027-01-01' },
    ],
  },
];

const initialRequests: LeaveRequest[] = [
  {
    id: '1', requestId: 'LR-2026-001', employeeName: 'Sarah Johnson',
    email: 'sarah.johnson@sparkle.local', store: 'Sparkle Star International Corporation',
    leaveType: 'vacation', startDate: '2026-04-21', endDate: '2026-04-25',
    totalDays: 5, reason: 'Family vacation trip to Baguio.',
    documents: [], status: 'pending', appliedDate: '2026-04-15',
  },
  {
    id: '2', requestId: 'LR-2026-002', employeeName: 'Michael Chen',
    email: 'michael.chen@sparkle.local', store: 'Sparkle Star International Corporation',
    leaveType: 'sick', startDate: '2026-04-16', endDate: '2026-04-17',
    totalDays: 2, reason: 'Fever and flu, medical certificate attached.',
    documents: ['Medical Certificate'], status: 'approved', appliedDate: '2026-04-15',
    reviewedBy: 'Admin User', reviewedDate: '2026-04-15', adminNotes: 'Approved. Get well soon.',
  },
  {
    id: '3', requestId: 'LR-2026-003', employeeName: 'Emily Rodriguez',
    email: 'emily.rodriguez@sparkle.local', store: 'Sparkle Star International Corporation',
    leaveType: 'emergency', startDate: '2026-04-14', endDate: '2026-04-14',
    totalDays: 1, reason: 'Family emergency – hospitalization of a relative.',
    documents: ['Hospital Admission Record', "Doctor's Certificate"],
    status: 'approved', appliedDate: '2026-04-14',
    reviewedBy: 'Admin User', reviewedDate: '2026-04-14', adminNotes: 'Emergency approved.',
  },
  {
    id: '4', requestId: 'LR-2026-004', employeeName: 'David Park',
    email: 'david.park@sparkle.local', store: 'Sparkle Star International Corporation',
    leaveType: 'vacation', startDate: '2026-05-01', endDate: '2026-05-05',
    totalDays: 5, reason: 'Personal rest and recuperation.',
    documents: [], status: 'pending', appliedDate: '2026-04-12',
  },
  {
    id: '5', requestId: 'LR-2026-005', employeeName: 'Jessica Williams',
    email: 'jessica.williams@sparkle.local', store: 'Sparkle Star International Corporation',
    leaveType: 'sick', startDate: '2026-04-10', endDate: '2026-04-11',
    totalDays: 2, reason: 'Migraine and vertigo episodes.',
    documents: [], status: 'revision', appliedDate: '2026-04-09',
    reviewedBy: 'Admin User', reviewedDate: '2026-04-10',
    adminNotes: 'Please attach a medical certificate and resubmit.',
  },
  {
    id: '6', requestId: 'LR-2026-006', employeeName: 'Amanda Thompson',
    email: 'amanda.thompson@sparkle.local', store: 'Sparkle Star International Corporation',
    leaveType: 'vacation', startDate: '2026-04-28', endDate: '2026-04-30',
    totalDays: 3, reason: 'Pre-planned anniversary trip.',
    documents: [], status: 'pending', appliedDate: '2026-04-14',
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
    email: 'nina.flores@sparkle.local', store: 'Sparkle Star International Corporation',
    leaveType: 'emergency', startDate: '2026-04-05', endDate: '2026-04-06',
    totalDays: 2, reason: 'Typhoon damage to residence.',
    documents: ['Barangay Calamity Certificate'],
    status: 'approved', appliedDate: '2026-04-05',
    reviewedBy: 'Admin User', reviewedDate: '2026-04-05', adminNotes: 'Emergency approved.',
  },
  {
    id: '9', requestId: 'LR-2026-009', employeeName: 'Paolo Santos',
    email: 'paolo.santos@sparkle.local', store: 'Sparkle Star International Corporation',
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
    documents: [], status: 'pending', appliedDate: '2026-04-13',
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
    email: 'michael.chen@sparkle.local', store: 'Sparkle Star International Corporation',
    leaveType: 'vacation', startDate: '2026-05-12', endDate: '2026-05-16',
    totalDays: 5, reason: 'Planned summer vacation with family.',
    documents: [], status: 'pending', appliedDate: '2026-04-14',
  },
  {
    id: '13', requestId: 'LR-2026-013', employeeName: 'Emily Rodriguez',
    email: 'emily.rodriguez@sparkle.local', store: 'Sparkle Star International Corporation',
    leaveType: 'sick', startDate: '2026-03-25', endDate: '2026-03-27',
    totalDays: 3, reason: 'Post-surgery recovery.',
    documents: ['Surgical Report', 'Medical Certificate'],
    status: 'revision', appliedDate: '2026-03-24',
    reviewedBy: 'Admin User', reviewedDate: '2026-03-25',
    adminNotes: 'Please resubmit specifying the correct leave type for post-surgery recovery.',
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
    documents: [], status: 'pending', appliedDate: '2026-04-15',
  },
];

// ─── Utilities ────────────────────────────────────────────────────────────────

const statusColors: Record<LeaveStatus, string> = {
  pending:  'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  revision: 'bg-purple-100 text-purple-800',
};

const statusLabel: Record<LeaveStatus, string> = {
  pending:  'Pending',
  approved: 'Approved',
  revision: 'For Revision',
};

// ─── LeaveTypeCombobox ────────────────────────────────────────────────────────

function LeaveTypeCombobox({
  leaveTypes,
  excludeIds = [],
  onSelect,
  onCreateNew,
}: {
  leaveTypes: LeaveType[];
  excludeIds?: string[];
  onSelect: (lt: LeaveType) => void;
  onCreateNew: (name: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const available = leaveTypes.filter(lt => !excludeIds.includes(lt.id));
  const filtered = available.filter(lt => lt.name.toLowerCase().includes(query.toLowerCase()));
  const exactMatch = available.some(lt => lt.name.toLowerCase() === query.toLowerCase());
  const showCreate = query.trim().length > 0 && !exactMatch;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="w-full h-10 pl-10 pr-3 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
          placeholder="Search leave types…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
      </div>
      {open && (filtered.length > 0 || showCreate) && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filtered.map(lt => (
            <button
              key={lt.id}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-[#1F4FD8] transition-colors"
              onMouseDown={(e) => { e.preventDefault(); onSelect(lt); setQuery(''); setOpen(false); }}
            >
              {lt.name}
              <span className="text-xs text-gray-400 ml-2">{lt.defaultCredits} default credits</span>
            </button>
          ))}
          {showCreate && (
            <button
              type="button"
              className="w-full text-left px-3 py-2 text-sm text-[#1F4FD8] hover:bg-blue-50 flex items-center gap-2 border-t border-gray-100 font-medium"
              onMouseDown={(e) => { e.preventDefault(); onCreateNew(query.trim()); setQuery(''); setOpen(false); }}
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              Create &ldquo;<strong>{query.trim()}</strong>&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────

export function LeaveRequestPage() {

  // ── Core State ─────────────────────────────────────────────────────────────
  const [requests,   setRequests]   = useState<LeaveRequest[]>(initialRequests);
  const [balances,   setBalances]   = useState<LeaveBalance[]>(initialBalances);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>(initialLeaveTypes);

  // ── Request modals ─────────────────────────────────────────────────────────
  const [actionConfig, setActionConfig] = useState<ActionFlowConfig | null>(null);
  const [viewRequest,  setViewRequest]  = useState<LeaveRequest | null>(null);

  // ── Leave Type CRUD modal ──────────────────────────────────────────────────
  const [ltModalOpen, setLtModalOpen] = useState(false);
  const [ltEditId,    setLtEditId]    = useState<string | null>(null);
  const [ltForm, setLtForm] = useState({
    name: '', defaultCredits: '5',
    resetFrequency: 'annual' as 'annual' | 'monthly' | 'never',
    resetMonth: '1', resetDay: '1',
  });

  // ── Employee Balance modal ─────────────────────────────────────────────────
  const [managingEmp, setManagingEmp] = useState<LeaveBalance | null>(null);
  const [addLtOpen,   setAddLtOpen]   = useState(false);
  const [addLtForm, setAddLtForm] = useState({
    leaveTypeId: '', leaveTypeName: '', totalCredits: '', expiresOn: '', resetOn: '',
  });

  // ── Adjust credits dialog ──────────────────────────────────────────────────
  const [adjustDialog, setAdjustDialog] = useState<{ balId: string; entry: EmployeeLeaveEntry } | null>(null);
  const [adjustForm, setAdjustForm] = useState({ action: 'add' as 'add' | 'deduct' | 'set', days: '', reason: '' });

  // ── Filters ────────────────────────────────────────────────────────────────
  const defaultReqFilters = { status: 'All', store: 'All Stores', leaveType: 'All', dateFrom: '', dateTo: '', search: '' };
  const [reqFilters,         setReqFilters]         = useState(defaultReqFilters);
  const [appliedReqFilters,  setAppliedReqFilters]  = useState(defaultReqFilters);
  const defaultBalFilters = { store: 'All Stores', search: '' };
  const [balFilters,         setBalFilters]         = useState(defaultBalFilters);
  const [appliedBalFilters,  setAppliedBalFilters]  = useState(balFilters);

  // ── KPI ────────────────────────────────────────────────────────────────────
  const kpi = useMemo(() => {
    const { dateFrom, dateTo, leaveType } = appliedReqFilters;
    const inRange = (date: string | undefined) => {
      if (!date) return false;
      if (dateFrom && date < dateFrom) return false;
      if (dateTo   && date > dateTo)   return false;
      return true;
    };
    const matchesLeaveType = (request: LeaveRequest) => leaveType === 'All' || request.leaveType === leaveType;
    const periodLabel = dateFrom || dateTo
      ? `${dateFrom || '…'} – ${dateTo || '…'}`
      : 'selected period';
    return {
      pending:       requests.filter(r => r.status === 'pending' && matchesLeaveType(r) && ((!dateFrom && !dateTo) || inRange(r.appliedDate))).length,
      approvedMonth: requests.filter(r => r.status === 'approved' && matchesLeaveType(r) && ((!dateFrom && !dateTo) || inRange(r.reviewedDate))).length,
      revisionMonth: requests.filter(r => r.status === 'revision' && matchesLeaveType(r) && ((!dateFrom && !dateTo) || inRange(r.reviewedDate))).length,
      onLeave:       requests.filter(r => {
        if (r.status !== 'approved' || !matchesLeaveType(r)) return false;
        const lo = dateFrom || TODAY;
        const hi = dateTo   || TODAY;
        return r.startDate <= hi && r.endDate >= lo;
      }).length,
      periodLabel,
    };
  }, [requests, appliedReqFilters]);

  // ── Unique leave types for filter dropdown ─────────────────────────────────
  const leaveTypeOptions = useMemo(() => {
    const types = Array.from(new Set(requests.map(r => r.leaveType))).sort();
    return ['All', ...types];
  }, [requests]);

  // ── Filtered lists ─────────────────────────────────────────────────────────
  const filteredRequests = useMemo(() => {
    const kw = appliedReqFilters.search.trim().toLowerCase();
    const { dateFrom, dateTo, leaveType } = appliedReqFilters;
    return requests.filter(r => {
      if (appliedReqFilters.status !== 'All' && r.status !== appliedReqFilters.status.toLowerCase()) return false;
      if (appliedReqFilters.store !== 'All Stores' && r.store !== appliedReqFilters.store) return false;
      if (leaveType !== 'All' && r.leaveType !== leaveType) return false;
      if (dateFrom && r.appliedDate < dateFrom) return false;
      if (dateTo   && r.appliedDate > dateTo)   return false;
      if (kw && !r.employeeName.toLowerCase().includes(kw) && !r.requestId.toLowerCase().includes(kw) && !r.email.toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [requests, appliedReqFilters]);

  const filteredBalances = useMemo(() => {
    const kw = appliedBalFilters.search.trim().toLowerCase();
    return balances.filter(b => {
      if (appliedBalFilters.store !== 'All Stores' && b.store !== appliedBalFilters.store) return false;
      if (kw && !b.employeeName.toLowerCase().includes(kw) && !b.email.toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [balances, appliedBalFilters]);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const reqPagination = useTablePagination(filteredRequests);
  const balPagination = useTablePagination(filteredBalances);
  const ltPagination  = useTablePagination(leaveTypes);

  // ── Balance deduction helper ───────────────────────────────────────────────
  // Matches free-text leave type in requests to named leave type in balances
  const matchesLeaveType = (balTypeName: string, reqType: string) => {
    const a = balTypeName.toLowerCase().trim();
    const b = reqType.toLowerCase().trim();
    return a === b || a.includes(b) || b.includes(a);
  };

  const deductBalance = (email: string, leaveType: string, days: number) => {
    setBalances(prev => prev.map(b => {
      if (b.email !== email) return b;
      return { ...b, leaves: b.leaves.map(e =>
        matchesLeaveType(e.leaveTypeName, leaveType)
          ? { ...e, used: Math.min(e.used + days, e.totalCredits) }
          : e
      )};
    }));
  };

  const restoreBalance = (email: string, leaveType: string, days: number) => {
    setBalances(prev => prev.map(b => {
      if (b.email !== email) return b;
      return { ...b, leaves: b.leaves.map(e =>
        matchesLeaveType(e.leaveTypeName, leaveType)
          ? { ...e, used: Math.max(e.used - days, 0) }
          : e
      )};
    }));
  };

  // ── Request handlers ───────────────────────────────────────────────────────
  const handleApprove = (req: LeaveRequest) => {
    setActionConfig({
      title: `Approve Leave: ${req.requestId}`,
      description: `Approve leave for ${req.employeeName} (${req.leaveType}, ${req.totalDays} day${req.totalDays !== 1 ? 's' : ''}). Credits will be deducted from their balance.`,
      actionLabel: 'Approve', successActionVerb: 'approved', entityLabel: `leave request ${req.requestId}`,
      fields: [
        { key: 'employee',   label: 'Employee',    value: req.employeeName },
        { key: 'leaveType',  label: 'Leave Type',  value: req.leaveType },
        { key: 'startDate',  label: 'Start Date',  value: req.startDate },
        { key: 'endDate',    label: 'End Date',    value: req.endDate },
        { key: 'totalDays',  label: 'Total Days',  value: String(req.totalDays) },
        { key: 'adminNotes', label: 'Admin Notes', placeholder: 'Optional notes…', value: '' },
      ],
      onApply: (values) => {
        const wasApproved = req.status === 'approved';
        setRequests(prev => prev.map(r =>
          r.id === req.id ? { ...r, status: 'approved', reviewedBy: 'Admin User', reviewedDate: TODAY, adminNotes: values.adminNotes || undefined } : r
        ));
        // Only deduct credits when first approving — not on re-approve
        if (!wasApproved) deductBalance(req.email, req.leaveType, req.totalDays);
      },
    });
  };

  const handleReturn = (req: LeaveRequest) => {
    setActionConfig({
      title: `Return for Revision: ${req.requestId}`,
      description: `Send this request back to ${req.employeeName} to revise and resubmit.`,
      actionLabel: 'Return for Revision', successActionVerb: 'returned for revision', entityLabel: `leave request ${req.requestId}`,
      fields: [
        { key: 'employee',   label: 'Employee',           value: req.employeeName },
        { key: 'leaveType',  label: 'Leave Type',         value: req.leaveType },
        { key: 'totalDays',  label: 'Total Days',         value: String(req.totalDays) },
        { key: 'adminNotes', label: 'Notes for Employee', placeholder: 'Explain what needs to be corrected…', value: '' },
      ],
      onApply: (values) => {
        const wasApproved = req.status === 'approved';
        setRequests(prev => prev.map(r =>
          r.id === req.id ? { ...r, status: 'revision', reviewedBy: 'Admin User', reviewedDate: TODAY, adminNotes: values.adminNotes || 'Please revise and resubmit.' } : r
        ));
        // Restore credits if previously approved
        if (wasApproved) restoreBalance(req.email, req.leaveType, req.totalDays);
      },
    });
  };


  // ── Leave Type CRUD ────────────────────────────────────────────────────────
  const openCreateLt = () => {
    setLtEditId(null);
    setLtForm({ name: '', defaultCredits: '5', resetFrequency: 'annual', resetMonth: '1', resetDay: '1' });
    setLtModalOpen(true);
  };

  const openEditLt = (lt: LeaveType) => {
    setLtEditId(lt.id);
    setLtForm({
      name: lt.name,
      defaultCredits: String(lt.defaultCredits),
      resetFrequency: lt.resetFrequency,
      resetMonth: String(lt.resetMonth ?? 1),
      resetDay: String(lt.resetDay ?? 1),
    });
    setLtModalOpen(true);
  };

  const handleSaveLt = () => {
    const saved: LeaveType = {
      id: ltEditId ?? genId(),
      name: ltForm.name.trim(),
      defaultCredits: parseInt(ltForm.defaultCredits, 10) || 0,
      resetFrequency: ltForm.resetFrequency,
      resetMonth: ltForm.resetFrequency === 'annual'  ? parseInt(ltForm.resetMonth, 10) : null,
      resetDay:   ltForm.resetFrequency !== 'never'   ? parseInt(ltForm.resetDay, 10)   : null,
    };
    if (ltEditId) {
      setLeaveTypes(prev => prev.map(t => t.id === ltEditId ? saved : t));
      setBalances(prev => prev.map(b => ({
        ...b, leaves: b.leaves.map(e => e.leaveTypeId === ltEditId ? { ...e, leaveTypeName: saved.name } : e),
      })));
    } else {
      setLeaveTypes(prev => [...prev, saved]);
    }
    setLtModalOpen(false);
  };

  const handleDeleteLt = (id: string) => {
    setLeaveTypes(prev => prev.filter(t => t.id !== id));
    setBalances(prev => prev.map(b => ({ ...b, leaves: b.leaves.filter(e => e.leaveTypeId !== id) })));
  };

  // ── Employee Balance management ────────────────────────────────────────────
  // Always derived live so balance changes (from approvals) reflect immediately
  const managingEmpLive = useMemo(() =>
    managingEmp ? (balances.find(b => b.id === managingEmp.id) ?? managingEmp) : null,
  [managingEmp, balances]);

  const empRequests = useMemo(() =>
    managingEmpLive ? requests.filter(r => r.email === managingEmpLive.email) : [],
  [managingEmpLive, requests]);

  const openManageEmp = (bal: LeaveBalance) => {
    setManagingEmp(bal);
    setAddLtOpen(false);
    setAddLtForm({ leaveTypeId: '', leaveTypeName: '', totalCredits: '', expiresOn: '', resetOn: '' });
  };

  const handleSelectLtForEmp = (lt: LeaveType) => {
    const { expiresOn, resetOn } = nextResetDates(lt);
    setAddLtForm(p => ({
      ...p,
      leaveTypeId:   lt.id,
      leaveTypeName: lt.name,
      totalCredits:  String(lt.defaultCredits),
      expiresOn,
      resetOn,
    }));
  };

  const handleCreateLtForEmp = (name: string) => {
    const newLt: LeaveType = { id: genId(), name, defaultCredits: 5, resetFrequency: 'never', resetMonth: null, resetDay: null };
    setLeaveTypes(prev => [...prev, newLt]);
    setAddLtForm(p => ({ ...p, leaveTypeId: newLt.id, leaveTypeName: newLt.name, totalCredits: '5' }));
  };

  const handleAddLeaveEntry = () => {
    if (!managingEmpLive || !addLtForm.leaveTypeId) return;
    const entry: EmployeeLeaveEntry = {
      leaveTypeId:   addLtForm.leaveTypeId,
      leaveTypeName: addLtForm.leaveTypeName,
      totalCredits:  parseInt(addLtForm.totalCredits, 10) || 0,
      used:      0,
      expiresOn: addLtForm.expiresOn || null,
      resetOn:   addLtForm.resetOn   || null,
    };
    setBalances(prev => prev.map(b => b.id === managingEmpLive.id ? { ...b, leaves: [...b.leaves, entry] } : b));
    setAddLtOpen(false);
    setAddLtForm({ leaveTypeId: '', leaveTypeName: '', totalCredits: '', expiresOn: '', resetOn: '' });
  };

  const handleRemoveLeaveEntry = (balId: string, leaveTypeId: string) => {
    setBalances(prev => prev.map(b => b.id === balId ? { ...b, leaves: b.leaves.filter(e => e.leaveTypeId !== leaveTypeId) } : b));
  };

  const openAdjust = (balId: string, entry: EmployeeLeaveEntry) => {
    setAdjustDialog({ balId, entry });
    setAdjustForm({ action: 'add', days: '', reason: '' });
  };

  const handleConfirmAdjust = () => {
    if (!adjustDialog) return;
    const days = parseInt(adjustForm.days, 10) || 0;
    const { balId, entry } = adjustDialog;
    const applyEntry = (e: EmployeeLeaveEntry): EmployeeLeaveEntry => {
      if (e.leaveTypeId !== entry.leaveTypeId) return e;
      if (adjustForm.action === 'add') return { ...e, totalCredits: e.totalCredits + days };
      if (adjustForm.action === 'set') return { ...e, totalCredits: Math.max(days, e.used) };
      return { ...e, used: Math.min(e.used + days, e.totalCredits) };
    };
    setBalances(prev => prev.map(b => b.id === balId ? { ...b, leaves: b.leaves.map(applyEntry) } : b));
    setAdjustDialog(null);
  };

  // ── Refresh ────────────────────────────────────────────────────────────────
  const handleRefreshRequests = () => {
    setRequests(initialRequests);
    const r = { ...defaultReqFilters };
    setReqFilters(r); setAppliedReqFilters(r);
  };
  const handleRefreshBalances = () => {
    setBalances(initialBalances);
    const r = { ...defaultBalFilters };
    setBalFilters(r); setAppliedBalFilters(r);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Pending Requests"     value={kpi.pending}       icon={ClipboardList} color="yellow" trend={{ value: 'awaiting review', isPositive: false }} />
        <KPICard title="Approved This Month"  value={kpi.approvedMonth} icon={UserCheck}     color="green"  trend={{ value: 'this month',      isPositive: true  }} />
        <KPICard title="Returned for Revision" value={kpi.revisionMonth} icon={X}            color="red"    trend={{ value: 'this month',      isPositive: false }} />
        <KPICard title="Currently On Leave"   value={kpi.onLeave}       icon={Users}         color="blue"   trend={{ value: 'as of today',     isPositive: true  }} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="requests">
        <TabsList className="mb-4">
          <TabsTrigger value="requests">Leave Requests</TabsTrigger>
          <TabsTrigger value="leave-management">Leave Management</TabsTrigger>
        </TabsList>

        {/* ── Leave Requests ──────────────────────────────────────────────── */}
        <TabsContent value="requests" className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_160px_160px_140px_auto_auto] gap-3 items-end">
              <div>
                <label className="text-sm text-gray-600">Status</label>
                <select value={reqFilters.status} onChange={e => setReqFilters(p => ({ ...p, status: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]">
                  {['All','Pending','Approved','Revision'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600">Store</label>
                <select value={reqFilters.store} onChange={e => setReqFilters(p => ({ ...p, store: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]">
                  {storeOptions.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600">Leave Type</label>
                <select value={reqFilters.leaveType} onChange={e => setReqFilters(p => ({ ...p, leaveType: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]">
                  {leaveTypeOptions.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600">Date From</label>
                <Input type="date" className="mt-1" value={reqFilters.dateFrom}
                  onChange={e => setReqFilters(p => ({ ...p, dateFrom: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm text-gray-600">Date To</label>
                <Input type="date" className="mt-1" value={reqFilters.dateTo}
                  onChange={e => setReqFilters(p => ({ ...p, dateTo: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm text-gray-600">Search</label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input placeholder="Name, ID, or email…" className="pl-10" value={reqFilters.search}
                    onChange={e => setReqFilters(p => ({ ...p, search: e.target.value }))} />
                </div>
              </div>
              <Button className="h-10 bg-[#1F4FD8] hover:bg-[#1845b8]" onClick={() => setAppliedReqFilters(reqFilters)}>Apply</Button>
              <Button variant="outline" size="icon" className="h-10 w-10" title="Refresh" onClick={handleRefreshRequests}><RefreshCw className="w-4 h-4" /></Button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">Leave Requests</h3>
              <p className="text-sm text-gray-500 mt-1">All employee leave requests — approve, return, or view details.</p>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 z-10 bg-white shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">Actions</TableHead>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Applied On</TableHead>
                    <TableHead>Documents Submitted</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reqPagination.paginatedItems.map(req => (
                    <TableRow key={req.id} className="hover:bg-gray-50">
                      <TableCell className="sticky left-0 z-10 bg-white shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                        <div className="flex flex-wrap items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setViewRequest(req)} className="text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                            <Eye className="w-4 h-4 mr-1" /> View
                          </Button>
                          {req.status === 'pending' && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleApprove(req)} className="text-green-700 hover:text-green-800 hover:bg-green-50">
                                <Check className="w-4 h-4 mr-1" /> Approve
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleReturn(req)} className="text-purple-700 hover:text-purple-800 hover:bg-purple-50">
                                <X className="w-4 h-4 mr-1" /> Return
                              </Button>
                            </>
                          )}
                          {req.status === 'approved' && (
                            <Button variant="ghost" size="sm" onClick={() => handleReturn(req)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                              <X className="w-4 h-4 mr-1" /> Revoke
                            </Button>
                          )}
                          {req.status === 'revision' && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleApprove(req)} className="text-green-700 hover:text-green-800 hover:bg-green-50">
                                <Check className="w-4 h-4 mr-1" /> Approve
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleReturn(req)} className="text-purple-700 hover:text-purple-800 hover:bg-purple-50">
                                <X className="w-4 h-4 mr-1" /> Return
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-gray-900 whitespace-nowrap">{req.requestId}</TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-gray-900">{req.employeeName}</div>
                        <div className="text-xs text-gray-500">{req.email}</div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-[160px] truncate">{req.store}</TableCell>
                      <TableCell className="text-sm text-gray-700 whitespace-nowrap">{req.leaveType}</TableCell>
                      <TableCell className="text-sm text-gray-600 whitespace-nowrap">{req.startDate}</TableCell>
                      <TableCell className="text-sm text-gray-600 whitespace-nowrap">{req.endDate}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-800 text-sm font-bold">{req.totalDays}</span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-[200px]">
                        <span className="line-clamp-2">{req.reason}</span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 whitespace-nowrap">{req.appliedDate}</TableCell>
                      <TableCell>
                        {req.documents.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {req.documents.map(doc => (
                              <span key={doc} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 whitespace-nowrap">{doc}</span>
                            ))}
                          </div>
                        ) : <span className="text-xs text-gray-400 italic">None</span>}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[req.status]}`}>
                          {statusLabel[req.status]}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {reqPagination.paginatedItems.length === 0 && (
                    <TableRow><TableCell colSpan={12} className="text-center py-8 text-gray-400">No leave requests match the current filters.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              <TablePaginationControls
                currentPage={reqPagination.currentPage} totalPages={reqPagination.totalPages}
                pageSize={reqPagination.pageSize} totalItems={reqPagination.totalItems}
                onPrevious={reqPagination.goToPreviousPage} onNext={reqPagination.goToNextPage}
                onPageChange={reqPagination.goToPage} onPageSizeChange={reqPagination.setPageSize}
              />
            </div>
          </div>
        </TabsContent>

        {/* ── Leave Management ────────────────────────────────────────────── */}
        <TabsContent value="leave-management" className="space-y-6">

          {/* Leave Types section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Leave Types</h3>
                <p className="text-sm text-gray-500">Configure leave type names, default credits, and reset schedules.</p>
              </div>
              <Button className="bg-[#1F4FD8] hover:bg-[#1845b8]" onClick={openCreateLt}>
                <Plus className="w-4 h-4 mr-1" /> Create Leave Type
              </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <Table className="w-auto min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Leave Type Name</TableHead>
                      <TableHead>Default Credits</TableHead>
                      <TableHead>Credit Reset</TableHead>
                      <TableHead>Reset Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ltPagination.paginatedItems.map(lt => (
                      <TableRow key={lt.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-900">{lt.name}</TableCell>
                        <TableCell>
                          <span className="text-sm font-semibold text-gray-800">{lt.defaultCredits}</span>
                          <span className="text-xs text-gray-400 ml-1">days</span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            lt.resetFrequency === 'annual'
                              ? 'bg-blue-100 text-blue-800'
                              : lt.resetFrequency === 'monthly'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-100 text-gray-600'
                          }`}>
                            {lt.resetFrequency === 'annual' ? 'Annual' : lt.resetFrequency === 'monthly' ? 'Monthly' : 'Never'}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 whitespace-nowrap">{formatResetDate(lt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEditLt(lt)} className="text-[#1F4FD8] hover:text-[#1845b8] hover:bg-blue-50">
                              <Edit3 className="w-4 h-4 mr-1" /> Edit
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteLt(lt.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                              <Trash2 className="w-4 h-4 mr-1" /> Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {ltPagination.paginatedItems.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-400">No leave types configured yet.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
                <TablePaginationControls
                  currentPage={ltPagination.currentPage} totalPages={ltPagination.totalPages}
                  pageSize={ltPagination.pageSize} totalItems={ltPagination.totalItems}
                  onPrevious={ltPagination.goToPreviousPage} onNext={ltPagination.goToNextPage}
                  onPageChange={ltPagination.goToPage} onPageSizeChange={ltPagination.setPageSize}
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200" />

          {/* Employee Leave Balances section */}
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Employee Leave Balances</h3>
              <p className="text-sm text-gray-500">View and adjust leave credits per employee. Click Manage to see credits by leave type.</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end">
                <div>
                  <label className="text-sm text-gray-600">Store</label>
                  <select value={balFilters.store} onChange={e => setBalFilters(p => ({ ...p, store: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]">
                    {storeOptions.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Search Employee</label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input placeholder="Name or email…" className="pl-10" value={balFilters.search}
                      onChange={e => setBalFilters(p => ({ ...p, search: e.target.value }))} />
                  </div>
                </div>
                <Button className="h-10 bg-[#1F4FD8] hover:bg-[#1845b8]" onClick={() => setAppliedBalFilters(balFilters)}>Apply</Button>
                <Button variant="outline" size="icon" className="h-10 w-10" title="Refresh" onClick={handleRefreshBalances}><RefreshCw className="w-4 h-4" /></Button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <Table className="w-auto min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Store</TableHead>
                      <TableHead>Assigned Leave Types</TableHead>
                      <TableHead>Total Credits Remaining</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {balPagination.paginatedItems.map(bal => {
                      const totalCredits = bal.leaves.reduce((s, e) => s + e.totalCredits, 0);
                      const totalUsed    = bal.leaves.reduce((s, e) => s + e.used, 0);
                      return (
                        <TableRow key={bal.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="text-sm font-medium text-gray-900">{bal.employeeName}</div>
                            <div className="text-xs text-gray-500">{bal.email}</div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 max-w-[160px] truncate">{bal.store}</TableCell>
                          <TableCell>
                            <span className="text-sm font-semibold text-gray-800">{bal.leaves.length}</span>
                            <span className="text-xs text-gray-400 ml-1">type{bal.leaves.length !== 1 ? 's' : ''}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-semibold text-gray-800">{totalCredits - totalUsed}</span>
                            <span className="text-xs text-gray-400 ml-1">/ {totalCredits} days</span>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => openManageEmp(bal)} className="text-[#1F4FD8] hover:text-[#1845b8] hover:bg-blue-50">
                              <Edit3 className="w-4 h-4 mr-1" /> Manage Credits
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {balPagination.paginatedItems.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-400">No employees match the current filters.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
                <TablePaginationControls
                  currentPage={balPagination.currentPage} totalPages={balPagination.totalPages}
                  pageSize={balPagination.pageSize} totalItems={balPagination.totalItems}
                  onPrevious={balPagination.goToPreviousPage} onNext={balPagination.goToNextPage}
                  onPageChange={balPagination.goToPage} onPageSizeChange={balPagination.setPageSize}
                />
              </div>
            </div>
          </div>

        </TabsContent>
      </Tabs>

      {/* ── View Request Dialog ──────────────────────────────────────────── */}
      <Dialog open={!!viewRequest} onOpenChange={open => { if (!open) setViewRequest(null); }}>
        <DialogContent className="w-[96vw] max-w-lg max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Leave Request Details</DialogTitle>
            <DialogDescription>Full information for request {viewRequest?.requestId}.</DialogDescription>
          </DialogHeader>
          {viewRequest && (
            <div className="overflow-auto max-h-[65vh] space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="font-semibold text-gray-800">Request ID:</span><br /><span className="text-gray-600">{viewRequest.requestId}</span></div>
                <div><span className="font-semibold text-gray-800">Status:</span><br />
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[viewRequest.status]}`}>{statusLabel[viewRequest.status]}</span>
                </div>
                <div><span className="font-semibold text-gray-800">Employee:</span><br /><span className="text-gray-600">{viewRequest.employeeName}</span></div>
                <div><span className="font-semibold text-gray-800">Email:</span><br /><span className="text-gray-600">{viewRequest.email}</span></div>
                <div><span className="font-semibold text-gray-800">Store:</span><br /><span className="text-gray-600">{viewRequest.store}</span></div>
                <div><span className="font-semibold text-gray-800">Leave Type:</span><br /><span className="text-gray-600">{viewRequest.leaveType}</span></div>
                <div><span className="font-semibold text-gray-800">Start Date:</span><br /><span className="text-gray-600">{viewRequest.startDate}</span></div>
                <div><span className="font-semibold text-gray-800">End Date:</span><br /><span className="text-gray-600">{viewRequest.endDate}</span></div>
                <div><span className="font-semibold text-gray-800">Total Days:</span><br /><span className="text-[#1F4FD8] font-bold text-lg">{viewRequest.totalDays}</span></div>
                <div><span className="font-semibold text-gray-800">Applied On:</span><br /><span className="text-gray-600">{viewRequest.appliedDate}</span></div>
              </div>
              <div><span className="font-semibold text-gray-800">Reason:</span><br /><span className="text-gray-600">{viewRequest.reason}</span></div>
              <div>
                <span className="font-semibold text-gray-800">Documents Submitted:</span><br />
                {viewRequest.documents.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {viewRequest.documents.map(doc => (
                      <span key={doc} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">{doc}</span>
                    ))}
                  </div>
                ) : <span className="text-gray-400 italic text-sm">No documents submitted.</span>}
              </div>
              {viewRequest.reviewedBy && (
                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <div><span className="font-semibold text-gray-800">Reviewed By:</span> <span className="text-gray-600">{viewRequest.reviewedBy}</span></div>
                  <div><span className="font-semibold text-gray-800">Reviewed On:</span> <span className="text-gray-600">{viewRequest.reviewedDate}</span></div>
                  {viewRequest.adminNotes && <div><span className="font-semibold text-gray-800">Admin Notes:</span><br /><span className="text-gray-600">{viewRequest.adminNotes}</span></div>}
                </div>
              )}
            </div>
          )}
          <DialogFooter><Button onClick={() => setViewRequest(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create / Edit Leave Type Dialog ─────────────────────────────── */}
      <Dialog open={ltModalOpen} onOpenChange={open => { if (!open) setLtModalOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{ltEditId ? 'Edit Leave Type' : 'Create Leave Type'}</DialogTitle>
            <DialogDescription>{ltEditId ? 'Update the leave type details.' : 'Define a new leave type for employees.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Name</label>
              <input className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                placeholder="e.g. Sick Leave" value={ltForm.name} onChange={e => setLtForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Default Credits (days)</label>
              <input type="number" min="0"
                className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                value={ltForm.defaultCredits} onChange={e => setLtForm(p => ({ ...p, defaultCredits: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Reset Frequency</label>
              <select className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                value={ltForm.resetFrequency} onChange={e => setLtForm(p => ({ ...p, resetFrequency: e.target.value as 'annual' | 'monthly' | 'never' }))}>
                <option value="annual">Annual</option>
                <option value="monthly">Monthly</option>
                <option value="never">Never (one-time)</option>
              </select>
            </div>
            {ltForm.resetFrequency === 'annual' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Reset Month</label>
                  <select className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                    value={ltForm.resetMonth} onChange={e => setLtForm(p => ({ ...p, resetMonth: e.target.value }))}>
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Reset Day</label>
                  <input type="number" min="1" max="31"
                    className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                    value={ltForm.resetDay} onChange={e => setLtForm(p => ({ ...p, resetDay: e.target.value }))} />
                </div>
              </div>
            )}
            {ltForm.resetFrequency === 'monthly' && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Reset Day</label>
                <input type="number" min="1" max="31"
                  className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                  value={ltForm.resetDay} onChange={e => setLtForm(p => ({ ...p, resetDay: e.target.value }))} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLtModalOpen(false)}>Cancel</Button>
            <Button className="bg-[#1F4FD8] hover:bg-[#1845b8]" onClick={handleSaveLt} disabled={!ltForm.name.trim()}>
              {ltEditId ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Employee Balance Management Dialog ──────────────────────────── */}
      <Dialog open={!!managingEmp} onOpenChange={open => { if (!open) setManagingEmp(null); }}>
        <DialogContent className="w-[96vw] max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Leave Balances — {managingEmpLive?.employeeName}</DialogTitle>
            <DialogDescription>{managingEmpLive?.email} · {managingEmpLive?.store}</DialogDescription>
          </DialogHeader>
          <div className="overflow-auto max-h-[70vh] space-y-5">

            {/* Leave credits by type */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700">Leave Credits by Type</p>
              {managingEmpLive && managingEmpLive.leaves.length > 0 ? (
                <Table className="w-auto min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Used</TableHead>
                      <TableHead>Remaining</TableHead>
                      <TableHead>Expires On</TableHead>
                      <TableHead>Resets On</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {managingEmpLive.leaves.map(entry => {
                      const remaining = entry.totalCredits - entry.used;
                      return (
                        <TableRow key={entry.leaveTypeId} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-gray-900">{entry.leaveTypeName}</TableCell>
                          <TableCell>
                            <span className="text-sm font-semibold text-gray-800">{entry.totalCredits}</span>
                            <span className="text-xs text-gray-400 ml-1">days</span>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">{entry.used}</TableCell>
                          <TableCell>
                            <span className={`text-sm font-semibold ${remaining === 0 ? 'text-red-600' : 'text-green-700'}`}>{remaining}</span>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500 whitespace-nowrap">{entry.expiresOn ?? '—'}</TableCell>
                          <TableCell className="text-sm text-gray-500 whitespace-nowrap">{entry.resetOn ?? '—'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openAdjust(managingEmpLive.id, entry)} className="text-[#1F4FD8] hover:text-[#1845b8] hover:bg-blue-50">
                                <Edit3 className="w-4 h-4 mr-1" /> Adjust
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleRemoveLeaveEntry(managingEmpLive.id, entry.leaveTypeId)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="w-4 h-4 mr-1" /> Remove
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6 text-gray-400 text-sm">No leave types assigned yet.</div>
              )}

              {/* Add Leave Type */}
              {!addLtOpen ? (
                <Button variant="outline" className="w-full border-dashed text-[#1F4FD8] hover:bg-blue-50"
                  onClick={() => { setAddLtOpen(true); setAddLtForm({ leaveTypeId: '', leaveTypeName: '', totalCredits: '', expiresOn: '', resetOn: '' }); }}>
                  <Plus className="w-4 h-4 mr-2" /> Add Leave Type
                </Button>
              ) : (
                <div className="border border-blue-200 rounded-lg p-4 bg-blue-50/30 space-y-3">
                  <p className="text-sm font-medium text-gray-700">Add Leave Type</p>
                  <LeaveTypeCombobox
                    leaveTypes={leaveTypes}
                    excludeIds={managingEmpLive?.leaves.map(e => e.leaveTypeId) ?? []}
                    onSelect={handleSelectLtForEmp}
                    onCreateNew={handleCreateLtForEmp}
                  />
                  {addLtForm.leaveTypeId && (
                    <>
                      <p className="text-xs text-gray-500">Selected: <strong className="text-gray-700">{addLtForm.leaveTypeName}</strong></p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-600">Credits</label>
                          <input type="number" min="0" placeholder="e.g. 5"
                            className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                            value={addLtForm.totalCredits} onChange={e => setAddLtForm(p => ({ ...p, totalCredits: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-600">Expires On</label>
                          <input type="date"
                            className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                            value={addLtForm.expiresOn} onChange={e => setAddLtForm(p => ({ ...p, expiresOn: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-600">Resets On</label>
                          <input type="date"
                            className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                            value={addLtForm.resetOn} onChange={e => setAddLtForm(p => ({ ...p, resetOn: e.target.value }))} />
                        </div>
                      </div>
                    </>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-[#1F4FD8] hover:bg-[#1845b8]"
                      disabled={!addLtForm.leaveTypeId || !addLtForm.totalCredits}
                      onClick={handleAddLeaveEntry}>
                      Add
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setAddLtOpen(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>

            {/* Leave Request History */}
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <p className="text-sm font-semibold text-gray-700">Leave Request History</p>
              {empRequests.length > 0 ? (
                <Table className="w-auto min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request ID</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Applied On</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {empRequests.map(req => (
                      <TableRow key={req.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-900 text-xs whitespace-nowrap">{req.requestId}</TableCell>
                        <TableCell className="text-sm text-gray-700 whitespace-nowrap">{req.leaveType}</TableCell>
                        <TableCell className="text-sm text-gray-600 whitespace-nowrap">{req.startDate}</TableCell>
                        <TableCell className="text-sm text-gray-600 whitespace-nowrap">{req.endDate}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 text-blue-800 text-xs font-bold">{req.totalDays}</span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 whitespace-nowrap">{req.appliedDate}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[req.status]}`}>
                            {statusLabel[req.status]}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-gray-400 italic py-4 text-center">No leave requests found for this employee.</p>
              )}
            </div>

          </div>
          <DialogFooter><Button onClick={() => setManagingEmp(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Adjust Credits Dialog ────────────────────────────────────────── */}
      <Dialog open={!!adjustDialog} onOpenChange={open => { if (!open) setAdjustDialog(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Adjust Leave Credits</DialogTitle>
            <DialogDescription>
              {adjustDialog?.entry.leaveTypeName} — {managingEmp?.employeeName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Action</label>
              <select className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                value={adjustForm.action} onChange={e => setAdjustForm(p => ({ ...p, action: e.target.value as 'add' | 'deduct' | 'set' }))}>
                <option value="add">Add leave credits</option>
                <option value="deduct">Deduct leave credits</option>
                <option value="set">Set total credits</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">{adjustForm.action === 'set' ? 'Total Credits' : 'Number of Days'}</label>
              <input type="number" min="1" placeholder="e.g. 2"
                className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                value={adjustForm.days} onChange={e => setAdjustForm(p => ({ ...p, days: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Reason</label>
              <input placeholder="Reason for adjustment…"
                className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                value={adjustForm.reason} onChange={e => setAdjustForm(p => ({ ...p, reason: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialog(null)}>Cancel</Button>
            <Button className="bg-[#1F4FD8] hover:bg-[#1845b8]" disabled={!adjustForm.days} onClick={handleConfirmAdjust}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ActionFlowModal config={actionConfig} onClose={() => setActionConfig(null)} />
    </div>
  );
}
