import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const defaultData = [
  { date: 'Feb 5', count: 12 },
  { date: 'Feb 6', count: 15 },
  { date: 'Feb 7', count: 8 },
  { date: 'Feb 8', count: 19 },
  { date: 'Feb 9', count: 14 },
  { date: 'Feb 10', count: 21 },
  { date: 'Feb 11', count: 18 },
  { date: 'Feb 12', count: 23 },
];

interface LateTrendPoint {
  date: string;
  count: number;
}

interface LateEmployeesTrendChartProps {
  data?: LateTrendPoint[];
  titleSuffix?: string;
}

export function LateEmployeesTrendChart({ data = defaultData, titleSuffix = 'Last 7 Days' }: LateEmployeesTrendChartProps) {
  const hasData = data.length > 0;
  const chartWidth = Math.max(520, data.length * 64);
  const barSize = data.length <= 7 ? 36 : data.length <= 14 ? 26 : 20;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Late Employees Trend ({titleSuffix})</h3>
      {!hasData ? (
        <div className="h-[250px] flex items-center justify-center text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg">
          No late trend data for selected range.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <BarChart data={data} width={chartWidth} height={250}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              interval={0}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Bar dataKey="count" fill="#f59e0b" radius={[8, 8, 0, 0]} barSize={barSize} />
          </BarChart>
        </div>
      )}
    </div>
  );
}
