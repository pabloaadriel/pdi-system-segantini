import React, { useState, useEffect } from "react";
import { useAuth } from "../components/AuthContext";
import { db, handleFirestoreError } from "../firebase";
import { collection, query, where, onSnapshot, updateDoc, doc, addDoc, deleteDoc, serverTimestamp, getDoc } from "../lib/mockFirebase";
import { Task, PILARES, TaskStatus, UserProfile } from "../types";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  MessageSquare, 
  Paperclip, 
  Calendar as CalendarIcon,
  ChevronRight,
  Plus,
  Save,
  ExternalLink,
  Trash2,
  X
} from "lucide-react";
import { clsx } from "clsx";
import { format, parseISO } from "date-fns";
import { useParams } from "react-router-dom";

const Tasks: React.FC = () => {
  const { user, profile } = useAuth();
  const { collaboratorId } = useParams<{ collaboratorId: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [collaboratorProfile, setCollaboratorProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [tempComment, setTempComment] = useState("");
  const [tempEvidence, setTempEvidence] = useState("");
  
  // Add Task Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    pillar: PILARES[0],
    deadline: format(new Date(), "yyyy-MM-dd")
  });

  const isManager = profile?.role === "GESTOR";
  const targetUserId = isManager && collaboratorId ? collaboratorId : user?.uid;

  useEffect(() => {
    if (!targetUserId) return;

    // Fetch collaborator profile if viewing as manager
    if (isManager && collaboratorId) {
      getDoc(doc(db, "users", collaboratorId)).then(docSnap => {
        if (docSnap.exists()) {
          setCollaboratorProfile({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
        }
      });
    } else {
      setCollaboratorProfile(null);
    }

    const q = query(collection(db, "tasks"), where("userId", "==", targetUserId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(tasksData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [targetUserId, isManager, collaboratorId]);

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateDoc(doc(db, "tasks", taskId), { status: newStatus });
    } catch (error) {
      handleFirestoreError(error, "update", `tasks/${taskId}`);
    }
  };

  const saveTaskDetails = async (taskId: string) => {
    try {
      await updateDoc(doc(db, "tasks", taskId), { 
        comment: tempComment,
        evidence: tempEvidence
      });
      setEditingTask(null);
    } catch (error) {
      handleFirestoreError(error, "update", `tasks/${taskId}`);
    }
  };

  const handleTaskModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId) return;

    try {
      if (isEditModalOpen && currentTask) {
        await updateDoc(doc(db, "tasks", currentTask.id), {
          title: newTask.title,
          description: newTask.description,
          pillar: newTask.pillar,
          deadline: newTask.deadline
        });
      } else {
        await addDoc(collection(db, "tasks"), {
          ...newTask,
          userId: targetUserId,
          status: "A fazer",
          createdAt: serverTimestamp()
        });
      }
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      setCurrentTask(null);
      setNewTask({
        title: "",
        description: "",
        pillar: PILARES[0],
        deadline: format(new Date(), "yyyy-MM-dd")
      });
    } catch (error) {
      handleFirestoreError(error, isEditModalOpen ? "update" : "create", "tasks");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta tarefa?")) return;
    try {
      await deleteDoc(doc(db, "tasks", taskId));
    } catch (error) {
      handleFirestoreError(error, "delete", `tasks/${taskId}`);
    }
  };

  const tasksByPillar = React.useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    PILARES.forEach(p => grouped[p] = []);
    tasks.forEach(t => {
      if (grouped[t.pillar]) {
        grouped[t.pillar].push(t);
      }
    });
    return grouped;
  }, [tasks]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {collaboratorProfile 
              ? `Tarefas de ${collaboratorProfile.name || collaboratorProfile.email}`
              : "Minhas Tarefas"}
          </h1>
          <p className="text-slate-500 mt-1">
            {collaboratorProfile 
              ? "Gerencie as atividades deste colaborador."
              : "Gerencie suas atividades e comprove seu progresso."}
          </p>
        </div>
        {isManager && (
          <button 
            onClick={() => {
              setNewTask({
                title: "",
                description: "",
                pillar: PILARES[0],
                deadline: format(new Date(), "yyyy-MM-dd")
              });
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-2xl font-bold shadow-lg shadow-orange-600/20 hover:opacity-90 transition-all"
          >
            <Plus className="w-5 h-5" />
            Nova Tarefa
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {PILARES.map(pillar => (
          <div key={pillar} className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{pillar}</h2>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {tasksByPillar[pillar]?.length || 0}
              </span>
            </div>

            <div className="space-y-3">
              {tasksByPillar[pillar]?.map(task => (
                <div 
                  key={task.id} 
                  className={clsx(
                    "bg-white p-4 rounded-2xl border transition-all duration-200 group",
                    task.status === "Concluído" ? "border-emerald-100 bg-emerald-50/30" : "border-slate-200 hover:border-orange-600/20 shadow-sm"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <button 
                        onClick={() => {
                          const nextStatus: TaskStatus = 
                            task.status === "A fazer" ? "Em andamento" : 
                            task.status === "Em andamento" ? "Concluído" : "A fazer";
                          updateTaskStatus(task.id, nextStatus);
                        }}
                        className="mt-1"
                      >
                        {task.status === "Concluído" ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : task.status === "Em andamento" ? (
                          <Clock className="w-5 h-5 text-amber-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 group-hover:text-orange-600/50" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className={clsx(
                              "font-bold text-slate-900 leading-tight",
                              task.status === "Concluído" && "text-slate-400 line-through"
                            )}>
                              {task.title}
                            </h3>
                            {task.description && (
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                          </div>
                          {isManager && (
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => {
                                  setCurrentTask(task);
                                  setNewTask({
                                    title: task.title,
                                    description: task.description || "",
                                    pillar: task.pillar,
                                    deadline: task.deadline
                                  });
                                  setIsEditModalOpen(true);
                                }}
                                className="p-1 text-slate-300 hover:text-orange-600 transition-colors"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                            <CalendarIcon className="w-3.5 h-3.5" />
                            {format(parseISO(task.deadline), "dd/MM/yyyy")}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comments & Evidence Section */}
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                    {editingTask === task.id ? (
                      <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                        <textarea 
                          placeholder="Adicionar comentário..."
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all min-h-[80px]"
                          value={tempComment}
                          onChange={(e) => setTempComment(e.target.value)}
                        />
                        <input 
                          type="text" 
                          placeholder="Link ou texto de comprovação..."
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all"
                          value={tempEvidence}
                          onChange={(e) => setTempEvidence(e.target.value)}
                        />
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => saveTaskDetails(task.id)}
                            className="flex-1 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                          >
                            <Save className="w-3.5 h-3.5" /> Salvar
                          </button>
                          <button 
                            onClick={() => setEditingTask(null)}
                            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={clsx(
                            "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider",
                            task.comment ? "text-orange-600" : "text-slate-300"
                          )}>
                            <MessageSquare className="w-3.5 h-3.5" />
                            {task.comment ? "1 Comentário" : "Sem Comentários"}
                          </div>
                          <div className={clsx(
                            "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider",
                            task.evidence ? "text-emerald-600" : "text-slate-300"
                          )}>
                            <Paperclip className="w-3.5 h-3.5" />
                            {task.evidence ? "Comprovação" : "Sem Comprovação"}
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setEditingTask(task.id);
                            setTempComment(task.comment || "");
                            setTempEvidence(task.evidence || "");
                          }}
                          className="p-2 text-slate-400 hover:text-orange-600 hover:bg-slate-50 rounded-lg transition-all"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Task Modal (Add/Edit) */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900">
                {isEditModalOpen ? "Editar Tarefa" : "Nova Tarefa"}
              </h2>
              <button 
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleTaskModalSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Título da Tarefa</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Concluir curso de liderança"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Descrição</label>
                <textarea 
                  placeholder="Detalhes sobre a tarefa..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all min-h-[100px]"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pilar</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all"
                  value={newTask.pillar}
                  onChange={(e) => setNewTask({ ...newTask, pillar: e.target.value })}
                >
                  {PILARES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prazo</label>
                <input 
                  type="date" 
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all"
                  value={newTask.deadline}
                  onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-orange-600 text-white rounded-2xl font-bold shadow-lg shadow-orange-600/20 hover:opacity-90 transition-all"
                >
                  {isEditModalOpen ? "Salvar Alterações" : "Criar Tarefa"}
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
