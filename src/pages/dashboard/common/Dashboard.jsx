import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
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

  const stats = [
    { title: 'Total Books', value: books?.length ?? 0 },
    { title: 'Total Users', value: 2845 },
    { title: 'Total Sales', value: orders?.length ?? 0 },
    { title: 'Total Revenue', value: formatTaka(1248000) },
    { title: "This Month's Expense", value: formatTaka(312000) },
    { title: 'Total Authors', value: 48 },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map(stat => (
          <div
            key={stat.title}
            className="rounded-2xl border border-dark/10 bg-white p-4 sm:p-5"
          >
            <p className="truncate text-xs text-dark-muted sm:text-sm">
              {stat.title}
            </p>
            <p className="mt-1 truncate font-heading text-xl font-bold text-dark sm:text-2xl">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <ChartCard
          title={
            bestDate === TODAY
              ? "Today's Best Selling Books"
              : 'Best Selling Books'
          }
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
          <SimpleBarChart data={dailyBest} />
        </ChartCard>

        <ChartCard
          title={
            bestMonth === THIS_MONTH
              ? "This Month's Best Selling Books"
              : 'Monthly Best Selling Books'
          }
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
          <SimpleBarChart data={monthlyBest} />
        </ChartCard>
      </div>

      <ChartCard
        title={
          profitMonth === LAST_MONTH
            ? `Last Month's Total Profit: ${formatTaka(profitTotal)}`
            : `Total Profit: ${formatTaka(profitTotal)}`
        }
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
      >
        <SimpleBarChart data={profitData} money />
      </ChartCard>
    </div>
  );
}

const filterClass =
  'rounded-lg border border-dark/10 bg-white px-3 py-1.5 text-sm text-dark outline-none focus:border-blue-500';

function ChartCard({ title, filter, children }) {
  return (
    <section className="min-w-0 rounded-2xl border border-dark/10 bg-white p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-base font-bold text-dark sm:text-lg">
          {title}
        </h2>
        {filter}
      </div>
      {children}
    </section>
  );
}

function SimpleBarChart({ data, money = false }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 8, left: 8, bottom: 0 }}
        >
          <CartesianGrid stroke="#eee" vertical={false} />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            interval={0}
            tick={{ fontSize: 12 }}
          />
          <YAxis hide />
          <Tooltip formatter={value => (money ? formatTaka(value) : value)} />
          <Bar
            dataKey="value"
            fill="#465FFF"
            radius={[6, 6, 0, 0]}
            maxBarSize={40}
          >
            <LabelList
              dataKey="value"
              position="top"
              formatter={value =>
                money ? `${(value / 1000).toFixed(1)}k` : value
              }
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default Dashboard;
