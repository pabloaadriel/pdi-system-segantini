import React, { useState, useEffect } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { UserProfile } from "../types";
import { 
  LayoutDashboard, 
  Users, 
  LogOut, 
  Menu, 
  X, 
  Search, 
  Bell,
  ChevronDown,
  User as UserIcon,
  Target,
  CheckSquare,
  ShieldCheck
} from "lucide-react";
import { clsx } from "clsx";

const Layout: React.FC = () => {
  const { profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [collaborators, setCollaborators] = useState<UserProfile[]>([]);

  const isManager = profile?.role === "GESTOR";

  useEffect(() => {
    if (isManager) {
      const q = query(collection(db, "users"), where("role", "==", "COLABORADOR"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const users = snapshot.docs.map(doc => doc.data() as UserProfile);
        setCollaborators(users);
      });
      return () => unsubscribe();
    }
  }, [isManager]);

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
  ];

  if (isManager) {
    navItems.push({ name: "Gestão", path: "/manager", icon: Users });
    navItems.push({ name: "Membros", path: "/members", icon: ShieldCheck });
  } else {
    navItems.push({ name: "Minhas Tarefas", path: "/tasks", icon: CheckSquare });
  }

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-200 sticky top-0 h-screen">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-600/20">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-orange-600 tracking-tighter uppercase leading-none">PDI System</span>
              <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Segantini Consultoria</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200",
                location.pathname === item.path
                  ? "bg-slate-50 text-orange-600 shadow-sm border border-slate-100"
                  : "text-slate-500 hover:bg-slate-50 hover:text-orange-600"
              )}
            >
              <item.icon className={clsx(
                "w-5 h-5",
                location.pathname === item.path ? "text-orange-600" : "text-slate-400"
              )} />
              {item.name}
            </Link>
          ))}

          {isManager && (
            <div className="pt-6 mt-6 border-t border-slate-100 space-y-1">
              <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Colaboradores</p>
              {collaborators.length > 0 ? (
                collaborators.map((collab) => (
                  <Link
                    key={collab.uid}
                    to={`/tasks/${collab.uid}`}
                    className={clsx(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200",
                      location.pathname === `/tasks/${collab.uid}`
                        ? "bg-orange-600/5 text-orange-600 border border-orange-600/10"
                        : "text-slate-500 hover:bg-slate-50 hover:text-orange-600"
                    )}
                  >
                    <UserIcon className={clsx(
                      "w-5 h-5",
                      location.pathname === `/tasks/${collab.uid}` ? "text-orange-600" : "text-slate-400"
                    )} />
                    <span className="truncate">Tarefas de {collab.name}</span>
                  </Link>
                ))
              ) : (
                <p className="px-4 py-2 text-xs text-slate-400 italic">Nenhum colaborador ainda.</p>
              )}
            </div>
          )}
        </nav>

        <div className="p-6 border-t border-slate-100">
          <div className="mb-6 px-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Consultoria</p>
            <p className="text-xs font-bold text-orange-600">Segantini Consultoria</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            Sair da Conta
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={clsx(
        "fixed inset-y-0 left-0 w-72 bg-white z-50 transform transition-transform duration-300 lg:hidden",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black text-slate-900 tracking-tighter uppercase">PDI System</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)}>
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <nav className="px-4 space-y-1 mt-4 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                location.pathname === item.path
                  ? "bg-orange-600/5 text-orange-600"
                  : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}

          {isManager && (
            <div className="pt-6 mt-6 border-t border-slate-100 space-y-1">
              <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Colaboradores</p>
              {collaborators.length > 0 ? (
                collaborators.map((collab) => (
                  <Link
                    key={collab.uid}
                    to={`/tasks/${collab.uid}`}
                    onClick={() => setIsSidebarOpen(false)}
                    className={clsx(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                      location.pathname === `/tasks/${collab.uid}`
                        ? "bg-orange-600/5 text-orange-600"
                        : "text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    <UserIcon className="w-5 h-5" />
                    <span className="truncate">Tarefas de {collab.name}</span>
                  </Link>
                ))
              ) : (
                <p className="px-4 py-2 text-xs text-slate-400 italic">Nenhum colaborador ainda.</p>
              )}
            </div>
          )}
        </nav>

        <div className="absolute bottom-4 left-4 right-4 pt-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-slate-500"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden md:flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 w-96">
              <Search className="w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Pesquisar..." 
                className="bg-transparent border-none focus:ring-0 text-sm text-slate-600 w-full outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-tight">{profile?.name}</p>
                <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">{profile?.role}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-orange-600 font-bold shadow-sm border border-slate-200">
                {profile?.name?.charAt(0) || <UserIcon className="w-5 h-5" />}
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
