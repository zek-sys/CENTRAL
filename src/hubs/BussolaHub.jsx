/**
 * Hub Bússola — dashboard estratégico. Visual cockpit preservado.
 */
import React from "react";
import { Map, Award, DollarSign, PieChart } from "lucide-react";
import StatCard from "../components/widgets/StatCard";

export default function BussolaHub() {
  return (
    <div className="animate-in fade-in duration-1000">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <StatCard title="Projetos" value="12" color="text-[#ebe22f]" icon={Map} detail="FROTA ATIVA" />
        <StatCard title="Atiçamento" value="74%" color="text-zinc-200" icon={Award} detail="IMPACTO SOCIAL" />
        <StatCard title="Financeiro" value="R$ 3M" color="text-green-500" icon={DollarSign} detail="VOLUME GERIDO" />
      </div>
      <div className="mt-16 bg-zinc-900/30 border border-white/5 p-16 rounded-[4rem] text-center opacity-30 italic flex flex-col items-center gap-6">
        <PieChart size={60} className="text-zinc-600" />
        <p className="text-[12px] font-black uppercase tracking-[0.6em]">Cartografia da Resistência em Integração...</p>
      </div>
    </div>
  );
}
