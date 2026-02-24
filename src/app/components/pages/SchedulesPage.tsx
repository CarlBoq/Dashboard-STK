import { useMemo, useState } from 'react';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, Clock3, Pencil, Plus, Search, Trash2 } from 'lucide-react';
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

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface RangeCell {
  day: number;
  date: Date;
}

interface ScheduleEntry {
  id: string;
  name: string;
  position: string;
  date: string;
  startShift: string;
  endShift: string;
  breakMinutes: number;
  totalHours: number;
  otHours: number;
  nightDiffHours: number;
  restdayHours: number;
}

interface ScheduleFormState {
  personnel: string;
  store: string;
  position: string;
  timeIn: string;
  timeOut: string;
  breakMinutes: string;
  otHours: string;
  nightDiffHours: string;
  rdWorkHours: string;
}

const personnelOptions = [
  'Juan Dela Cruz',
  'Maria Santos',
  'Carlo Reyes',
  'Ana Villanueva',
];

const defaultStores = [
  'Sparkle Star International Corporation',
  'Sparkle Timekeeping Satellite Office',
  'Sparkle Timekeeping Logistics Hub',
];

const initialScheduleRecords: ScheduleEntry[] = [
  {
    id: 'sch-1',
    name: 'Juan Dela Cruz',
    position: 'Cashier',
    date: '2026-02-13',
    startShift: '09:00',
    endShift: '18:00',
    breakMinutes: 60,
    totalHours: 8,
    otHours: 1,
    nightDiffHours: 0,
    restdayHours: 0,
  },
  {
    id: 'sch-2',
    name: 'Maria Santos',
    position: 'Supervisor',
    date: '2026-02-13',
    startShift: '08:00',
    endShift: '17:00',
    breakMinutes: 60,
    totalHours: 8,
    otHours: 0,
    nightDiffHours: 0,
    restdayHours: 0,
  },
];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDisplayDate(date: Date | null) {
  if (!date) return '-';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isSameDay(a: Date | null, b: Date | null) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isBetween(date: Date, start: Date | null, end: Date | null) {
  if (!start || !end) return false;
  const value = date.getTime();
  return value >= start.getTime() && value <= end.getTime();
}

function getTotalHours(timeIn: string, timeOut: string, breakMinutes: string) {
  if (!timeIn || !timeOut) return 0;
  const [startHour, startMinute] = timeIn.split(':').map(Number);
  const [endHour, endMinute] = timeOut.split(':').map(Number);

  if (Number.isNaN(startHour) || Number.isNaN(startMinute) || Number.isNaN(endHour) || Number.isNaN(endMinute)) {
    return 0;
  }

  const start = startHour * 60 + startMinute;
  let end = endHour * 60 + endMinute;
  if (end <= start) {
    end += 24 * 60;
  }

  const breakMins = Number(breakMinutes) || 0;
  const totalMins = Math.max(end - start - breakMins, 0);
  return Number((totalMins / 60).toFixed(2));
}

export function SchedulesPage() {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [rangeStart, setRangeStart] = useState<Date | null>(today);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(today);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const [actionConfig, setActionConfig] = useState<ActionFlowConfig | null>(null);
  const [scheduleRecords, setScheduleRecords] = useState<ScheduleEntry[]>(initialScheduleRecords);
  const [storeOptions, setStoreOptions] = useState(defaultStores);
  const [searchUser, setSearchUser] = useState('');
  const [selectedDate, setSelectedDate] = useState('2026-02-13');
  const [daysUpToToday, setDaysUpToToday] = useState('0');
  const [daysStartingToday, setDaysStartingToday] = useState('0');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedDate, setAppliedDate] = useState('2026-02-13');

  const [formState, setFormState] = useState<ScheduleFormState>({
    personnel: personnelOptions[0],
    store: defaultStores[0],
    position: 'Cashier',
    timeIn: '09:00',
    timeOut: '18:00',
    breakMinutes: '60',
    otHours: '0',
    nightDiffHours: '0',
    rdWorkHours: '0',
  });

  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const firstWeekday = firstDayOfMonth.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const leadingBlanks = Array.from({ length: firstWeekday }, (_, index) => ({ key: `blank-${index}` }));
    const days: RangeCell[] = Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      return {
        day,
        date: startOfDay(new Date(viewYear, viewMonth, day)),
      };
    });

    return { leadingBlanks, days };
  }, [viewMonth, viewYear]);

  const filteredSchedules = useMemo(() => {
    const keyword = appliedSearch.trim().toLowerCase();
    return scheduleRecords.filter((record) => {
      const matchesSearch = !keyword || record.name.toLowerCase().includes(keyword);
      const matchesDate = !appliedDate || record.date === appliedDate;
      return matchesSearch && matchesDate;
    });
  }, [scheduleRecords, appliedDate, appliedSearch]);

  const upsertFormValue = (key: keyof ScheduleFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handlePickDate = (picked: Date) => {
    const date = startOfDay(picked);
    if (date.getTime() < today.getTime()) return;

    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(date);
      setRangeEnd(null);
      setHoverDate(null);
      return;
    }

    if (date.getTime() < rangeStart.getTime()) {
      setRangeEnd(rangeStart);
      setRangeStart(date);
      setHoverDate(null);
      return;
    }

    setRangeEnd(date);
    setHoverDate(null);
  };

  const handleHoverDate = (candidate: Date | null) => {
    if (!rangeStart || rangeEnd) {
      setHoverDate(null);
      return;
    }

    const nextCandidate = candidate ? startOfDay(candidate) : null;
    if (nextCandidate && nextCandidate.getTime() < today.getTime()) {
      setHoverDate(null);
      return;
    }

    setHoverDate(nextCandidate);
  };

  const applyQuickRange = (mode: 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth') => {
    const now = today;
    const weekday = now.getDay();

    if (mode === 'today') {
      setRangeStart(now);
      setRangeEnd(now);
      return;
    }

    if (mode === 'yesterday') {
      return;
    }

    if (mode === 'thisWeek') {
      const start = new Date(now);
      start.setDate(now.getDate() - weekday);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      setRangeStart(startOfDay(start) < now ? now : startOfDay(start));
      setRangeEnd(startOfDay(end));
      return;
    }

    if (mode === 'lastWeek') {
      return;
    }

    if (mode === 'thisMonth') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setRangeStart(startOfDay(start) < now ? now : startOfDay(start));
      setRangeEnd(startOfDay(end));
      return;
    }

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    setRangeStart(startOfDay(monthStart) < now ? now : startOfDay(monthStart));
    setRangeEnd(startOfDay(monthEnd));
  };

  const applyDayOffsetRange = (mode: 'upToToday' | 'startingToday', rawValue: string) => {
    const parsed = Number(rawValue);
    const days = Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : 0;

    if (mode === 'upToToday') {
      const start = new Date(today);
      start.setDate(today.getDate() - days);
      setRangeStart(startOfDay(start));
      setRangeEnd(today);
      return;
    }

    const end = new Date(today);
    end.setDate(today.getDate() + days);
    setRangeStart(today);
    setRangeEnd(startOfDay(end));
  };

  const goMonth = (direction: -1 | 1) => {
    const next = new Date(viewYear, viewMonth + direction, 1);
    setViewMonth(next.getMonth());
    setViewYear(next.getFullYear());
  };

  const openAddScheduleModal = () => {
    setActionConfig({
      title: 'Add Schedule',
      description: 'Create a schedule entry using placeholder values.',
      actionLabel: 'Save',
      successActionVerb: 'added',
      entityLabel: `the schedule for ${formState.personnel}`,
      fields: [
        { key: 'personnel', label: 'Personnel', value: formState.personnel },
        { key: 'position', label: 'Position', value: formState.position },
        { key: 'date', label: 'Date', type: 'date', value: selectedDate },
        { key: 'timeIn', label: 'Time-in', type: 'time', value: formState.timeIn },
        { key: 'timeOut', label: 'Time-out', type: 'time', value: formState.timeOut },
        { key: 'breakMinutes', label: 'Break Minutes', type: 'number', value: formState.breakMinutes },
      ],
      onApply: (values) => {
        const nextEntry: ScheduleEntry = {
          id: `sch-${Date.now()}`,
          name: values.personnel || formState.personnel,
          position: values.position || formState.position,
          date: values.date || selectedDate,
          startShift: values.timeIn || formState.timeIn,
          endShift: values.timeOut || formState.timeOut,
          breakMinutes: Number(values.breakMinutes || formState.breakMinutes || 0),
          totalHours: getTotalHours(values.timeIn || formState.timeIn, values.timeOut || formState.timeOut, values.breakMinutes || formState.breakMinutes),
          otHours: Number(formState.otHours || 0),
          nightDiffHours: Number(formState.nightDiffHours || 0),
          restdayHours: Number(formState.rdWorkHours || 0),
        };

        setScheduleRecords((prev) => [nextEntry, ...prev]);
        setFormState((prev) => ({
          ...prev,
          personnel: nextEntry.name,
          position: nextEntry.position,
          timeIn: nextEntry.startShift,
          timeOut: nextEntry.endShift,
          breakMinutes: String(nextEntry.breakMinutes),
        }));
      },
    });
  };

  const openEditScheduleModal = (entry: ScheduleEntry) => {
    setActionConfig({
      title: `Edit Schedule: ${entry.name}`,
      description: 'Edit schedule placeholder values.',
      actionLabel: 'Update',
      successActionVerb: 'updated',
      entityLabel: `the schedule for ${entry.name}`,
      fields: [
        { key: 'position', label: 'Position', value: entry.position },
        { key: 'date', label: 'Date', type: 'date', value: entry.date },
        { key: 'timeIn', label: 'Time-in', type: 'time', value: entry.startShift },
        { key: 'timeOut', label: 'Time-out', type: 'time', value: entry.endShift },
        { key: 'breakMinutes', label: 'Break Minutes', type: 'number', value: String(entry.breakMinutes) },
      ],
      onApply: (values) => {
        setScheduleRecords((prev) =>
          prev.map((record) => {
            if (record.id !== entry.id) return record;
            const breakMinutes = Number(values.breakMinutes || record.breakMinutes);
            const startShift = values.timeIn || record.startShift;
            const endShift = values.timeOut || record.endShift;
            return {
              ...record,
              position: values.position || record.position,
              date: values.date || record.date,
              startShift,
              endShift,
              breakMinutes,
              totalHours: getTotalHours(startShift, endShift, String(breakMinutes)),
            };
          })
        );
      },
    });
  };

  const handleAddStore = () => {
    setActionConfig({
      title: 'Add Store',
      description: 'Add a store placeholder for schedule assignment.',
      actionLabel: 'Save',
      successActionVerb: 'added',
      entityLabel: 'a store option',
      fields: [{ key: 'store', label: 'Store Name', value: 'Sparkle Timekeeping New Branch' }],
      onApply: (values) => {
        const nextStore = values.store?.trim() || 'Sparkle Timekeeping New Branch';
        setStoreOptions((prev) => {
          if (prev.includes(nextStore)) return prev;
          return [...prev, nextStore];
        });
        upsertFormValue('store', nextStore);
      },
    });
  };

  const handleRemoveStore = () => {
    setActionConfig({
      title: 'Remove Store',
      description: 'Remove the current store placeholder from schedule options.',
      actionLabel: 'Remove',
      successActionVerb: 'removed',
      entityLabel: formState.store,
      fields: [{ key: 'store', label: 'Store Name', value: formState.store }],
      onApply: () => {
        setStoreOptions((prev) => {
          if (prev.length <= 1) return prev;
          const filtered = prev.filter((store) => store !== formState.store);
          if (filtered.length > 0) {
            upsertFormValue('store', filtered[0]);
          }
          return filtered.length > 0 ? filtered : prev;
        });
      },
    });
  };

  const handleSubmit = () => {
    openAddScheduleModal();
  };

  const handleViewSchedule = () => {
    setAppliedSearch(searchUser);
    setAppliedDate(selectedDate);
  };

  const handleExport = () => {
    const header = 'Name,Position,Date,Start Shift,End Shift,Break Minutes,Total Hours,OT,Nightdiff,Restday';
    const rows = filteredSchedules.map((record) =>
      [
        record.name,
        record.position,
        record.date,
        record.startShift,
        record.endShift,
        record.breakMinutes,
        record.totalHours,
        record.otHours,
        record.nightDiffHours,
        record.restdayHours,
      ].join(',')
    );

    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schedules.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const schedulesPagination = useTablePagination(filteredSchedules);
  const paginatedSchedules = schedulesPagination.paginatedItems;

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 lg:p-6">
        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
          <section className="space-y-4">
            <div className="rounded-lg border border-[#b9ddff] px-4 py-3 flex items-center justify-between">
              <select
                value={formState.personnel}
                onChange={(event) => upsertFormValue('personnel', event.target.value)}
                className="w-full bg-transparent text-sm font-medium text-[#1c99db] outline-none"
              >
                {personnelOptions.map((person) => (
                  <option key={person} value={person}>
                    {person}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#1c99db]" />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => applyQuickRange('today')}>Today</Button>
              <Button size="sm" variant="outline" onClick={() => applyQuickRange('yesterday')}>Yesterday</Button>
              <Button size="sm" variant="outline" onClick={() => applyQuickRange('thisWeek')}>This Week</Button>
              <Button size="sm" variant="outline" onClick={() => applyQuickRange('lastWeek')}>Last Week</Button>
              <Button size="sm" variant="outline" onClick={() => applyQuickRange('thisMonth')}>This Month</Button>
              <Button size="sm" variant="outline" onClick={() => applyQuickRange('lastMonth')}>Last Month</Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={daysUpToToday}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setDaysUpToToday(nextValue);
                    applyDayOffsetRange('upToToday', nextValue);
                  }}
                  className="h-9 w-20"
                />
                <span className="text-sm text-gray-700">days up to today</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={daysStartingToday}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setDaysStartingToday(nextValue);
                    applyDayOffsetRange('startingToday', nextValue);
                  }}
                  className="h-9 w-20"
                />
                <span className="text-sm text-gray-700">days starting today</span>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-4 bg-[#fcfdff]">
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="h-10 rounded-md border border-gray-300 bg-white px-3 flex items-center justify-center text-sm text-gray-600">
                  {formatDisplayDate(rangeStart)}
                </div>
                <div className="h-10 rounded-md border border-gray-300 bg-white px-3 flex items-center justify-center text-sm text-gray-600">
                  {formatDisplayDate(rangeEnd)}
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <Button size="icon" variant="outline" onClick={() => goMonth(-1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-4 text-gray-800">
                  <button type="button" className="flex items-center gap-1 text-base font-medium">
                    {MONTH_NAMES[viewMonth]}
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>
                  <button type="button" className="flex items-center gap-1 text-base font-medium">
                    {viewYear}
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <Button size="icon" variant="outline" onClick={() => goMonth(1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-sm text-gray-500 mb-2">{MONTH_NAMES[viewMonth].slice(0, 3)} {viewYear}</p>

              <div className="grid grid-cols-7 text-center text-xs text-gray-500 mb-1">
                {WEEK_DAYS.map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
                {calendarCells.leadingBlanks.map((blank) => (
                  <div key={blank.key} className="h-9" />
                ))}

                {calendarCells.days.map(({ day, date }) => {
                  const activeStart = rangeStart;
                  const activeEnd = rangeEnd ?? hoverDate;
                  const rangeStartDate =
                    activeStart && activeEnd && activeStart.getTime() > activeEnd.getTime() ? activeEnd : activeStart;
                  const rangeEndDate =
                    activeStart && activeEnd && activeStart.getTime() > activeEnd.getTime() ? activeStart : activeEnd;

                  const inRange =
                    (rangeStartDate && rangeEndDate && isBetween(date, rangeStartDate, rangeEndDate)) ||
                    isSameDay(date, activeStart);
                  const isStart = isSameDay(date, rangeStartDate);
                  const isEnd = isSameDay(date, rangeEndDate);
                  const isSelected = isSameDay(date, rangeStart) || isSameDay(date, rangeEnd);
                  const isHoverTarget = Boolean(!rangeEnd && rangeStart && isSameDay(date, hoverDate));
                  const isPast = date.getTime() < today.getTime();
                  const isToday = isSameDay(date, today);

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handlePickDate(date)}
                      onMouseEnter={() => handleHoverDate(date)}
                      onFocus={() => handleHoverDate(date)}
                      onMouseLeave={() => handleHoverDate(null)}
                      onBlur={() => handleHoverDate(null)}
                      disabled={isPast}
                      className={[
                        'h-9 text-sm relative transition-all duration-200 ease-out outline-none ring-offset-0',
                        isPast ? 'text-gray-300 cursor-not-allowed rounded-md' : 'cursor-pointer',
                        !isPast && isSelected ? 'bg-blue-300 text-blue-950' : '',
                        !isPast && !isSelected && inRange ? 'bg-blue-100 text-blue-900' : '',
                        !isPast && !inRange && !isToday ? 'text-gray-700 hover:bg-blue-50' : '',
                        isToday && !isSelected ? 'bg-blue-50 text-blue-900' : '',
                        isStart && isEnd ? 'rounded-md' : '',
                        isStart && !isEnd ? 'rounded-l-full rounded-r-md' : '',
                        isEnd && !isStart ? 'rounded-r-full rounded-l-md' : '',
                        inRange && !isStart && !isEnd ? 'rounded-md' : '',
                        !inRange ? 'rounded-md' : '',
                        !isPast && (isSelected || isHoverTarget)
                          ? 'ring-2 ring-[#1F4FD8] ring-inset'
                          : !isPast
                            ? 'hover:ring-2 hover:ring-[#1F4FD8]/80 hover:ring-inset focus-visible:ring-2 focus-visible:ring-[#1F4FD8] focus-visible:ring-inset'
                            : '',
                      ].join(' ')}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">Store</label>
              <div className="mt-1 grid grid-cols-[1fr_auto_auto] gap-2">
                <select
                  value={formState.store}
                  onChange={(event) => upsertFormValue('store', event.target.value)}
                  className="h-10 border border-gray-300 rounded-md px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                >
                  {storeOptions.map((store) => (
                    <option key={store} value={store}>
                      {store}
                    </option>
                  ))}
                </select>
                <Button variant="outline" size="icon" onClick={handleAddStore}><Plus className="w-4 h-4" /></Button>
                <Button variant="outline" size="icon" onClick={handleRemoveStore} disabled={storeOptions.length <= 1}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600">Time-in</label>
                <div className="relative">
                  <Input
                    type="time"
                    className="h-10 pr-10"
                    value={formState.timeIn}
                    onChange={(event) => upsertFormValue('timeIn', event.target.value)}
                  />
                  <Clock3 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Time-out</label>
                <div className="relative">
                  <Input
                    type="time"
                    className="h-10 pr-10"
                    value={formState.timeOut}
                    onChange={(event) => upsertFormValue('timeOut', event.target.value)}
                  />
                  <Clock3 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">No. of breaks (mins)</label>
                <Input
                  className="h-10"
                  value={formState.breakMinutes}
                  onChange={(event) => upsertFormValue('breakMinutes', event.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Position</label>
                <Input
                  className="h-10"
                  value={formState.position}
                  onChange={(event) => upsertFormValue('position', event.target.value)}
                  placeholder="Enter position"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">OT (Hours)</label>
                <Input
                  className="h-10"
                  value={formState.otHours}
                  onChange={(event) => upsertFormValue('otHours', event.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Night Diff (Hours)</label>
                <Input
                  className="h-10"
                  value={formState.nightDiffHours}
                  onChange={(event) => upsertFormValue('nightDiffHours', event.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">RD work (Hours)</label>
                <Input
                  className="h-10"
                  value={formState.rdWorkHours}
                  onChange={(event) => upsertFormValue('rdWorkHours', event.target.value)}
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button onClick={handleSubmit} className="w-40">Submit</Button>
            </div>
          </section>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 lg:p-6 space-y-4">
        <div className="grid grid-cols-2 text-center">
          <div className="text-sky-500 font-semibold border-b-2 border-sky-500 pb-2">Regular Schedule</div>
          <div className="text-gray-500 font-semibold pb-2">Schedule Cost</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px_auto_auto] gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchUser}
              onChange={(event) => setSearchUser(event.target.value)}
              placeholder="Search user by name"
              className="pl-10 h-10"
            />
          </div>
          <div className="relative">
            <Input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="h-10"
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          </div>
          <Button className="h-10" onClick={handleViewSchedule}>View Schedule</Button>
          <Button className="h-10" variant="outline" onClick={handleExport}>Export</Button>
        </div>

        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Start Shift</TableHead>
                <TableHead>End Shift</TableHead>
                <TableHead>Break Minutes</TableHead>
                <TableHead>Total Hours</TableHead>
                <TableHead>OT (Hours)</TableHead>
                <TableHead>Nightdiff (Hours)</TableHead>
                <TableHead>Restday (Hours)</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSchedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="py-10 text-center">
                    <p className="text-xl font-semibold text-gray-800">Not found</p>
                    <p className="text-sm text-gray-500 mt-2">No results found for "{appliedSearch}". Try checking for typos or using complete words.</p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSchedules.map((record) => (
                  <TableRow key={record.id} className="hover:bg-gray-50">
                    <TableCell>{record.name}</TableCell>
                    <TableCell>{record.position}</TableCell>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>{record.startShift}</TableCell>
                    <TableCell>{record.endShift}</TableCell>
                    <TableCell>{record.breakMinutes}</TableCell>
                    <TableCell>{record.totalHours.toFixed(2)}</TableCell>
                    <TableCell>{record.otHours.toFixed(2)}</TableCell>
                    <TableCell>{record.nightDiffHours.toFixed(2)}</TableCell>
                    <TableCell>{record.restdayHours.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => openEditScheduleModal(record)}>
                        <Pencil className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <TablePaginationControls
            currentPage={schedulesPagination.currentPage}
            totalPages={schedulesPagination.totalPages}
            pageSize={schedulesPagination.pageSize}
            totalItems={schedulesPagination.totalItems}
            onPrevious={schedulesPagination.goToPreviousPage}
            onNext={schedulesPagination.goToNextPage}
            onPageChange={schedulesPagination.goToPage}
            onPageSizeChange={schedulesPagination.setPageSize}
          />
        </div>
      </div>

      <ActionFlowModal config={actionConfig} onClose={() => setActionConfig(null)} />
    </div>
  );
}








