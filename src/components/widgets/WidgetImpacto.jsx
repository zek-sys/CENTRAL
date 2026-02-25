/**
 * Bloco de impacto do Meu Convés: Remadas, Compliance, Status Rouanet. Sem alteração visual.
 */
import React from "react";
import { Zap, ShieldCheck, DollarSign } from "lucide-react";
import StatCard from "./StatCard";

export default function WidgetImpacto({ remadasCount = 0 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
      <StatCard
        title="Remadas"
        value={remadasCount}
        color="text-[#ebe22f]"
        icon={Zap}
        detail="Ações Pendentes"
      />
      <StatCard
        title="Compliance"
        value="92%"
        color="text-green-500"
        icon={ShieldCheck}
        detail="Evidências IN 29"
      />
      <StatCard
        title="Status Rouanet"
        value="19%"
        color="text-[#db2669]"
        icon={DollarSign}
        detail="Captação Atual"
      />
    </div>
  );
}
