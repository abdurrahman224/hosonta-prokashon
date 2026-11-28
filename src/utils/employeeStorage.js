const PROFILES_KEY = 'hosonta_employee_profiles_v1'
const ATTENDANCE_KEY = 'hosonta_employee_attendance_v1'
const ACTIVITIES_KEY = 'hosonta_employee_activities_v1'

export function getTodayDateStr() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getDateDaysAgo(daysAgo) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function buildIsoForDateAndTime(dateStr, hhmm24) {
  return new Date(`${dateStr}T${hhmm24}:00`).toISOString()
}

export function formatTime12h(isoOrDate) {
  if (!isoOrDate) return '—'
  try {
    const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate)
    if (Number.isNaN(d.getTime())) return String(isoOrDate)
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return '—'
  }
}

export function formatDateTimeReadable(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return String(iso)
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return String(iso)
  }
}

export function calculateShiftDuration(inAt, outAt) {
  if (!inAt) return '—'
  const start = new Date(inAt).getTime()
  const end = outAt ? new Date(outAt).getTime() : Date.now()
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return '—'
  const totalMinutes = Math.floor((end - start) / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  return outAt ? `${hours}h ${mins}m` : `${hours}h ${mins}m (Live)`
}

export function calculateTenure(joinedDate) {
  if (!joinedDate) return 'New Joiner'
  const start = new Date(joinedDate)
  if (Number.isNaN(start.getTime())) return '—'
  const now = new Date()
  let months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth())
  if (now.getDate() < start.getDate()) months -= 1
  if (months < 0) return 'Upcoming'
  if (months === 0) {
    const days = Math.max(1, Math.floor((now - start) / 86400000))
    return `${days} ${days === 1 ? 'day' : 'days'}`
  }
  const years = Math.floor(months / 12)
  const remMonths = months % 12
  if (years === 0) return `${remMonths} ${remMonths === 1 ? 'mo' : 'mos'}`
  if (remMonths === 0) return `${years} ${years === 1 ? 'yr' : 'yrs'}`
  return `${years}y ${remMonths}m`
}

export function toEmployeeRouteParam(name = '') {
  return encodeURIComponent(String(name).trim().replace(/\s+/g, '-'))
}

function getInitialProfiles() {
  const yesterday = getDateDaysAgo(1)
  return {
    'user-employee-1': {
      employeeId: 'user-employee-1',
      designation: 'Sales & Counter Executive',
      department: 'Showroom & Online Orders',
      phone: '01712-345678',
      joinedDate: '2024-02-10',
      monthlySalary: 25000,
      shiftStart: '09:00',
      shiftEnd: '18:00',
      emergencyContact: '01811-223344',
      address: 'Banglabazar, Dhaka-1100',
      lastWebsiteVisit: buildIsoForDateAndTime(yesterday, '09:04'),
    },
    'user-employee-2': {
      employeeId: 'user-employee-2',
      designation: 'Inventory & Dispatch Officer',
      department: 'Warehouse & Logistics',
      phone: '01819-654321',
      joinedDate: '2024-07-15',
      monthlySalary: 22000,
      shiftStart: '09:30',
      shiftEnd: '18:30',
      emergencyContact: '01911-887766',
      address: 'Sutrapur, Dhaka-1100',
      lastWebsiteVisit: buildIsoForDateAndTime(getDateDaysAgo(3), '09:42'),
    },
  }
}

