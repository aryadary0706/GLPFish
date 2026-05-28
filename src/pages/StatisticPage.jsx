import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { BarChart3 } from 'lucide-react'

// Dummy data for the weekly fish grades
const weeklyData = [
  { week: 'Week 1', gradeA: 120, gradeB: 85, gradeC: 40 },
  { week: 'Week 2', gradeA: 150, gradeB: 95, gradeC: 30 },
  { week: 'Week 3', gradeA: 180, gradeB: 70, gradeC: 50 },
  { week: 'Week 4', gradeA: 140, gradeB: 110, gradeC: 45 },
]

export default function StatisticPage() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Statistik Inspeksi</h1>
        <p className="text-slate-500 mt-1">Laporan kualitas ikan berdasarkan grade per minggu.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <BarChart3 size={20} className="text-[#FB7D00]" /> 
            Distribusi Grade Ikan (Mingguan)
          </h3>
        </div>

        {/* Bar Chart Container */}
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={weeklyData}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis 
                dataKey="week" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748B', fontSize: 14 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748B' }}
              />
              <Tooltip 
                cursor={{ fill: '#F8FAFC' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="gradeA" name="Grade A" fill="#22C55E" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gradeB" name="Grade B" fill="#EAB308" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gradeC" name="Grade C" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}