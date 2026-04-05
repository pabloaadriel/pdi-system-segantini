import React, { useState, useEffect } from "react";
import { useAuth } from "../components/AuthContext";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Task, PILARES, UserProfile } from "../types";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from "recharts";
import { 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  CheckCircle2, 
  LayoutDashboard,
  Calendar,
  Filter,
  ArrowUpRight
} from "lucide-react";
import { clsx } from "clsx";
import { format, isBefore, startOfDay, parseISO } from "date-fns";

const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [collaborators, setCollaborators] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCollaborator, setFilterCollaborator] = useState<string>("all");
  const [filterPillar, setFilterPillar] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const isManager = profile?.role === "GESTOR";

  useEffect(() => {
    if (!user || !profile) return;

    let q;
    if (isManager) {
      // Fetch all tasks for managers
      q = query(collection(db, "tasks"));
      
      // Also fetch collaborators for filters
      const usersQuery = query(collection(db, "users"), where("role", "==", "COLABORADOR"));
      const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
        setCollaborators(usersData);
      });
      
      const unsubscribeTasks = onSnapshot(q, (snapshot) => {
        const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        setTasks(tasksData);
        setLoading(false);
      });

      return () => {
        unsubscribeUsers();
        unsubscribeTasks();
      };
    } else {
      // Fetch only user's tasks for collaborators
      q = query(collection(db, "tasks"), where("userId", "==", user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        setTasks(tasksData);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user, profile, isManager]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
    </div>
  );

  const today = startOfDay(new Date());

  // Apply filters
  const filteredTasks = React.useMemo(() => {
    return tasks.filter(t => {
      const matchCollaborator = filterCollaborator === "all" || t.userId === filterCollaborator;
      const matchPillar = filterPillar === "all" || t.pillar === filterPillar;
      const matchStartDate = !startDate || t.deadline >= startDate;
      const matchEndDate = !endDate || t.deadline <= endDate;
      return matchCollaborator && matchPillar && matchStartDate && matchEndDate;
    });
  }, [tasks, filterCollaborator, filterPillar, startDate, endDate]);

  // Progress Calculation Logic
  const { relevantTasks, completedTasksCount, overallProgress } = React.useMemo(() => {
    const relevant = filteredTasks.filter(t => isBefore(parseISO(t.deadline), today) || format(parseISO(t.deadline), "yyyy-MM-dd") === format(today, "yyyy-MM-dd"));
    const completed = relevant.filter(t => t.status === "Concluído").length;
    const progress = relevant.length > 0 ? (completed / relevant.length) * 100 : 0;
    return { relevantTasks: relevant, completedTasksCount: completed, overallProgress: progress };
  }, [filteredTasks, today]);

  const pillarData = React.useMemo(() => {
    return PILARES.map(pillar => {
      const pillarTasks = filteredTasks.filter(t => t.pillar === pillar);
      const relevantPillarTasks = pillarTasks.filter(t => isBefore(parseISO(t.deadline), today) || format(parseISO(t.deadline), "yyyy-MM-dd") === format(today, "yyyy-MM-dd"));
      const completed = relevantPillarTasks.filter(t => t.status === "Concluído").length;
      const progress = relevantPillarTasks.length > 0 ? (completed / relevantPillarTasks.length) * 100 : 0;
      return { name: pillar, progress, total: pillarTasks.length, relevant: relevantPillarTasks.length, completed };
    });
  }, [filteredTasks, today]);

  const hasCriticalPillar = React.useMemo(() => pillarData.some(p => p.relevant > 0 && p.progress < 70), [pillarData]);
  const isBelowGoal = overallProgress < 80;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {isManager ? "Dashboard do Time" : "Meu Dashboard"}
          </h1>
          <p className="text-slate-500 mt-1">
            {isManager 
              ? "Acompanhe o progresso geral e individual dos líderes." 
              : "Acompanhe seu progresso e metas do PDI."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center gap-2">
            <Target className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-semibold text-slate-700">Meta Global: 80%</span>
          </div>
          <div className={clsx(
            "px-4 py-2 border rounded-xl shadow-sm flex items-center gap-2",
            overallProgress >= 80 ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-slate-50 border-slate-200 text-orange-600"
          )}>
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-bold">Progresso: {overallProgress.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Filters (Manager Only) */}
      {isManager && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-slate-500">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-bold uppercase tracking-wider">Filtros:</span>
          </div>
          
          <select 
            value={filterCollaborator}
            onChange={(e) => setFilterCollaborator(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all"
          >
            <option value="all">Todos os Colaboradores</option>
            {collaborators.map(c => (
              <option key={c.uid} value={c.uid}>{c.name || c.email}</option>
            ))}
          </select>

          <select 
            value={filterPillar}
            onChange={(e) => setFilterPillar(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all"
          >
            <option value="all">Todos os Pilares</option>
            {PILARES.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all"
            />
            <span className="text-slate-400">até</span>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all"
            />
          </div>

          {(filterCollaborator !== "all" || filterPillar !== "all" || startDate || endDate) && (
            <button 
              onClick={() => {
                setFilterCollaborator("all");
                setFilterPillar("all");
                setStartDate("");
                setEndDate("");
              }}
              className="text-xs font-bold text-orange-600 hover:underline"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      )}

      {/* Alertas Inteligentes */}
      {(hasCriticalPillar || isBelowGoal) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hasCriticalPillar && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="p-2 bg-rose-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-900">Alerta: Pilar Crítico</h3>
                <p className="text-sm text-rose-700 mt-1">
                  {isManager 
                    ? "Existem pilares com menos de 70% de conclusão no grupo filtrado." 
                    : "Você possui pilares com menos de 70% de conclusão. Foque nestas áreas."}
                </p>
              </div>
            </div>
          )}
          {isBelowGoal && (
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="p-2 bg-amber-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-900">Abaixo da Meta Global</h3>
                <p className="text-sm text-amber-700 mt-1">
                  O progresso geral está abaixo dos 80%. Revise o plano de ação.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              Progresso por Pilar
            </h2>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Meta Mínima: 70%</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pillarData} layout="vertical" margin={{ left: 20, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={150} 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="progress" radius={[0, 4, 4, 0]} barSize={24}>
                  {pillarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.progress < 70 ? '#f43f5e' : '#ea580c'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-orange-600 p-8 rounded-3xl shadow-xl shadow-orange-600/20 text-white flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10">
            <h2 className="text-xl font-bold mb-2">Visão Geral</h2>
            <p className="text-slate-200 text-sm">Resumo do desempenho {isManager ? "do time" : "atual"}.</p>
            
            <div className="mt-12 flex items-center justify-center">
              <div className="relative w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Concluído', value: completedTasksCount },
                        { name: 'Restante', value: Math.max(0, relevantTasks.length - completedTasksCount) }
                      ]}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="#ffffff" />
                      <Cell fill="rgba(255,255,255,0.2)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{overallProgress.toFixed(0)}%</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Total</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-8 grid grid-cols-2 gap-4">
            <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Tarefas Totais</p>
              <p className="text-xl font-bold">{filteredTasks.length}</p>
            </div>
            <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Relevantes</p>
              <p className="text-xl font-bold">{relevantTasks.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
