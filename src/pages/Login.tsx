import React, { useState } from "react";
import { useAuth } from "../components/AuthContext";
import { Navigate } from "react-router-dom";
import { Target, ArrowRight, ShieldCheck, Zap, Users, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { USERS_CREDENTIALS } from "../types";

const Login: React.FC = () => {
  const { user, login, loading, error: authError, clearError } = useAuth();
  const [selectedEmail, setSelectedEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authError) clearError();

    if (!selectedEmail || !password) {
      return;
    }

    setIsProcessing(true);
    try {
      await login(selectedEmail, password);
    } catch (error: any) {
      console.error("Login process error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row overflow-hidden">
      {/* Left Side: Branding & Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#ea580c] p-16 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-orange-600/20">
              <Target className="w-7 h-7 text-[#ea580c]" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-white tracking-tighter uppercase leading-none">PDI System</span>
              <span className="text-xs font-bold text-white/70 uppercase tracking-widest">Segantini Consultoria</span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl font-black text-white leading-[1.1] tracking-tight mb-8">
              Transformando ambientes corporativos em locais de trabalho mais <span className="text-orange-200">saudáveis e sustentáveis.</span>
            </h1>

            <p className="text-xl text-white/90 max-w-md leading-relaxed mb-12 font-medium">
              Este produto foi pensado e executado pensando no desenvolvimento individual dos líderes.
            </p>

            <div className="space-y-6">
              {[
                { icon: ShieldCheck, text: "Isolamento total de dados por usuário" },
                { icon: Zap, text: "Acompanhamento de progresso em tempo real" },
                { icon: Users, text: "Visão estratégica para gestores" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-white/70 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>Desenvolvido por Segantini Consultoria</span>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-24 bg-slate-50 relative">
        <div className="absolute top-8 left-8 lg:hidden flex items-center gap-2">
          <Target className="w-6 h-6 text-[#ea580c]" />
          <span className="text-lg font-black text-slate-900 tracking-tighter uppercase">PDI System</span>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">
              Bem-vindo
            </h2>
            <p className="text-slate-500 font-medium">
              Faça login para acessar seu PDI.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {authError && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium animate-in fade-in slide-in-from-top-2 break-words">
                <p>{authError}</p>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Usuário</label>
                <select
                  value={selectedEmail}
                  onChange={(e) => {
                    setSelectedEmail(e.target.value);
                    if (authError) clearError();
                  }}
                  required
                  className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl text-slate-700 font-medium focus:border-[#ea580c] focus:ring-0 transition-all outline-none appearance-none"
                >
                  <option value="" disabled>Selecione seu nome</option>
                  {USERS_CREDENTIALS.map((u) => (
                    <option key={u.email} value={u.email}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (authError) clearError();
                    }}
                    placeholder="Sua senha"
                    required
                    className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl text-slate-700 font-medium focus:border-[#ea580c] focus:ring-0 transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing || loading}
              className="w-full flex items-center justify-center gap-4 px-6 py-4 bg-[#ea580c] text-white rounded-2xl font-bold hover:bg-[#c2410c] transition-all duration-200 group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-600/20 mt-6"
            >
              {isProcessing ? "Processando..." : "Entrar"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-all" />
            </button>

            <div className="pt-4 text-center">
              <p className="text-[10px] text-slate-400 font-medium">
                Se não consegue acessar, <br />
                contate o suporte da Segantini Consultoria.
              </p>
            </div>
          </form>

          <div className="pt-8 text-center">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest leading-relaxed">
              Desenvolvido por Segantini Consultoria
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;

