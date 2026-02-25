/**
 * Badge de evidência (NF, Lista, Foto). Manual de Marca: cores preservadas (Ouro Tapajós / Cinza Chumbo).
 */
import React from "react";

export default function EvidenceBadge({ label, ok }) {
  return (
    <span
      className={`text-[8px] font-black px-2 py-0.5 rounded border transition-all tracking-tighter ${
        ok
          ? "border-green-500/30 text-green-500 bg-green-500/10"
          : "border-[#db2669]/30 text-[#db2669] bg-[#db2669]/5 opacity-40"
      }`}
    >
      {label}
    </span>
  );
}
