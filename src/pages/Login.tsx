import React, { useState } from "react";
import { useAuth } from "../components/AuthContext";
import { Navigate } from "react-router-dom";
import { Target, ArrowRight, ShieldCheck, Zap, Users, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

const Login: React.FC = () => {
  const { user, login, loginGoogle, signUp, loading, error: authError, clearError } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (user) return <Navigate to="/" replace />;

  const handleGoogleLogin = async () => {
    setIsProcessing(true);
    try {
      await loginGoogle();
    } catch (error) {
      console.error("Google login error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    if (!email) return;

    setIsProcessing(true);
    try {
      if (isSignUp) {
        if (!password) return;
        await signUp(email, password);
      } else {
        if (!password) return;
        await login(email, password);
      }
    } catch (error) {
      console.error("Auth error:", error);
    } finally {
      setIsProcessing(false);
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
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">
              {isSignUp ? "Primeiro Acesso" : "Bem-vindo"}
            </h2>
            <p className="text-slate-500 font-medium">
              {isSignUp 
                ? "Cadastre sua senha para acessar seu PDI." 
                : "Faça login para acessar seu PDI."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {authError && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium animate-in fade-in slide-in-from-top-2 break-words">
                <p>{authError}</p>
                {authError.includes("Google") && (
                  <p className="mt-2 text-[10px] opacity-80">
                    Dica: Verifique se o login do Google está habilitado no console do Firebase e se o domínio atual está autorizado.
                  </p>
                )}
              </div>
            )}

            {successMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                {successMessage}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">E-mail de Acesso</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl text-slate-700 font-medium focus:border-primary focus:ring-0 transition-all outline-none"
              />
              <p className="text-[11px] text-slate-500 ml-1 font-semibold italic">
                * Utilize o e-mail convidado pela Segantini Consultoria.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Senha</label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl text-slate-700 font-medium focus:border-primary focus:ring-0 transition-all outline-none pr-12"
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

            <button
              type="submit"
              disabled={isProcessing || loading}
              className="w-full flex items-center justify-center gap-4 px-6 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all duration-200 group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
            >
              {isProcessing ? "Processando..." : (isSignUp ? "Ativar Conta" : "Entrar")}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-all" />
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest">
                <span className="bg-slate-50 px-4 text-slate-400">Ou continue com</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isProcessing || loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>

            <div className="pt-4 text-center space-y-3">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  clearError();
                }}
                className="text-sm font-bold text-primary hover:underline"
              >
                {isSignUp ? "Já tem uma conta? Entre aqui" : "Primeiro acesso? Cadastre sua senha"}
              </button>
              <p className="text-[10px] text-slate-400 font-medium">
                Se esqueceu sua senha ou não consegue acessar, <br />
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
