import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const defaultData = [
  { name: 'On-Time', value: 142, color: '#10b981' },
  { name: 'Late', value: 23, color: '#f59e0b' },
  { name: 'Absent', value: 8, color: '#ef4444' },
];

interface AttendanceSlice {
  name: string;
  value: number;
  color: string;
}

interface AttendanceChartProps {
  data?: AttendanceSlice[];
}

export function AttendanceChart({ data = defaultData }: AttendanceChartProps) {
  const hasData = data.some((item) => item.value > 0);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Distribution</h3>
      {!hasData ? (
        <div className="h-[250px] flex items-center justify-center text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg">
          No attendance data for selected range.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => (
                <span className="text-sm text-gray-700">
                  {value}: {entry.payload.value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
