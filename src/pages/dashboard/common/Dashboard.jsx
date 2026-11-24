import { useMemo, useState } from 'react';
import { FiTrendingDown, FiTrendingUp } from 'react-icons/fi';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../../../context/useAuth';
import { useData } from '../../../context/useData';
import EmployeeDashboard from '../employee/EmployeeDashboard';

/* ---------- Date helpers ---------- */

const pad = n => String(n).padStart(2, '0');

const toDateString = date =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const toMonthString = date =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;

const now = new Date();
const TODAY = toDateString(now);
const THIS_MONTH = toMonthString(now);
const LAST_MONTH = toMonthString(
  new Date(now.getFullYear(), now.getMonth() - 1, 1),
);

/* ---------- Demo data generators ----------
   Replace these three functions with real data computed from your
   orders (filter by the selected date / month). */

const BOOK_NAMES = [
  'The Alchemist',
  'Atomic Habits',
  'Deep Work',
  'Psychology of Money',
  'Sapiens',
];

function seededNumber(seed, index, max) {
  let hash = 0;
  const text = `${seed}-${index}`;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) % 100000;
  }
  return (hash % max) + 1;
}

function getBestSellersByDate(date) {
  return BOOK_NAMES.map((name, i) => ({
    name,
    value: seededNumber(date, i, 60),
  })).sort((a, b) => b.value - a.value);
}

function getBestSellersByMonth(month) {
  return BOOK_NAMES.map((name, i) => ({
    name,
    value: seededNumber(month, i, 500),
  })).sort((a, b) => b.value - a.value);
}

function getProfitByMonth(month) {
  return ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((name, i) => ({
    name,
    value: seededNumber(month, i, 40000) + 20000,
  }));
}

const formatTaka = value => `৳${Number(value).toLocaleString('en-IN')}`;
const formatK = value =>
  value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value);

const monthLabel = month => {
  const [year, m] = month.split('-').map(Number);
  return new Date(year, m - 1, 1).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });
};

const previousMonth = month => {
  const [year, m] = month.split('-').map(Number);
  return toMonthString(new Date(year, m - 2, 1));
};

/* ---------- Chart colors ---------- */

const BRAND = '#465FFF';
const GRID = '#EEF0F4';
const AXIS = '#6B7280';

/* ---------- Dashboard ---------- */

function Dashboard() {
  const { currentUser } = useAuth();

  if (currentUser.role === 'employee') {
    return <EmployeeDashboard />;
  }

  return <DashboardContent />;
}

function DashboardContent() {
  const { books, orders } = useData();

  const [bestDate, setBestDate] = useState(TODAY);
  const [bestMonth, setBestMonth] = useState(THIS_MONTH);
  const [profitMonth, setProfitMonth] = useState(LAST_MONTH);

  const dailyBest = useMemo(() => getBestSellersByDate(bestDate), [bestDate]);
  const monthlyBest = useMemo(
    () => getBestSellersByMonth(bestMonth),
    [bestMonth],
  );
  const profitData = useMemo(
    () => getProfitByMonth(profitMonth),
    [profitMonth],
  );
  const profitTotal = profitData.reduce((sum, item) => sum + item.value, 0);
  const prevProfitTotal = useMemo(
    () =>
      getProfitByMonth(previousMonth(profitMonth)).reduce(
        (sum, item) => sum + item.value,
        0,
      ),
    [profitMonth],
  );
  const profitChange = prevProfitTotal
    ? ((profitTotal - prevProfitTotal) / prevProfitTotal) * 100
    : 0;

  const stats = [
    { title: 'Total Books', value: books?.length ?? 0 },
    { title: 'Total Users', value: 2845 },
    { title: 'Total Sales', value: orders?.length ?? 0 },
    { title: 'Total Revenue', value: formatTaka(1248000) },
    { title: "This Month's Expense", value: formatTaka(312000) },
    { title: 'Total Authors', value: 48 },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map(stat => (
          <div
            key={stat.title}
            className="rounded-lg border border-dark/10 bg-white p-3.5 sm:p-4"
          >
            <p className="truncate text-xs text-dark-muted">{stat.title}</p>
            <p className="mt-1 truncate font-heading text-lg font-bold text-dark sm:text-xl">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title={
            bestDate === TODAY
              ? "Today's Best Selling Books"
              : 'Best Selling Books'
          }
          subtitle="Copies sold"
          filter={
            <input
              type="date"
              value={bestDate}
              max={TODAY}
              onChange={e => e.target.value && setBestDate(e.target.value)}
              className={filterClass}
              aria-label="Select date"
            />
          }
        >
          <RankedBarChart data={dailyBest} />
        </ChartCard>

        <ChartCard
          title={
            bestMonth === THIS_MONTH
              ? "This Month's Best Selling Books"
              : 'Monthly Best Selling Books'
          }
          subtitle="Copies sold"
          filter={
            <input
              type="month"
              value={bestMonth}
              max={THIS_MONTH}
              onChange={e => e.target.value && setBestMonth(e.target.value)}
              className={filterClass}
              aria-label="Select month"
            />
          }
        >
          <RankedBarChart data={monthlyBest} />
        </ChartCard>
      </div>

      <ProfitCard
        month={profitMonth}
        data={profitData}
        total={profitTotal}
        change={profitChange}
        filter={
          <input
            type="month"
            value={profitMonth}
            max={THIS_MONTH}
            onChange={e => e.target.value && setProfitMonth(e.target.value)}
            className={filterClass}
            aria-label="Select month"
          />
        }
      />
    </div>
  );
}

const filterClass =
  'rounded-md border border-dark/10 bg-white px-2.5 py-1.5 text-xs text-dark outline-none focus:border-blue-500 sm:text-sm';

function ChartCard({ title, subtitle, filter, children }) {
  return (
    <section className="min-w-0 rounded-lg border border-dark/10 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-heading text-sm font-bold text-dark sm:text-base">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-dark-muted">{subtitle}</p>
          )}
        </div>
        {filter}
      </div>
      {children}
    </section>
  );
}

