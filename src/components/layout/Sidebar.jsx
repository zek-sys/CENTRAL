/**
 * Sidebar estilo workstation de gestão ágil:
 * Rail fixo (ícones) + drawer simplificado com lista única, sem seções colapsáveis.
 */
import React, { useState, useRef, useEffect } from "react";
import {
  Compass,
  HardDrive,
  LayoutDashboard,
  LogOut,
  Map,
  Settings2,
  DollarSign,
  User,
  CalendarDays,
  BookOpen,
  GraduationCap,
  Menu,
  PanelLeftClose,
  Bookmark,
  Megaphone,
  Archive,
  Network,
  Building2,
  Radio,
  MapPin,
  Layers,
  BarChart2,
} from "lucide-react";
import NavItem from "./NavItem";

const PRIMARY = [
  { id: "meu_conves", icon: LayoutDashboard, label: "Minhas Tarefas" },
  { id: "admin", icon: Settings2, label: "Gestão Estratégica", show: (p) => p.isAdmin },
  { id: "projetos", icon: Map, label: "Projetos" },
  { id: "master_outliner", icon: Layers, label: "Master Outliner", show: (p) => p.isAdmin },
  { id: "cronograma_geral", icon: CalendarDays, label: "Cronograma Geral" },
];

const SECONDARY = [
  { id: "bussola", icon: BarChart2, label: "Visão Geral" },
  { id: "mapa_impacto", icon: Network, label: "Mapa do Impacto" },
  { id: "cultura", icon: Bookmark, label: "Cultura e Manuais" },
  { id: "perfil", icon: User, label: "Perfil" },
  { id: "guia_aprendizagem", icon: Compass, label: "Guia de Bordo" },
];

const CONDITIONAL = [
  { id: "financeiro", icon: DollarSign, label: "Direção e Finanças", show: (p) => p.podeVerFinanceiro && p.showFinanceiroTab, color: "text-amber-600 dark:text-amber-400" },
  { id: "nucleo_pedagogico", icon: GraduationCap, label: "Núcleo Pedagógico", show: (p) => p.isDiretoria, color: "text-amber-600 dark:text-amber-400" },
];

const ARCHIVED = [
  { id: "comunicacao", icon: Megaphone, label: "Comunicação" },
  { id: "arquivos", icon: HardDrive, label: "Arquivos" },
  { id: "conheca_o_instituto", icon: BookOpen, label: "Conheça o Instituto" },
];

const NUCLEOS = [
  { id: "nucleo_gestao", icon: Building2, label: "Núcleo Gestão", slug: "gestao" },
  { id: "nucleo_comunicacao", icon: Radio, label: "Núcleo Comunicação", slug: "comunicacao" },
  { id: "nucleo_campo", icon: MapPin, label: "Núcleo Campo", slug: "campo" },
  { id: "nucleo_pedagogico_page", icon: GraduationCap, label: "Núcleo Pedagógico", slug: "pedagogico" },
];