function getInitialAttendance() {
  const d1 = getDateDaysAgo(1)
  const d2 = getDateDaysAgo(2)
  const d3 = getDateDaysAgo(3)
  const d4 = getDateDaysAgo(4)
  const d5 = getDateDaysAgo(5)

  return [
    {
      id: 'att-emp1-1',
      employeeId: 'user-employee-1',
      date: d1,
      websiteVisitAt: buildIsoForDateAndTime(d1, '09:04'),
      inAt: buildIsoForDateAndTime(d1, '09:06'),
      outAt: buildIsoForDateAndTime(d1, '18:12'),
      status: 'Checked Out',
      note: 'Completed counter settlement and online courier handover.',
    },
    {
      id: 'att-emp1-2',
      employeeId: 'user-employee-1',
      date: d2,
      websiteVisitAt: buildIsoForDateAndTime(d2, '08:57'),
      inAt: buildIsoForDateAndTime(d2, '09:00'),
      outAt: buildIsoForDateAndTime(d2, '18:05'),
      status: 'Checked Out',
      note: 'Handled Banglabazar shop restock orders.',
    },
    {
      id: 'att-emp1-3',
      employeeId: 'user-employee-1',
      date: d3,
      websiteVisitAt: buildIsoForDateAndTime(d3, '09:11'),
      inAt: buildIsoForDateAndTime(d3, '09:14'),
      outAt: buildIsoForDateAndTime(d3, '18:20'),
      status: 'Checked Out',
      note: 'Replied to pending customer inquiries.',
    },
    {
      id: 'att-emp1-4',
      employeeId: 'user-employee-1',
      date: d4,
      websiteVisitAt: buildIsoForDateAndTime(d4, '09:02'),
      inAt: buildIsoForDateAndTime(d4, '09:05'),
      outAt: buildIsoForDateAndTime(d4, '17:58'),
      status: 'Checked Out',
      note: 'Online order packaging and dispatch verification.',
    },
    {
      id: 'att-emp1-5',
      employeeId: 'user-employee-1',
      date: d5,
      websiteVisitAt: buildIsoForDateAndTime(d5, '09:00'),
      inAt: buildIsoForDateAndTime(d5, '09:03'),
      outAt: buildIsoForDateAndTime(d5, '18:15'),
      status: 'Checked Out',
      note: 'Weekly counter invoice reconciliation.',
    },
    {
      id: 'att-emp2-3',
      employeeId: 'user-employee-2',
      date: d3,
      websiteVisitAt: buildIsoForDateAndTime(d3, '09:42'),
      inAt: buildIsoForDateAndTime(d3, '09:45'),
      outAt: buildIsoForDateAndTime(d3, '18:10'),
      status: 'Checked Out',
      note: 'Audited warehouse low-stock shelves.',
    },
    {
      id: 'att-emp2-4',
      employeeId: 'user-employee-2',
      date: d4,
      websiteVisitAt: buildIsoForDateAndTime(d4, '09:33'),
      inAt: buildIsoForDateAndTime(d4, '09:38'),
      outAt: buildIsoForDateAndTime(d4, '18:25'),
      status: 'Checked Out',
      note: 'Received new print batch into stock.',
    },
  ]
}

function getInitialActivities() {
  const d1 = getDateDaysAgo(1)
  const d2 = getDateDaysAgo(2)
  const d3 = getDateDaysAgo(3)

  return [
    {
      id: 'act-1',
      employeeId: 'user-employee-1',
      type: 'attendance',
      title: 'Checked Out from Daily Shift',
      description: 'Shift completed at 06:12 PM (9h 6m).',
      timestamp: buildIsoForDateAndTime(d1, '18:12'),
    },
    {
      id: 'act-2',
      employeeId: 'user-employee-1',
      type: 'order',
      title: 'Processed Counter & Online Orders',
      description: 'Confirmed 4 online orders and generated showroom cash memos.',
      timestamp: buildIsoForDateAndTime(d1, '15:30'),
    },
    {
      id: 'act-3',
      employeeId: 'user-employee-1',
      type: 'stock',
      title: 'Updated Book Stock Levels',
      description: 'Restocked fast-moving Islamic & novel titles in inventory.',
      timestamp: buildIsoForDateAndTime(d1, '11:45'),
    },
    {
      id: 'act-4',
      employeeId: 'user-employee-1',
      type: 'website',
      title: 'Visited Employee Portal',
      description: 'Signed in to the Hosonta Prokashon dashboard.',
      timestamp: buildIsoForDateAndTime(d1, '09:04'),
    },
    {
      id: 'act-5',
      employeeId: 'user-employee-1',
      type: 'order',
      title: 'Shop Invoice Follow-up',
      description: 'Recorded partial payment collection for Banglabazar partner shop.',
      timestamp: buildIsoForDateAndTime(d2, '16:10'),
    },
    {
      id: 'act-6',
      employeeId: 'user-employee-2',
      type: 'stock',
      title: 'Inventory Audit Logged',
      description: 'Verified physical copy count for 28 published titles.',
      timestamp: buildIsoForDateAndTime(d3, '14:20'),
    },
    {
      id: 'act-7',
      employeeId: 'user-employee-2',
      type: 'website',
      title: 'Visited Employee Portal',
      description: 'Logged in to review warehouse stock alerts.',
      timestamp: buildIsoForDateAndTime(d3, '09:42'),
    },
  ]
}

