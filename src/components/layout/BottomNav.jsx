/**
 * Bottom navigation bar — mobile only (md:hidden). Mesmos destinos da Sidebar.
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

export default function BottomNav({
  activeTab,
  setActiveTab,
  isAdmin,
  podeVerFinanceiro,
  onLogout,
}) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0a]/95 border-t border-white/10 backdrop-blur-xl safe-area-pb"
      aria-label="Navegação principal"
    >
      <div className="flex items-center justify-around py-2 px-2 max-w-full overflow-x-auto gap-1">
        <div className="flex flex-col items-center min-w-[64px]">
          <NavItem
            active={activeTab === "meu_conves"}
            onClick={() => setActiveTab("meu_conves")}
            icon={LayoutDashboard}
            label="Convés"
          />
        </div>
        <div className="flex flex-col items-center min-w-[64px]">
          <NavItem
            active={activeTab === "bussola"}
            onClick={() => setActiveTab("bussola")}
            icon={Compass}
            label="Bússola"
          />
        </div>
        <div className="flex flex-col items-center min-w-[64px]">
          <NavItem
            active={activeTab === "projetos"}
            onClick={() => setActiveTab("projetos")}
            icon={Map}
            label="Projetos"
          />
        </div>
        <div className="flex flex-col items-center min-w-[64px]">
          <NavItem
            active={activeTab === "arquivos"}
            onClick={() => setActiveTab("arquivos")}
            icon={HardDrive}
            label="Baú"
          />
        </div>
        <div className="flex flex-col items-center min-w-[64px]">
          <NavItem
            active={activeTab === "mapa_cultural"}
            onClick={() => setActiveTab("mapa_cultural")}
            icon={User}
            label="Perfil"
          />
        </div>
        {podeVerFinanceiro && (
          <div className="flex flex-col items-center min-w-[64px]">
            <NavItem
              active={activeTab === "financeiro"}
              onClick={() => setActiveTab("financeiro")}
              icon={DollarSign}
              label="Caixa"
              color="text-[#ebe22f]"
            />
          </div>
        )}
        {isAdmin && (
          <>
            <div className="flex flex-col items-center min-w-[64px]">
              <NavItem
                active={activeTab === "admin"}
                onClick={() => setActiveTab("admin")}
                icon={Settings2}
                label="Motor"
                color="text-[#ebe22f]"
              />
            </div>
            <div className="flex flex-col items-center min-w-[64px]">
              <NavItem
                active={activeTab === "aprovacoes"}
                onClick={() => setActiveTab("aprovacoes")}
                icon={ShieldCheck}
                label="Aprovar"
                color="text-[#ebe22f]"
              />
            </div>
          </>
        )}
        <div className="flex flex-col items-center min-w-[64px]">
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-4 py-5 rounded-[1.5rem] text-zinc-500 hover:bg-white/5 hover:text-red-500 transition-all"
            aria-label="Abandonar Navio"
          >
            <LogOut size={20} />
            <span className="text-[10px] uppercase tracking-widest font-black">Sair</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
