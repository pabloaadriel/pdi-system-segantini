import React, { useState, useEffect } from "react";
import { useAuth } from "../components/AuthContext";
import { db, handleFirestoreError, serverTimestamp } from "../firebase";
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDocs, setDoc } from "firebase/firestore";
import { UserProfile, Task, PILARES, TaskStatus, UserRole } from "../types";
import { 
  Users, 
  TrendingUp, 
  AlertCircle, 
  ChevronRight, 
  Search,
  ArrowUpRight,
  Target,
  BarChart3,
  Plus,
  X,
  Trash2,
  Calendar as CalendarIcon,
  Filter,
  UserPlus
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from "recharts";
import { clsx } from "clsx";
import { Link } from "react-router-dom";
import { format, isBefore, startOfDay, parseISO } from "date-fns";

const Manager: React.FC = () => {
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<UserProfile[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [invitedUsers, setInvitedUsers] = useState<any[]>([]);
  const [newInvite, setNewInvite] = useState({ email: "", name: "", role: "COLABORADOR" as UserRole });
  const [newTask, setNewTask] = useState<Partial<Task>>({
    pillar: PILARES[0],
    status: "A fazer",
    deadline: format(new Date(), "yyyy-MM-dd")
  });

  useEffect(() => {
    const qUsers = query(collection(db, "users"), where("role", "==", "COLABORADOR"));
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data() as UserProfile);
      setCollaborators(usersData);
    });

    const qTasks = query(collection(db, "tasks"));
    const unsubscribeTasks = onSnapshot(qTasks, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setAllTasks(tasksData);
      setLoading(false);
    });

    const qInvites = query(collection(db, "invitedUsers"));
    const unsubscribeInvites = onSnapshot(qInvites, (snapshot) => {
      const invitesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvitedUsers(invitesData);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeTasks();
      unsubscribeInvites();
    };
  }, []);

  const calculateProgress = React.useCallback((userId: string) => {
    const userTasks = allTasks.filter(t => t.userId === userId);
    const today = startOfDay(new Date());
    const relevantTasks = userTasks.filter(t => isBefore(parseISO(t.deadline), today) || format(parseISO(t.deadline), "yyyy-MM-dd") === format(today, "yyyy-MM-dd"));
    if (relevantTasks.length === 0) return 0;
    const completed = relevantTasks.filter(t => t.status === "Concluído").length;
    return (completed / relevantTasks.length) * 100;
  }, [allTasks]);

  const filteredUsers = collaborators.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const teamAverageProgress = React.useMemo(() => {
    return collaborators.length > 0
      ? collaborators.reduce((acc, u) => acc + calculateProgress(u.uid), 0) / collaborators.length
      : 0;
  }, [collaborators, calculateProgress]);

  const criticalUsers = React.useMemo(() => {
    return collaborators.filter(u => calculateProgress(u.uid) < 70);
  }, [collaborators, calculateProgress]);

  const pillarStats = React.useMemo(() => {
    return PILARES.map(pillar => {
      const pillarTasks = allTasks.filter(t => t.pillar === pillar);
      const today = startOfDay(new Date());
      const relevantPillarTasks = pillarTasks.filter(t => isBefore(parseISO(t.deadline), today) || format(parseISO(t.deadline), "yyyy-MM-dd") === format(today, "yyyy-MM-dd"));
      const avg = relevantPillarTasks.length > 0 
        ? (relevantPillarTasks.filter(t => t.status === "Concluído").length / relevantPillarTasks.length) * 100 
        : 0;
      return { name: pillar, avg };
    });
  }, [allTasks]);

  const handleCreateTask = async () => {
    if (!newTask.userId || !newTask.title || !newTask.deadline) return;
    try {
      await addDoc(collection(db, "tasks"), {
        ...newTask,
        createdBy: user?.uid,
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setNewTask({ pillar: PILARES[0], status: "A fazer", deadline: format(new Date(), "yyyy-MM-dd") });
    } catch (error) {
      handleFirestoreError(error, "create", "tasks");
    }
  };

  const handleInviteUser = async () => {
    if (!newInvite.email || !newInvite.name) return;
    const email = newInvite.email.toLowerCase().trim();
    try {
      await setDoc(doc(db, "invitedUsers", email), {
        ...newInvite,
        email,
        status: "pendente",
        invitedAt: serverTimestamp()
      });
      setIsInviteModalOpen(false);
      setNewInvite({ email: "", name: "", role: "COLABORADOR" });
    } catch (error) {
      handleFirestoreError(error, "create", "invitedUsers");
    }
  };

  const handleDeleteInvite = async (email: string) => {
    if (!window.confirm("Tem certeza que deseja remover este convite?")) return;
    try {
      await deleteDoc(doc(db, "invitedUsers", email));
    } catch (error) {
      handleFirestoreError(error, "delete", "invitedUsers");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestão do Time</h1>
          <p className="text-slate-500 mt-1">Acompanhe o desenvolvimento e gargalos do seu time.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsInviteModalOpen(true)}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Convidar Usuário
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-orange-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-orange-600/20 hover:opacity-90 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nova Tarefa
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-slate-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Média do Time</h3>
          </div>
          <p className="text-4xl font-bold text-slate-900">{teamAverageProgress.toFixed(1)}%</p>
          <div className="mt-4 w-full bg-slate-100 rounded-full h-2">
            <div 
              className="bg-orange-600 h-2 rounded-full transition-all duration-500" 
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
            <BarChart3 className="w-5 h-5 text-orange-600" />
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
                  <Cell key={`cell-${index}`} fill={entry.avg < 70 ? '#f43f5e' : '#0284c7'} />
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
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredUsers.length > 0 ? (
            filteredUsers.map(u => {
              const progress = calculateProgress(u.uid);
              return (
                <div key={u.uid} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-orange-600 font-bold text-lg border border-slate-100">
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
                          progress < 70 ? "text-rose-600" : "text-orange-600"
                        )}>{progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={clsx(
                            "h-full rounded-full transition-all duration-500",
                            progress < 70 ? "bg-rose-500" : "bg-orange-600"
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    
                    <Link 
                      to={`/tasks/${u.uid}`}
                      className="p-2 rounded-xl bg-slate-100 text-slate-400 group-hover:bg-orange-600 group-hover:text-white transition-all"
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

      {/* Invited Users List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900">Convites Pendentes</h2>
          <p className="text-xs text-slate-500">Usuários que ainda não ativaram sua conta.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {invitedUsers.filter(i => i.status === "pendente").length > 0 ? (
            invitedUsers.filter(i => i.status === "pendente").map(invite => (
              <div key={invite.email} className="px-8 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 font-bold border border-amber-100">
                    {invite.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-tight">{invite.name}</h4>
                    <p className="text-[10px] text-slate-500">{invite.email} • {invite.role}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteInvite(invite.email)}
                  className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="py-8 text-center">
              <p className="text-slate-400 text-sm italic">Nenhum convite pendente.</p>
            </div>
          )}
        </div>
      </div>

      {/* New Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900">Convidar Usuário</h2>
              <button onClick={() => setIsInviteModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nome Completo</label>
                <input 
                  type="text" 
                  placeholder="Ex: João Silva"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all"
                  value={newInvite.name}
                  onChange={(e) => setNewInvite({ ...newInvite, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">E-mail</label>
                <input 
                  type="email" 
                  placeholder="joao@empresa.com"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all"
                  value={newInvite.email}
                  onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cargo / Função</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all"
                  value={newInvite.role}
                  onChange={(e) => setNewInvite({ ...newInvite, role: e.target.value as any })}
                >
                  <option value="COLABORADOR">Colaborador</option>
                  <option value="GESTOR">Gestor</option>
                </select>
              </div>
            </div>
            <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center gap-3">
              <button 
                onClick={handleInviteUser}
                className="flex-1 py-3 bg-orange-600 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all"
              >
                Enviar Convite
              </button>
              <button 
                onClick={() => setIsInviteModalOpen(false)}
                className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900">Nova Tarefa</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Colaborador</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all"
                  value={newTask.userId}
                  onChange={(e) => setNewTask({ ...newTask, userId: e.target.value })}
                >
                  <option value="">Selecionar Colaborador</option>
                  {collaborators.map(u => <option key={u.uid} value={u.uid}>{u.name} ({u.email})</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Título da Tarefa</label>
                <input 
                  type="text" 
                  placeholder="Ex: Curso de Liderança"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Descrição</label>
                <textarea 
                  placeholder="Descreva os detalhes da tarefa..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all min-h-[100px] resize-none"
                  value={newTask.description || ""}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pilar</label>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all"
                    value={newTask.pillar}
                    onChange={(e) => setNewTask({ ...newTask, pillar: e.target.value })}
                  >
                    {PILARES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Prazo</label>
                  <input 
                    type="date" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all"
                    value={newTask.deadline}
                    onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center gap-3">
              <button 
                onClick={handleCreateTask}
                className="flex-1 py-3 bg-orange-600 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all"
              >
                Criar Tarefa
              </button>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Manager;
