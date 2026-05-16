"use client";

import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- Nexus Admin Dashboard Component (Next.js 14) ---

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // In production: fetch("/api/admin/stats").then(res => res.json()).then(setStats);
    setStats({
      revenue: [
        { name: 'Jan', value: 4000 },
        { name: 'Feb', value: 7000 },
        { name: 'Mar', value: 12000 },
        { name: 'Apr', value: 18420 },
      ],
      totalUsers: 12540,
      activeSessions: 420
    });
  }, []);

  if (!stats) return <div className="text-white">Nexus Intelligence Booting...</div>;

  return (
    <div className="min-h-screen bg-[#050509] text-white p-8">
      <header className="flex justify-between items-center mb-12">
        <h1 className="text-3xl font-bold tracking-tighter">NEXUS COMMAND CENTER</h1>
        <div className="flex gap-4">
          <span className="bg-[#6366f122] text-[#6366f1] px-4 py-1 rounded-full text-xs font-bold border border-[#6366f144]">
            SYSTEM HEALTH: OPTIMAL
          </span>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <StatCard title="Total Users" value={stats.totalUsers} icon="👥" />
        <StatCard title="Revenue (MTD)" value={`$${stats.revenue[3].value}`} icon="💰" />
        <StatCard title="Active Nodes" value={stats.activeSessions} icon="⚡" />
      </div>

      {/* Revenue Chart */}
      <div className="bg-[#0A0A0F] p-8 rounded-3xl border border-white/5 mb-12">
        <h3 className="text-sm text-gray-400 mb-8 uppercase tracking-widest">Revenue Growth (USD)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" vertical={false} />
              <XAxis dataKey="name" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px' }}
                itemStyle={{ color: '#6366F1' }}
              />
              <Line type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={3} dot={{ fill: '#6366F1', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon }) => (
  <div className="bg-[#0A0A0F] p-8 rounded-3xl border border-white/5 hover:border-[#6366f144] transition-all group">
    <div className="flex justify-between items-center mb-4">
      <span className="text-gray-400 text-xs uppercase tracking-widest">{title}</span>
      <span className="text-2xl grayscale group-hover:grayscale-0 transition-all">{icon}</span>
    </div>
    <div className="text-4xl font-bold tracking-tight text-[#6366F1]">{value}</div>
  </div>
);

export default AdminDashboard;
