/**
 * Hub Mapa Cultural — Perfil do tripulante: expertises e Perfil Belbin. Visual cockpit preservado.
 */
import React, { useState } from "react";
import { User, Award, Users } from "lucide-react";
import Badge from "../components/ui/Badge";

const BELBIN_ROLES = [
  "Coordenador",
  "Implementador",
  "Completador-Finalizador",
  "Criativo",
  "Investigador de Recursos",
  "Avaliador",
  "Formador",
  "Cohesionador",
  "Especialista",
];

export default function MapaCulturalHub({ userProfile }) {
  const [expertises, setExpertises] = useState(userProfile?.expertises || [""]);
  const [belbin, setBelbin] = useState(userProfile?.belbin || "");

  const addExpertise = () => setExpertises((e) => [...e, ""]);
  const setExpertise = (i, v) =>
    setExpertises((e) => e.map((x, j) => (j === i ? v : x)));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-12">
      <section className="bg-zinc-900/40 border border-white/5 p-10 rounded-[3.5rem] shadow-2xl backdrop-blur-xl">
        <h3 className="text-sm font-black uppercase tracking-[0.4em] text-zinc-500 italic mb-8 flex items-center gap-4">
          <User size={20} className="text-[#ebe22f]" /> Mapa Cultural
        </h3>
        <div className="flex flex-wrap gap-4 items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#ebe22f]/10 border border-[#ebe22f]/30 flex items-center justify-center text-[#ebe22f] font-black text-xl uppercase">
            {userProfile?.nome?.[0]}
          </div>
          <div>
            <p className="text-lg font-black uppercase italic text-white tracking-tighter">
              {userProfile?.nome}
            </p>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              {userProfile?.nucleo}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#ebe22f] flex items-center gap-2">
            <Award size={14} /> Expertises
          </h4>
          <div className="space-y-3">
            {expertises.map((exp, i) => (
              <input
                key={i}
                type="text"
                value={exp}
                onChange={(e) => setExpertise(i, e.target.value)}
                placeholder="Ex.: Produção audiovisual, Captação..."
                className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-[#ebe22f] outline-none placeholder:text-zinc-600"
              />
            ))}
            <button
              type="button"
              onClick={addExpertise}
              className="text-[10px] font-black text-[#ebe22f] uppercase tracking-widest hover:underline"
            >
              + Adicionar expertise
            </button>
          </div>

          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#ebe22f] mt-10 flex items-center gap-2">
            <Users size={14} /> Perfil Belbin
          </h4>
          <select
            value={belbin}
            onChange={(e) => setBelbin(e.target.value)}
            className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-[#ebe22f] outline-none"
          >
            <option value="">— Selecionar papel —</option>
            {BELBIN_ROLES.map((role) => (
              <option key={role} value={role} className="bg-zinc-900">
                {role}
              </option>
            ))}
          </select>
          {belbin && (
            <Badge variant="brand">{belbin}</Badge>
          )}
        </div>
      </section>
    </div>
  );
}
