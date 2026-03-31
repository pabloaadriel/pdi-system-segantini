import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { UserProfile, PREDEFINED_USERS } from "../types";
import { Mail, User as UserIcon, CheckCircle2, Clock, Shield } from "lucide-react";
import { clsx } from "clsx";

const Members: React.FC = () => {
  const [activeUsers, setActiveUsers] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users: Record<string, UserProfile> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data() as UserProfile;
        users[data.email.toLowerCase()] = data;
      });
      setActiveUsers(users);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const predefinedList = Object.entries(PREDEFINED_USERS).map(([email, data]) => ({
    email,
    ...data,
    isActive: !!activeUsers[email.toLowerCase()]
  }));

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Membros do Sistema</h1>
          <p className="text-slate-500 mt-1">Lista de membros pré-definidos para o PDI da Segantini Consultoria.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900">Membros Autorizados</h2>
        </div>

        <div className="divide-y divide-slate-100">
          {predefinedList.map(member => (
            <div key={member.email} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className={clsx(
                  "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border",
                  member.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"
                )}>
                  {member.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 leading-tight">{member.name}</h4>
                    <span className={clsx(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest",
                      member.role === "GESTOR" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                    )}>
                      {member.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <Mail className="w-3 h-3" /> {member.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  {member.isActive ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Ativo</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs">
                      <Clock className="w-4 h-4" />
                      <span>Pendente</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Members;