function readJson(key, fallbackFactory) {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch {
    // Fallback to initial seed
  }
  const initial = fallbackFactory()
  try {
    localStorage.setItem(key, JSON.stringify(initial))
  } catch {
    // Ignore storage quota issues
  }
  return initial
}

function writeJson(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // Ignore storage quota issues
  }
}

export function getAllEmployeeProfiles() {
  return readJson(PROFILES_KEY, getInitialProfiles)
}

export function getEmployeeProfile(employeeId) {
  const all = getAllEmployeeProfiles()
  return (
    all[employeeId] || {
      employeeId,
      designation: 'Operations Staff',
      department: 'General Operations',
      phone: '',
      joinedDate: getTodayDateStr(),
      monthlySalary: 18000,
      shiftStart: '09:00',
      shiftEnd: '18:00',
      emergencyContact: '',
      address: 'Dhaka, Bangladesh',
      lastWebsiteVisit: null,
    }
  )
}

export function upsertEmployeeProfile(employeeId, updates) {
  const all = getAllEmployeeProfiles()
  const current = getEmployeeProfile(employeeId)
  const next = {
    ...all,
    [employeeId]: {
      ...current,
      ...updates,
      employeeId,
      monthlySalary: Number(updates.monthlySalary ?? current.monthlySalary ?? 0),
    },
  }
  writeJson(PROFILES_KEY, next)
  return next[employeeId]
}

export function getAllEmployeeAttendance() {
  const list = readJson(ATTENDANCE_KEY, getInitialAttendance)
  return [...list].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date)
    return new Date(b.inAt || b.websiteVisitAt || 0) - new Date(a.inAt || a.websiteVisitAt || 0)
  })
}

export function getEmployeeAttendance(employeeId) {
  return getAllEmployeeAttendance().filter((item) => item.employeeId === employeeId)
}

export function getTodayAttendanceForEmployee(employeeId) {
  const today = getTodayDateStr()
  return (
    getAllEmployeeAttendance().find(
      (item) => item.employeeId === employeeId && item.date === today,
    ) || null
  )
}

export function getAllEmployeeActivities() {
  const list = readJson(ACTIVITIES_KEY, getInitialActivities)
  return [...list].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}

export function getEmployeeActivities(employeeId) {
  return getAllEmployeeActivities().filter((item) => item.employeeId === employeeId)
}

export function logEmployeeActivity(employeeId, { type = 'website', title, description = '' }) {
  if (!employeeId || !title) return null
  const all = readJson(ACTIVITIES_KEY, getInitialActivities)
  const entry = {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    employeeId,
    type,
    title,
    description,
    timestamp: new Date().toISOString(),
  }
  const updated = [entry, ...all]
  writeJson(ACTIVITIES_KEY, updated)
  return entry
}

export function recordEmployeeWebsiteVisit(employeeId, source = 'Website Portal') {
  if (!employeeId) return
  const nowIso = new Date().toISOString()
  const today = getTodayDateStr()
  const profile = getEmployeeProfile(employeeId)
  const prevVisitDate = profile.lastWebsiteVisit
    ? profile.lastWebsiteVisit.slice(0, 10)
    : null

  upsertEmployeeProfile(employeeId, { lastWebsiteVisit: nowIso })

  // Ensure today's attendance row stores the website arrival timestamp
  const attendance = readJson(ATTENDANCE_KEY, getInitialAttendance)
  const idx = attendance.findIndex(
    (item) => item.employeeId === employeeId && item.date === today,
  )
  if (idx >= 0 && !attendance[idx].websiteVisitAt) {
    attendance[idx] = { ...attendance[idx], websiteVisitAt: nowIso }
    writeJson(ATTENDANCE_KEY, attendance)
  }

  if (prevVisitDate !== today) {
    logEmployeeActivity(employeeId, {
      type: 'website',
      title: 'Arrived on Website',
      description: `Accessed ${source} at ${formatTime12h(nowIso)}.`,
    })
  }
}

