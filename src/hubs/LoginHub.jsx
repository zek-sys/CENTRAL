/**
 * Hub Login — Acesso Restrito + Novo Alistamento. Inclui mostrar senha e login com Google.
 */
import React, { useState } from "react";
import { ChevronRight, Eye, EyeOff } from "lucide-react";
import { AdminInput, AdminSelect } from "../components/ui/AdminFields";

const MASTER_BYPASS_CODE = "REGATAO2026";

export default function LoginHub({ onLogin, onRegister, onGoogleLogin, error }) {
  const [isReg, setIsReg] = useState(false);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [nome, setNome] = useState("");
  const [nucleo, setNucleo] = useState("");
  const [code, setCode] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showCode, setShowCode] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-10 overflow-y-auto">
      <div className="w-full max-w-lg bg-zinc-900/30 backdrop-blur-3xl p-16 rounded-[4.5rem] border border-white/10 shadow-[0_0_150px_rgba(0,0,0,0.9)] relative overflow-hidden group">
        <div className="text-center mb-16 relative z-10">
          <img
            src="https://files.greatpages.com.br/arquivos/paginas_editor/6759-b9cd6b77d1b2f73b1cb3483ac0f9c1a4.svg"
            alt="Logo"
            className="w-48 mx-auto mb-10 drop-shadow-3xl group-hover:scale-105 transition-transform duration-1000"
          />
          <h1 className="text-4xl font-black italic uppercase text-white tracking-tighter mb-4 leading-none">
            Central Regatão
          </h1>
          <p className="text-[#ebe22f] text-[10px] font-black uppercase tracking-[0.5em] italic opacity-80">
            {isReg ? "Novo Alistamento" : "Acesso Restrito"}
          </p>
        </div>

        {onGoogleLogin && (
          <div className="relative z-10 mb-6">
            <button
              type="button"
              onClick={onGoogleLogin}
              className="w-full bg-white/10 border border-white/20 text-white font-black uppercase py-4 rounded-2xl hover:bg-white/15 active:scale-[0.98] transition-all text-[11px] tracking-widest flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Entrar com Google
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (isReg) {
              if (code !== MASTER_BYPASS_CODE) return alert("Código de Tripulação Inválido.");
              onRegister(email, pass, { nome, nucleo });
            } else onLogin(email, pass);
          }}
          className="space-y-2 relative z-10"
        >
          {isReg && (
            <>
              <AdminInput label="Nome Completo" onChange={setNome} value={nome} required />
              <AdminSelect
                label="Núcleo"
                onChange={setNucleo}
                value={nucleo}
                options={[
                  { label: "Comunicação e Impacto", value: "Comunicação" },
                  { label: "Produção e Tática", value: "Produção" },
                  { label: "Financeiro e Base", value: "Financeiro" },
                  { label: "Estratégico (Diretoria)", value: "Estratégico" },
                ]}
                required
              />
              <div className="relative">
                <AdminInput
                  label="Código de Convite"
                  onChange={setCode}
                  value={code}
                  type={showCode ? "text" : "password"}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCode((s) => !s)}
                  className="absolute right-4 top-[42px] text-zinc-500 hover:text-[#ebe22f] transition-colors"
                  aria-label={showCode ? "Ocultar código" : "Mostrar código"}
                >
                  {showCode ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </>
          )}
          <AdminInput label="E-mail Tripulante" type="email" onChange={setEmail} value={email} required />
          <div className="relative">
            <AdminInput
              label="Código de Acesso"
              type={showPass ? "text" : "password"}
              onChange={setPass}
              value={pass}
              required
            />
            <button
              type="button"
              onClick={() => setShowPass((s) => !s)}
              className="absolute right-4 top-[42px] text-zinc-500 hover:text-[#ebe22f] transition-colors"
              aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <p className="text-[#db2669] text-[10px] font-black text-center uppercase tracking-widest bg-[#db2669]/10 p-4 rounded-2xl border border-[#db2669]/20 shadow-xl">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-[#ebe22f] text-black font-black uppercase py-6 rounded-3xl mt-12 hover:scale-[1.03] active:scale-95 transition-all shadow-[0_25px_60px_rgba(235,226,47,0.15)] italic text-sm tracking-widest flex items-center justify-center gap-4"
          >
            {isReg ? "Alistar e Atracar" : "Assumir Comando"} <ChevronRight size={18} strokeWidth={4} />
          </button>
        </form>

        <button
          onClick={() => setIsReg(!isReg)}
          className="w-full mt-12 text-[10px] font-black text-zinc-600 uppercase tracking-widest hover:text-[#ebe22f] transition-all italic relative z-10"
        >
          {isReg ? "Já sou tripulante" : "Novo Tripulante? Alistar-se"}
        </button>

        <div className="absolute -top-40 -left-40 w-80 h-80 bg-[#ebe22f]/5 blur-[120px] rounded-full group-hover:bg-[#ebe22f]/10 transition-all duration-1000" />
      </div>
    </div>
  );
}
