/**
 * Card de métrica (Remadas, Compliance, Status). Manual de Marca: Ouro Tapajós (#ebe22f), Cinza Chumbo (zinc).
 */
import React from "react";

export default function StatCard({ title, value, color, detail, icon: Icon }) {
  return (
    <div className="bg-zinc-900/40 border border-white/5 p-10 rounded-[3rem] shadow-2xl hover:translate-y-[-8px] transition-all duration-500 relative overflow-hidden group">
      <div className="flex justify-between items-start mb-8 relative z-10">
        <p className="text-[11px] font-black uppercase text-zinc-500 tracking-[0.4em]">{title}</p>
        <div className={`p-3 rounded-2xl bg-black/40 ${color} opacity-80 group-hover:opacity-100 transition-all shadow-2xl`}>
          <Icon size={22} strokeWidth={3} />
        </div>
      </div>
      <h3 className={`text-6xl font-black italic ${color} mb-6 tracking-tighter tabular-nums relative z-10 drop-shadow-2xl`}>
        {value}
      </h3>
      <p className="text-[11px] text-zinc-500 leading-relaxed font-bold italic opacity-60 border-t border-white/5 pt-5 relative z-10 uppercase tracking-widest">
        {detail}
      </p>
      <div className="absolute -top-24 -right-24 w-56 h-56 bg-white/5 blur-[100px] rounded-full group-hover:bg-white/10 transition-all duration-1000" />
    </div>
  );
}