export default function Sidebar({
  activeTab,
  setActiveTab,
  isAdmin,
  isDiretoria,
  podeVerFinanceiro,
  showFinanceiroTab = false,
  userProfile,
  onLogout,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const drawerRef = useRef(null);
  const props = { isAdmin, isDiretoria, podeVerFinanceiro, showFinanceiroTab };

  useEffect(() => {
    function handleEscape(e) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const go = (tab) => {
    setActiveTab(tab);
    setIsOpen(false);
  };

  return (
    <>
      {/* Rail: ícone menu + logo + 4 principais */}
      <aside className="hidden md:flex md:h-full md:min-h-0 w-14 shrink-0 flex-col items-center py-3 gap-0.5 bg-zinc-100 dark:bg-zinc-900/95 border-r border-zinc-200 dark:border-zinc-800 z-20">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
          aria-label="Abrir menu"
        >
          <Menu size={20} strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => go("meu_conves")}
          className="w-9 h-9 rounded-lg overflow-hidden bg-white dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700 hover:shadow-sm transition-shadow"
          title="Início"
        >
          <img
            src="https://files.greatpages.com.br/arquivos/paginas_editor/6759-b9cd6b77d1b2f73b1cb3483ac0f9c1a4.svg"
            alt="Logo"
            className="w-5 h-5 object-contain"
          />
        </button>
        <div className="w-6 h-px bg-zinc-200 dark:bg-zinc-700 my-2" aria-hidden />
        {PRIMARY.filter((item) => (item.show ? item.show(props) : true)).map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => go(id)}
            className={`w-10 h-10 flex items-center justify-center rounded-lg shrink-0 transition-colors ${
              activeTab === id
                ? "bg-[#EBE22F]/20 text-[#B89600] dark:text-[#EBE22F]"
                : "text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
            }`}
            title={label}
            aria-label={label}
          >
            <Icon size={20} strokeWidth={2} />
          </button>
        ))}
      </aside>

      {/* Backdrop */}
      {isOpen && (
        <div
          role="presentation"
          className="fixed inset-0 bg-black/30 z-40 md:z-50"
          onClick={() => setIsOpen(false)}
          aria-hidden
        />
      )}

      {/* Drawer: lista única, sem colapsáveis */}
      <div
        ref={drawerRef}
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 max-w-[90vw] flex flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 shadow-xl transition-transform duration-200 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-modal="true"
        aria-label="Menu"
      >
        {/* Header compacto */}
        <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src="https://files.greatpages.com.br/arquivos/paginas_editor/6759-b9cd6b77d1b2f73b1cb3483ac0f9c1a4.svg"
              alt=""
              className="h-6 w-6 shrink-0"
            />
            <span className="text-sm font-semibold text-zinc-900 dark:text-white truncate">Gestão Regatão</span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Fechar menu"
          >
            <PanelLeftClose size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Lista única scrollável */}
        <nav className="flex-1 min-h-0 overflow-y-auto py-2">
          <ul className="space-y-0.5 px-2" role="list">
            {PRIMARY.filter((item) => (item.show ? item.show(props) : true)).map(({ id, icon, label }) => (
              <li key={id}>
                <NavItem
                  active={activeTab === id}
                  onClick={() => go(id)}
                  icon={icon}
                  label={label}
                />
              </li>
            ))}
          </ul>
          <ul className="space-y-0.5 px-2 mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800" role="list">
            {SECONDARY.map(({ id, icon, label }) => (
              <li key={id}>
                <NavItem active={activeTab === id} onClick={() => go(id)} icon={icon} label={label} />
              </li>
            ))}
            {CONDITIONAL.filter((item) => item.show(props)).map(({ id, icon, label, color }) => (
              <li key={id}>
                <NavItem
                  active={activeTab === id}
                  onClick={() => go(id)}
                  icon={icon}
                  label={label}
                  color={color}
                />
              </li>
            ))}
          </ul>
          <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 px-3">
            <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              Núcleos
            </p>
            <ul className="space-y-0.5" role="list">
              {NUCLEOS.map(({ id, icon, label }) => (
                <li key={id}>
                  <NavItem
                    active={activeTab === id}
                    onClick={() => go(id)}
                    icon={icon}
                    label={label}
                    color="text-zinc-500 dark:text-zinc-400"
                  />
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 px-3">
            <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              Arquivados
            </p>
            <ul className="space-y-0.5" role="list">
              {ARCHIVED.map(({ id, icon, label }) => (
                <li key={id}>
                  <NavItem
                    active={activeTab === id}
                    onClick={() => go(id)}
                    icon={icon}
                    label={label}
                    color="text-zinc-500 dark:text-zinc-500"
                  />
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Rodapé compacto */}
        <div className="shrink-0 p-2 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/80">
            <div className="w-8 h-8 rounded-lg bg-[#EBE22F]/20 flex items-center justify-center text-[#B89600] dark:text-[#EBE22F] font-semibold text-xs shrink-0">
              {userProfile?.nome?.[0] ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-zinc-900 dark:text-white truncate">
                {userProfile?.nome ?? "Usuário"}
              </p>
              <p className="text-[10px] text-zinc-500 truncate">
                {userProfile?.nucleos?.[0] ?? userProfile?.nucleo ?? "—"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => { onLogout(); setIsOpen(false); }}
              className="p-2 rounded-lg text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              title="Sair"
              aria-label="Sair"
            >
              <LogOut size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
