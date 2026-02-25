/**
 * Hub Financeiro — Simulador + Lançamentos. Visual preservado.
 */
import React from "react";
import SimuladorContratacao from "../components/financeiro/SimuladorContratacao";
import LancamentoFinanceiro from "../components/financeiro/LancamentoFinanceiro";

export default function FinanceiroHub({ userProfile }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-10 pb-20">
      <SimuladorContratacao />
      <LancamentoFinanceiro userProfile={userProfile} />
    </div>
  );
}
