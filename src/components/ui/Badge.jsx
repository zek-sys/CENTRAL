/**
 * Badge genérico. Manual de Marca: Ouro Tapajós, Cinza Chumbo.
 */
import React from "react";

export default function Badge({ children, variant = "default" }) {
  const styles = {
    default: "bg-zinc-800 text-zinc-400",
    brand: "bg-[#ebe22f]/20 text-[#ebe22f] border border-[#ebe22f]/30",
    success: "bg-green-500/20 text-green-500 border border-green-500/30",
    danger: "bg-[#db2669]/20 text-[#db2669] border border-[#db2669]/30",
  };
  return (
    <span
      className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md tracking-widest ${styles[variant]}`}
    >
      {children}
    </span>
  );
}
