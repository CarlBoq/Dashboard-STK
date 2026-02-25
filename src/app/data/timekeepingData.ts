export interface TimekeepingLocationEntry {
  timestamp: string;
  lat?: number;
  lng?: number;
  address?: string;
}

export interface TimekeepingRecord {
  id: string;
  userId: string;
  employeeName: string;
  date: string;
  scheduledStart: string;
  scheduledEnd: string;
  breakMinutes: number;
  scheduledHours: string;
  actualTimeIn: string;
  timeInLocation: 'compliant' | 'outside' | 'no-data';
  timeInDistance?: number;
  timeInEntries?: TimekeepingLocationEntry[];
  breakIn: string;
  breakOut: string;
  actualTimeOut: string;
  timeOutLocation: 'compliant' | 'outside' | 'no-data';
  timeOutDistance?: number;
  timeOutEntries?: TimekeepingLocationEntry[];
  workedDuration: string;
  lateMinutes: number;
  status: 'on-time' | 'late' | 'absent' | 'incomplete';
}

export interface DashboardUser {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  role: string;
  verificationStatus: 'verified' | 'pending' | 'unverified';
  accountStatus: 'active' | 'suspended' | 'inactive';
  missingDocuments: number;
  lastTimeIn: string;
  activityStatus: 'active' | 'no-recent-activity';
  assignedSchedule: string;
  assignedStore: string;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  affectedEmployee: string;
  activity: string;
  category: 'time-record' | 'user-management' | 'adjustment' | 'system';
  status: 'success' | 'failed';
  details: string;
  storeKey: 'hq' | 'store1' | 'store2' | 'all';
}

interface UserTemplate {
  userId: string;
  employeeName: string;
  scheduledStartHour: number;
  scheduledStartMinute: number;
}

const FERN_LOCATION = {
  lat: 14.6048,
  lng: 120.9884,
  address: 'Unit 503, 5th Floor, FERN Building I, 827 P. Paredes Street, Sampaloc, Barangay 468',
};

const OUTSIDE_LOCATION = {
  lat: 14.5825,
  lng: 120.9798,
  address: 'Rizal Park, Ermita, Manila, 1000 Metro Manila',
};

const users: UserTemplate[] = [
  { userId: 'u1', employeeName: 'Sarah Johnson', scheduledStartHour: 9, scheduledStartMinute: 0 },
  { userId: 'u2', employeeName: 'Michael Chen', scheduledStartHour: 8, scheduledStartMinute: 0 },
  { userId: 'u3', employeeName: 'Emily Rodriguez', scheduledStartHour: 10, scheduledStartMinute: 0 },
  { userId: 'u4', employeeName: 'David Park', scheduledStartHour: 7, scheduledStartMinute: 0 },
  { userId: 'u5', employeeName: 'Jessica Williams', scheduledStartHour: 9, scheduledStartMinute: 0 },
  { userId: 'u6', employeeName: 'Robert Martinez', scheduledStartHour: 8, scheduledStartMinute: 30 },
  { userId: 'u7', employeeName: 'Amanda Thompson', scheduledStartHour: 9, scheduledStartMinute: 0 },
  { userId: 'u8', employeeName: 'Kevin Ramos', scheduledStartHour: 9, scheduledStartMinute: 0 },
  { userId: 'u9', employeeName: 'Christopher Lee', scheduledStartHour: 10, scheduledStartMinute: 0 },
  { userId: 'u10', employeeName: 'Olivia Reyes', scheduledStartHour: 8, scheduledStartMinute: 0 },
  { userId: 'u11', employeeName: 'Daniel Cruz', scheduledStartHour: 9, scheduledStartMinute: 30 },
  { userId: 'u12', employeeName: 'Angela Lim', scheduledStartHour: 7, scheduledStartMinute: 30 },
  { userId: 'u13', employeeName: 'Mark Santos', scheduledStartHour: 8, scheduledStartMinute: 0 },
  { userId: 'u14', employeeName: 'Patricia Gomez', scheduledStartHour: 9, scheduledStartMinute: 0 },
  { userId: 'u15', employeeName: 'Ryan Flores', scheduledStartHour: 10, scheduledStartMinute: 0 },
  { userId: 'u16', employeeName: 'Nicole Tan', scheduledStartHour: 8, scheduledStartMinute: 30 },
  { userId: 'u17', employeeName: 'Jerome Dela Cruz', scheduledStartHour: 9, scheduledStartMinute: 0 },
  { userId: 'u18', employeeName: 'Leah Navarro', scheduledStartHour: 7, scheduledStartMinute: 0 },
  { userId: 'u19', employeeName: 'Carlo Mendoza', scheduledStartHour: 8, scheduledStartMinute: 0 },
  { userId: 'u20', employeeName: 'Ivy Castillo', scheduledStartHour: 9, scheduledStartMinute: 0 },
  { userId: 'u21', employeeName: 'Paolo Reyes', scheduledStartHour: 10, scheduledStartMinute: 0 },
  { userId: 'u22', employeeName: 'Kristine Uy', scheduledStartHour: 8, scheduledStartMinute: 30 },
  { userId: 'u23', employeeName: 'Noel Aquino', scheduledStartHour: 9, scheduledStartMinute: 0 },
  { userId: 'u24', employeeName: 'Mika dela Pena', scheduledStartHour: 7, scheduledStartMinute: 30 },
];

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const to12Hour = (totalMinutes: number) => {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hour24 = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;
};

