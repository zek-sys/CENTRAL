/**
 * Item de navegação da Sidebar/BottomNav. Visual cockpit preservado.
 */
import React from "react";

export default function NavItem({ active, onClick, icon: Icon, label, color = "text-zinc-500" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-5 px-6 py-5 rounded-[1.5rem] transition-all relative group ${
        active
          ? "bg-[#ebe22f] text-black font-black italic shadow-[0_15px_40px_rgba(235,226,47,0.2)] scale-[1.03] z-10"
          : `hover:bg-white/5 ${color} hover:text-white`
      }`}
    >
      <Icon size={20} strokeWidth={active ? 3 : 2} />
      <span className="text-[11px] uppercase tracking-[0.2em] font-black truncate">{label}</span>
      {active && (
        <div className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-2 h-10 bg-black rounded-full shadow-[0_0_20px_white]" />
      )}
    </button>
  );
}
