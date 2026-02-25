/**
 * Sidebar desktop. Oculto no mobile (md:flex). Preserva visual cockpit.
 */
import React from "react";
import {
  Compass,
  HardDrive,
  LayoutDashboard,
  LogOut,
  Map,
  Settings2,
  ShieldCheck,
  DollarSign,
  User,
} from "lucide-react";
import NavItem from "./NavItem";

export default function Sidebar({
  activeTab,
  setActiveTab,
  isAdmin,
  podeVerFinanceiro,
  userProfile,
  onLogout,
}) {
  return (
    <aside className="hidden md:flex w-80 bg-[#0a0a0a] border-r border-white/5 flex-col p-8 z-30 shadow-2xl relative">
      <div className="mb-12 text-center" onClick={() => setActiveTab("meu_conves")} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setActiveTab("meu_conves")}>
        <img
          src="https://files.greatpages.com.br/arquivos/paginas_editor/6759-b9cd6b77d1b2f73b1cb3483ac0f9c1a4.svg"
          alt="Logo"
          className="h-12 mx-auto drop-shadow-lg"
        />
        <span className="text-[9px] font-black text-[#ebe22f] tracking-[0.6em] uppercase block mt-4 italic opacity-80">
          Central Regatão
        </span>
      </div>

      <nav className="space-y-2 flex-1">
        <NavItem
          active={activeTab === "meu_conves"}
          onClick={() => setActiveTab("meu_conves")}
          icon={LayoutDashboard}
          label="Meu Convés"
        />
        <NavItem
          active={activeTab === "bussola"}
          onClick={() => setActiveTab("bussola")}
          icon={Compass}
          label="A Bússola"
        />
        <NavItem
          active={activeTab === "projetos"}
          onClick={() => setActiveTab("projetos")}
          icon={Map}
          label="Mapa de Batalha"
        />
        <NavItem
          active={activeTab === "arquivos"}
          onClick={() => setActiveTab("arquivos")}
          icon={HardDrive}
          label="Baú Cloud"
        />
        <NavItem
          active={activeTab === "mapa_cultural"}
          onClick={() => setActiveTab("mapa_cultural")}
          icon={User}
          label="Mapa Cultural"
        />

        {isAdmin && (
          <div className="pt-8 mt-8 border-t border-white/5">
            <p className="text-[10px] font-black text-[#ebe22f] uppercase tracking-widest mb-6 px-4 opacity-50 italic">
              Comando Arquiteto
            </p>
            <NavItem
              active={activeTab === "admin"}
              onClick={() => setActiveTab("admin")}
              icon={Settings2}
              label="Motor de Design"
              color="text-[#ebe22f]"
            />
            <NavItem
              active={activeTab === "aprovacoes"}
              onClick={() => setActiveTab("aprovacoes")}
              icon={ShieldCheck}
              label="Aprovar Demandas"
              color="text-[#ebe22f]"
            />
          </div>
        )}

        {podeVerFinanceiro && (
          <div className="pt-8 mt-8 border-t border-white/5">
            <p className="text-[10px] font-black text-[#ebe22f] uppercase tracking-widest mb-6 px-4 opacity-50 italic">
              Caixa de Bordo
            </p>
            <NavItem
              active={activeTab === "financeiro"}
              onClick={() => setActiveTab("financeiro")}
              icon={DollarSign}
              label="Financeiro"
              color="text-[#ebe22f]"
            />
          </div>
        )}
      </nav>

      <div className="mt-auto pt-8 border-t border-white/5 flex items-center gap-4 group">
        <div className="w-12 h-12 rounded-2xl bg-[#ebe22f]/10 border border-[#ebe22f]/30 flex items-center justify-center text-[#ebe22f] font-black text-xs uppercase shadow-inner group-hover:scale-110 transition-transform">
          {userProfile?.nome?.[0]}
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="text-[11px] font-black truncate uppercase italic tracking-tighter">
            {userProfile?.nome}
          </p>
          <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter truncate leading-none">
            {userProfile?.nucleo}
          </p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="p-4 flex items-center gap-4 text-zinc-500 hover:text-red-500 transition-all shrink-0"
        >
          <LogOut size={20} />
          <span className="text-xs font-black uppercase tracking-widest">Abandonar Navio</span>
        </button>
      </div>
    </aside>
  );
}
