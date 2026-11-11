import { useState, useEffect } from 'react';
import { Package, Activity, DollarSign, Users, LineChart } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function Dashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="animate-pulse h-64 bg-slate-100 rounded-2xl w-full"></div>;
  }

  const statCards = [
    { title: 'Total Revenue', value: '$12,450', icon: DollarSign, trend: '+14%' },
    { title: 'Active Listings', value: '34', icon: Package, trend: '+2%' },
    { title: 'Total Users', value: users.length.toString(), icon: Users, trend: '+18%' },
    { title: 'Platform Activity', value: 'High', icon: Activity, trend: 'Stable' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">Platform overview and user management.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <Icon className="w-5 h-5 text-slate-700" />
                </div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  {stat.trend}
                </span>
              </div>
              <div>
                <h4 className="text-slate-500 font-medium text-sm mb-1">{stat.title}</h4>
                <span className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-semibold text-slate-900">Registered Users</h3>
            <button className="text-sm font-medium text-primary-600 hover:text-primary-700">View All</button>
          </div>
          <div className="p-0 flex-1 overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{user.name}</td>
                    <td className="px-6 py-4 text-slate-500">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'seller' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col p-6">
          <div className="flex items-center space-x-2 mb-6">
            <LineChart className="w-5 h-5 text-slate-400" />
            <h3 className="font-semibold text-slate-900">System Activity</h3>
          </div>
          
          <div className="space-y-6 flex-1">
            <div className="flex items-start space-x-4 pb-6 border-b border-slate-100 relative">
              <div className="w-2 h-2 rounded-full bg-primary-500 absolute left-[11px] top-2"></div>
              <div className="w-px h-full bg-slate-100 absolute left-3 top-4"></div>
              <div className="pl-6">
                <p className="text-sm font-medium text-slate-900">New bid placed</p>
                <p className="text-xs text-slate-500 mt-0.5">Buyer One placed $230 on Mechanical Keyboard</p>
                <p className="text-[10px] text-slate-400 mt-1">2 mins ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 pb-6 border-b border-slate-100 relative">
              <div className="w-2 h-2 rounded-full bg-emerald-500 absolute left-[11px] top-2"></div>
              <div className="w-px h-full bg-slate-100 absolute left-3 top-4"></div>
              <div className="pl-6">
                <p className="text-sm font-medium text-slate-900">User Registered</p>
                <p className="text-xs text-slate-500 mt-0.5">New seller account created</p>
                <p className="text-[10px] text-slate-400 mt-1">1 hour ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 relative">
              <div className="w-2 h-2 rounded-full bg-indigo-500 absolute left-[11px] top-2"></div>
              <div className="pl-6">
                <p className="text-sm font-medium text-slate-900">AI Analysis Generated</p>
                <p className="text-xs text-slate-500 mt-0.5">Insights run on Vintage Camera</p>
                <p className="text-[10px] text-slate-400 mt-1">3 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
