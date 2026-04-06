import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where } from '../lib/mockFirebase';
import { UserProfile, PILARES } from '../types';
import { 
  Users, 
  TrendingUp, 
  AlertCircle, 
  ChevronRight, 
  Search,
  ArrowUpRight,
  Target,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';

const ManagerDashboard: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'COLABORADOR'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data() as UserProfile);
      setUsers(usersData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const calculateProgress = (tasks: any[]) => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'Concluído').length;
    return (completed / tasks.length) * 100;
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const teamAverageProgress = users.length > 0
    ? users.reduce((acc, u) => acc + calculateProgress(u.pdi?.tasks || []), 0) / users.length
    : 0;

  const criticalUsers = users.filter(u => calculateProgress(u.pdi?.tasks || []) < 70);

  const pillarStats = PILARES.map(pillar => {
    const pillarProgresses = users.map(u => {
      const pillarTasks = (u.pdi?.tasks || []).filter(t => t.pillar === pillar);
      return calculateProgress(pillarTasks);
    });
    const avg = pillarProgresses.length > 0 
      ? pillarProgresses.reduce((a, b) => a + b, 0) / pillarProgresses.length 
      : 0;
    return { name: pillar, avg };
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Painel do Gestor</h1>
          <p className="text-slate-500 mt-1">Acompanhe o desenvolvimento e gargalos do seu time.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-slate-700">{users.length} Colaboradores</span>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Média do Time</h3>
          </div>
          <p className="text-4xl font-bold text-slate-900">{teamAverageProgress.toFixed(1)}%</p>
          <div className="mt-4 w-full bg-slate-100 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${teamAverageProgress}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-rose-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-rose-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Abaixo da Meta</h3>
          </div>
          <p className="text-4xl font-bold text-slate-900">{criticalUsers.length}</p>
          <p className="text-xs text-slate-500 mt-2">Colaboradores com menos de 70% de progresso.</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Target className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Meta Global</h3>
          </div>
          <p className="text-4xl font-bold text-slate-900">80%</p>
          <p className="text-xs text-slate-500 mt-2">Objetivo de conclusão para o trimestre.</p>
        </div>
      </div>

      {/* Team Progress Chart */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Desempenho Médio por Pilar
          </h2>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pillarStats}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
              />
              <YAxis 
                domain={[0, 100]} 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="avg" radius={[4, 4, 0, 0]} barSize={40}>
                {pillarStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.avg < 70 ? '#f43f5e' : '#4f46e5'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* User List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900">Colaboradores</h2>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar colaborador..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredUsers.length > 0 ? (
            filteredUsers.map(u => {
              const progress = calculateProgress(u.pdi?.tasks || []);
              return (
                <div key={u.uid} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 leading-tight">{u.name}</h4>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-12">
                    <div className="hidden md:block w-48">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Progresso</span>
                        <span className={clsx(
                          "text-xs font-bold",
                          progress < 70 ? "text-rose-600" : "text-indigo-600"
                        )}>{progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={clsx(
                            "h-full rounded-full transition-all duration-500",
                            progress < 70 ? "bg-rose-500" : "bg-indigo-600"
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    
                    <Link 
                      to={`/user/${u.uid}`}
                      className="p-2 rounded-xl bg-slate-100 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center">
              <p className="text-slate-400 font-medium italic">Nenhum colaborador encontrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