const toDurationLabel = (minutes: number) => {
  const safe = Math.max(minutes, 0);
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  return `${hours}h ${mins.toString().padStart(2, '0')}m`;
};

const parse12HourTimeTo24Hour = (timeLabel: string) => {
  const parsed = timeLabel.match(/^(\d{2}):(\d{2})\s(AM|PM)$/);
  if (!parsed) return null;
  const hour12 = Number(parsed[1]);
  const minute = Number(parsed[2]);
  const period = parsed[3];
  const hour24 = period === 'AM' ? (hour12 % 12) : (hour12 % 12) + 12;
  return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

const formatAsLogTimestamp = (dateLabel: string, timeLabel: string) => {
  const time24 = parse12HourTimeTo24Hour(timeLabel);
  if (!time24) return `${dateLabel} 00:00:00`;
  return `${dateLabel} ${time24}:00`;
};

const isWorkDay = (date: Date) => {
  const day = date.getDay();
  return day !== 0 && day !== 6;
};

const buildDateRange = (start: Date, end: Date) => {
  const dates: Date[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    if (isWorkDay(cursor)) {
      dates.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};

const buildRecord = (date: Date, dateIndex: number, user: UserTemplate, userIndex: number): TimekeepingRecord => {
  const dateKey = formatDate(date);
  const scheduledStart = user.scheduledStartHour * 60 + user.scheduledStartMinute;
  const scheduledEnd = scheduledStart + 8 * 60;
  const breakMinutes = userIndex % 2 === 0 ? 60 : 30;
  const scheduledHours = toDurationLabel(8 * 60 - breakMinutes);

  const absent = userIndex === 5 && dateIndex % 6 === 0;
  const incomplete = !absent && userIndex === 3 && dateIndex % 11 === 0;
  const lateMinutes = !absent ? ((dateIndex + userIndex * 3) % 5 === 0 ? 10 + ((dateIndex + userIndex) % 16) : 0) : 0;
  const timedInMinutes = scheduledStart + lateMinutes;
  const timedOutMinutes = incomplete ? -1 : scheduledEnd + ((dateIndex + userIndex) % 8 - 3);

  const breakInMinutes = scheduledStart + 3 * 60 + (userIndex % 3) * 5;
  const breakOutMinutes = breakInMinutes + breakMinutes;

  const workedMinutes =
    absent || incomplete ? 0 : Math.max(timedOutMinutes - timedInMinutes - breakMinutes, 0);

  const locationPattern = (dateIndex + userIndex) % 10;
  const hasLocationData = locationPattern !== 2 && locationPattern !== 7;
  const outsideLocation = locationPattern === 4 || locationPattern === 8;

  const timeInLocationEntry =
    !absent && hasLocationData
      ? {
          timestamp: `${dateKey}T${`${Math.floor(timedInMinutes / 60)}`.padStart(2, '0')}:${`${timedInMinutes % 60}`.padStart(2, '0')}:00`,
          ...(outsideLocation ? OUTSIDE_LOCATION : FERN_LOCATION),
        }
      : undefined;

  const timeOutLocationEntry =
    !absent && !incomplete && hasLocationData
      ? {
          timestamp: `${dateKey}T${`${Math.floor(timedOutMinutes / 60)}`.padStart(2, '0')}:${`${timedOutMinutes % 60}`.padStart(2, '0')}:00`,
          ...(outsideLocation ? OUTSIDE_LOCATION : FERN_LOCATION),
        }
      : undefined;

  const status: TimekeepingRecord['status'] = absent
    ? 'absent'
    : incomplete
      ? 'incomplete'
      : lateMinutes > 0
        ? 'late'
        : 'on-time';

  return {
    id: `${dateKey}-${user.userId}`,
    userId: user.userId,
    employeeName: user.employeeName,
    date: dateKey,
    scheduledStart: to12Hour(scheduledStart),
    scheduledEnd: to12Hour(scheduledEnd),
    breakMinutes,
    scheduledHours,
    actualTimeIn: absent ? '-' : to12Hour(timedInMinutes),
    timeInLocation: absent ? 'no-data' : hasLocationData ? (outsideLocation ? 'outside' : 'compliant') : 'no-data',
    timeInDistance: hasLocationData ? (outsideLocation ? 1250 : 32 + ((dateIndex + userIndex) % 40)) : undefined,
    timeInEntries: timeInLocationEntry ? [timeInLocationEntry] : [],
    breakIn: absent || incomplete ? '-' : to12Hour(breakInMinutes),
    breakOut: absent || incomplete ? '-' : to12Hour(breakOutMinutes),
    actualTimeOut: absent || incomplete ? '-' : to12Hour(timedOutMinutes),
    timeOutLocation: absent || incomplete ? 'no-data' : hasLocationData ? (outsideLocation ? 'outside' : 'compliant') : 'no-data',
    timeOutDistance: hasLocationData && !incomplete ? (outsideLocation ? 1330 : 40 + ((dateIndex + userIndex) % 45)) : undefined,
    timeOutEntries: timeOutLocationEntry ? [timeOutLocationEntry] : [],
    workedDuration: absent || incomplete ? '-' : toDurationLabel(workedMinutes),
    lateMinutes,
    status,
  };
};

const today = new Date();
const startDate = new Date(today.getFullYear() - 1, today.getMonth(), 1);
const workDates = buildDateRange(startDate, today);

export const timekeepingRecords: TimekeepingRecord[] = workDates.flatMap((date, dateIndex) =>
  users.map((user, userIndex) => buildRecord(date, dateIndex, user, userIndex))
);

const stores = ['Headquarters', 'Store 1 - Downtown', 'Store 2 - Uptown'] as const;
const roles = ['Employee', 'Employee', 'Employee', 'Team Leader', 'Manager'] as const;

const latestRecordPerUser = timekeepingRecords.reduce<Record<string, TimekeepingRecord>>((acc, record) => {
  const current = acc[record.userId];
  if (!current || record.date > current.date) {
    acc[record.userId] = record;
  }
  return acc;
}, {});

export const dashboardUsers: DashboardUser[] = users.map((user, userIndex) => {
  const latestRecord = latestRecordPerUser[user.userId];
  const company = userIndex % 2 === 0 ? 'TechCorp' : 'RetailCo';
  const assignedStore = stores[userIndex % stores.length];
  const role = roles[userIndex % roles.length];
  const verificationStatus: DashboardUser['verificationStatus'] =
    userIndex % 7 === 0 ? 'pending' : userIndex % 11 === 0 ? 'unverified' : 'verified';
  const accountStatus: DashboardUser['accountStatus'] =
    userIndex % 10 === 0 ? 'suspended' : userIndex % 13 === 0 ? 'inactive' : 'active';
  const missingDocuments = userIndex % 5 === 0 ? 2 : userIndex % 3 === 0 ? 1 : 0;
  const hasRecentActivity = latestRecord && latestRecord.actualTimeIn !== '-';

  return {
    id: user.userId,
    name: user.employeeName,
    email: `${user.employeeName.toLowerCase().replace(/\s+/g, '.')}@${company.toLowerCase()}.com`,
    company,
    phone: `+63 9${(111111111 + userIndex * 13457).toString().slice(0, 9)}`,
    role,
    verificationStatus,
    accountStatus,
    missingDocuments,
    lastTimeIn:
      hasRecentActivity && latestRecord
        ? `${latestRecord.date} ${latestRecord.actualTimeIn}`
        : `${today.getFullYear()}-${`${today.getMonth() + 1}`.padStart(2, '0')}-${`${today.getDate()}`.padStart(2, '0')} -`,
    activityStatus: hasRecentActivity ? 'active' : 'no-recent-activity',
    assignedSchedule: `${latestRecord?.scheduledStart ?? '09:00 AM'} - ${latestRecord?.scheduledEnd ?? '05:00 PM'}`,
    assignedStore,
  };
});

export const activityLogs: ActivityLogEntry[] = timekeepingRecords
  .flatMap((record, index) => {
    const baseStoreKey = index % 3 === 0 ? 'hq' : index % 3 === 1 ? 'store1' : 'store2';
    const role = roles[index % roles.length];
    const userLogs: ActivityLogEntry[] = [];

    if (record.actualTimeIn === '-') {
      userLogs.push({
        id: `${record.id}-absent`,
        timestamp: `${record.date} 09:00:00`,
        user: record.employeeName,
        role,
        affectedEmployee: record.employeeName,
        activity: 'Missed clock-in',
        category: 'time-record',
        status: 'failed',
        details: `No time-in recorded. Scheduled shift ${record.scheduledStart}-${record.scheduledEnd}`,
        storeKey: baseStoreKey,
      });
      return userLogs;
    }

    userLogs.push({
      id: `${record.id}-time-in`,
      timestamp: formatAsLogTimestamp(record.date, record.actualTimeIn),
      user: record.employeeName,
      role,
      affectedEmployee: record.employeeName,
      activity: record.lateMinutes > 0 ? 'Late clock-in' : 'Clocked in',
      category: 'time-record',
      status: 'success',
      details:
        record.lateMinutes > 0
          ? `Clocked in ${record.lateMinutes} minutes late`
          : 'Clocked in on time',
      storeKey: baseStoreKey,
    });

    if (record.timeInLocation === 'outside') {
      userLogs.push({
        id: `${record.id}-in-location`,
        timestamp: formatAsLogTimestamp(record.date, record.actualTimeIn),
        user: record.employeeName,
        role,
        affectedEmployee: record.employeeName,
        activity: 'Location violation',
        category: 'time-record',
        status: 'success',
        details: `Time-in location outside allowed radius (${Math.round(record.timeInDistance ?? 0)}m)`,
        storeKey: baseStoreKey,
      });
    }

    if (record.actualTimeOut !== '-') {
      userLogs.push({
        id: `${record.id}-time-out`,
        timestamp: formatAsLogTimestamp(record.date, record.actualTimeOut),
        user: record.employeeName,
        role,
        affectedEmployee: record.employeeName,
        activity: 'Clocked out',
        category: 'time-record',
        status: 'success',
        details: `Total worked ${record.workedDuration}`,
        storeKey: baseStoreKey,
      });
    }

    if (record.status === 'incomplete') {
      userLogs.push({
        id: `${record.id}-incomplete`,
        timestamp: `${record.date} 18:00:00`,
        user: 'System',
        role: 'System',
        affectedEmployee: record.employeeName,
        activity: 'Incomplete record',
        category: 'system',
        status: 'failed',
        details: 'Missing time-out entry for scheduled shift',
        storeKey: baseStoreKey,
      });
    }

    if (index % 17 === 0) {
      userLogs.push({
        id: `${record.id}-adjustment`,
        timestamp: `${record.date} 12:15:00`,
        user: 'Admin User',
        role: 'Administrator',
        affectedEmployee: record.employeeName,
        activity: 'Time adjustment',
        category: 'adjustment',
        status: 'success',
        details: 'Adjusted record to align with approved schedule change',
        storeKey: baseStoreKey,
      });
    }

    return userLogs;
  })
  .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