export function checkInEmployee(employeeId, note = '') {
  if (!employeeId) return null
  const nowIso = new Date().toISOString()
  const today = getTodayDateStr()
  const attendance = readJson(ATTENDANCE_KEY, getInitialAttendance)
  const existingIdx = attendance.findIndex(
    (item) => item.employeeId === employeeId && item.date === today,
  )

  let record
  if (existingIdx >= 0) {
    record = {
      ...attendance[existingIdx],
      websiteVisitAt: attendance[existingIdx].websiteVisitAt || nowIso,
      inAt: attendance[existingIdx].inAt || nowIso,
      status: attendance[existingIdx].outAt ? 'Checked Out' : 'On Duty',
      note: note.trim() || attendance[existingIdx].note || '',
    }
    attendance[existingIdx] = record
  } else {
    record = {
      id: `att-${employeeId}-${today}`,
      employeeId,
      date: today,
      websiteVisitAt: nowIso,
      inAt: nowIso,
      outAt: null,
      status: 'On Duty',
      note: note.trim(),
    }
    attendance.unshift(record)
  }

  writeJson(ATTENDANCE_KEY, attendance)
  upsertEmployeeProfile(employeeId, { lastWebsiteVisit: nowIso })
  logEmployeeActivity(employeeId, {
    type: 'attendance',
    title: 'Checked In (In Time)',
    description: `Started daily shift at ${formatTime12h(nowIso)}${note.trim() ? ` — ${note.trim()}` : '.'}`,
  })
  return record
}

export function checkOutEmployee(employeeId, note = '') {
  if (!employeeId) return null
  const nowIso = new Date().toISOString()
  const today = getTodayDateStr()
  const attendance = readJson(ATTENDANCE_KEY, getInitialAttendance)
  const existingIdx = attendance.findIndex(
    (item) => item.employeeId === employeeId && item.date === today,
  )

  let record
  if (existingIdx >= 0) {
    const existing = attendance[existingIdx]
    record = {
      ...existing,
      inAt: existing.inAt || nowIso,
      outAt: nowIso,
      status: 'Checked Out',
      note: note.trim() || existing.note || '',
    }
    attendance[existingIdx] = record
  } else {
    record = {
      id: `att-${employeeId}-${today}`,
      employeeId,
      date: today,
      websiteVisitAt: nowIso,
      inAt: nowIso,
      outAt: nowIso,
      status: 'Checked Out',
      note: note.trim(),
    }
    attendance.unshift(record)
  }

  writeJson(ATTENDANCE_KEY, attendance)
  upsertEmployeeProfile(employeeId, { lastWebsiteVisit: nowIso })
  logEmployeeActivity(employeeId, {
    type: 'attendance',
    title: 'Checked Out (Out Time)',
    description: `Ended shift at ${formatTime12h(nowIso)} (${calculateShiftDuration(record.inAt, record.outAt)})${note.trim() ? ` — ${note.trim()}` : '.'}`,
  })
  return record
}

export function saveManualAttendanceRecord(employeeId, { date, inTime, outTime, note }) {
  if (!employeeId || !date) return null
  const attendance = readJson(ATTENDANCE_KEY, getInitialAttendance)
  const inAt = inTime ? buildIsoForDateAndTime(date, inTime) : null
  const outAt = outTime ? buildIsoForDateAndTime(date, outTime) : null
  const status = outAt ? 'Checked Out' : inAt ? 'On Duty' : 'Absent'
  const existingIdx = attendance.findIndex(
    (item) => item.employeeId === employeeId && item.date === date,
  )

  const record = {
    id: existingIdx >= 0 ? attendance[existingIdx].id : `att-${employeeId}-${date}`,
    employeeId,
    date,
    websiteVisitAt:
      existingIdx >= 0
        ? attendance[existingIdx].websiteVisitAt || inAt
        : inAt,
    inAt,
    outAt,
    status,
    note: note ?? '',
  }

  if (existingIdx >= 0) {
    attendance[existingIdx] = record
  } else {
    attendance.unshift(record)
  }

  writeJson(ATTENDANCE_KEY, attendance)
  logEmployeeActivity(employeeId, {
    type: 'attendance',
    title: 'Attendance Record Updated by Admin',
    description: `Updated ${date} entry (${inAt ? formatTime12h(inAt) : '—'} to ${outAt ? formatTime12h(outAt) : '—'}).`,
  })
  return record
}
