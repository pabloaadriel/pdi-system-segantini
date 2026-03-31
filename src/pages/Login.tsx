import React, { useState } from "react";
import { useAuth } from "../components/AuthContext";
import { Navigate } from "react-router-dom";
import { Target, ArrowRight, ShieldCheck, Zap, Users, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const Login: React.FC = () => {
  const { user, signIn, loading } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      await signIn();
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row overflow-hidden">
      {/* Left Side: Branding & Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary p-16 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20">
              <Target className="w-7 h-7 text-primary" />
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
              Transformando ambientes corporativos em locais de trabalho mais <span className="text-accent">saudáveis e sustentáveis.</span>
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
          <Target className="w-6 h-6 text-primary" />
          <span className="text-lg font-black text-slate-900 tracking-tighter uppercase">PDI System</span>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Bem-vindo</h2>
            <p className="text-slate-500 font-medium">Faça login com sua conta Google para acessar seu PDI.</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleSignIn}
              disabled={isLoggingIn || loading}
              className="w-full flex items-center justify-center gap-4 px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl text-slate-700 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <img 
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                alt="Google" 
                className="w-5 h-5"
              />
              {isLoggingIn ? "Entrando..." : "Entrar com Google"}
              <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </button>

            <div className="pt-8 text-center">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest leading-relaxed">
                Ao entrar, você concorda com nossos <br />
                <a href="#" className="text-primary hover:underline">Termos de Uso</a> e <a href="#" className="text-primary hover:underline">Privacidade</a>.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