/* ---------- Profit card ---------- */

function ProfitCard({ month, data, total, change, filter }) {
  const isUp = change >= 0;
  const values = data.map(item => item.value);
  const best = data.reduce((a, b) => (b.value > a.value ? b : a));
  const lowest = data.reduce((a, b) => (b.value < a.value ? b : a));
  const average = Math.round(
    values.reduce((sum, v) => sum + v, 0) / values.length,
  );

  const summary = [
    { label: 'Best week', value: formatTaka(best.value), note: best.name },
    { label: 'Weekly average', value: formatTaka(average), note: 'per week' },
    {
      label: 'Lowest week',
      value: formatTaka(lowest.value),
      note: lowest.name,
    },
  ];

  return (
    <section className="min-w-0 rounded-lg border border-dark/10 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-dark-muted">
            Profit overview · {monthLabel(month)}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2.5">
            <p className="font-heading text-2xl font-bold text-dark sm:text-3xl">
              {formatTaka(total)}
            </p>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                isUp
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {isUp ? <FiTrendingUp /> : <FiTrendingDown />}
              {Math.abs(change).toFixed(1)}%
            </span>
          </div>
          <p className="mt-0.5 text-xs text-dark-muted">vs previous month</p>
        </div>
        {filter}
      </div>

      <div className="mt-4">
        <ProfitAreaChart data={data} />
      </div>

      <dl className="mt-3 grid grid-cols-3 divide-x divide-dark/10 border-t border-dark/10 pt-3">
        {summary.map(item => (
          <div key={item.label} className="px-2 first:pl-0 last:pr-0 sm:px-4">
            <dt className="truncate text-xs text-dark-muted">{item.label}</dt>
            <dd className="mt-0.5 truncate text-sm font-bold text-dark sm:text-base">
              {item.value}
            </dd>
            <p className="truncate text-xs text-dark-muted">{item.note}</p>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ---------- Charts ---------- */

function ChartTooltip({ active, payload, label, money }) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  return (
    <div className="rounded-md border border-dark/10 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-dark">{label}</p>
      <p className="mt-0.5 text-dark-muted">
        {money ? formatTaka(value) : `${value} copies`}
      </p>
    </div>
  );
}

/* Wraps long book names onto up to 2 lines under each bar */
function BookTick({ x, y, payload }) {
  const words = String(payload.value).split(' ');
  const lines = [];
  let current = '';
  words.forEach(word => {
    if ((current + ' ' + word).trim().length <= 11) {
      current = (current + ' ' + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  });
  if (current) lines.push(current);

  return (
    <text x={x} y={y + 12} textAnchor="middle" fill={AXIS} fontSize={11}>
      {lines.slice(0, 2).map((line, i) => (
        <tspan key={line} x={x} dy={i === 0 ? 0 : 13}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

/* Vertical bars with Y axis, grid, gradient fill, top seller highlighted */
function RankedBarChart({ data }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 18, right: 8, left: 0, bottom: 0 }}
          barCategoryGap="22%"
        >
          <defs>
            <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BRAND} stopOpacity={1} />
              <stop offset="100%" stopColor={BRAND} stopOpacity={0.55} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="name"
            axisLine={{ stroke: GRID }}
            tickLine={false}
            interval={0}
            height={40}
            tick={<BookTick />}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            width={32}
            allowDecimals={false}
            tick={{ fontSize: 12, fill: AXIS }}
          />
          <Tooltip
            cursor={{ fill: 'rgba(70,95,255,0.06)' }}
            content={<ChartTooltip />}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={44}>
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={index === 0 ? BRAND : 'url(#barFill)'}
                fillOpacity={index === 0 ? 1 : 0.8}
              />
            ))}
            <LabelList
              dataKey="value"
              position="top"
              style={{ fontSize: 12, fontWeight: 600, fill: '#111827' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* Smooth area chart with gradient fill and visible money axis */
function ProfitAreaChart({ data }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BRAND} stopOpacity={0.28} />
              <stop offset="100%" stopColor={BRAND} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: AXIS }}
            tickMargin={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            width={44}
            tick={{ fontSize: 12, fill: AXIS }}
            tickFormatter={value => `৳${formatK(value)}`}
          />
          <Tooltip
            cursor={{ stroke: BRAND, strokeDasharray: '4 4' }}
            content={<ChartTooltip money />}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={BRAND}
            strokeWidth={2.5}
            fill="url(#profitFill)"
            dot={{ r: 4, fill: '#fff', stroke: BRAND, strokeWidth: 2 }}
            activeDot={{ r: 6, fill: BRAND, stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default Dashboard;
