/**
 * Badge de status (Sincronizado, etc.). Manual de Marca preservado.
 */
import React from "react";

export default function BadgeStatus({ label, color = "green" }) {
  const bg =
    color === "green"
      ? "bg-green-500/10 text-green-500 border-green-500/20"
      : "bg-[#ebe22f]/10 text-[#ebe22f] border-[#ebe22f]/20";
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-2 h-2 rounded-full ${
          color === "green"
            ? "bg-green-500 animate-pulse shadow-[0_0_10px_green]"
            : "bg-[#ebe22f]"
        }`}
      />
      <span className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.3em] rounded-full border ${bg} backdrop-blur-md`}>
        {label}
      </span>
    </div>
  );
}
