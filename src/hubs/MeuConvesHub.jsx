/**
 * Hub Meu Convés — cockpit preservado (Remadas, Compliance, Status, Checklist, Cronograma).
 */
import React, { useMemo } from "react";
import { updateDoc, doc, Timestamp } from "firebase/firestore";
import { db, appId } from "../core/firebase";
import WidgetImpacto from "../components/widgets/WidgetImpacto";
import ChecklistTatico from "../components/widgets/ChecklistTatico";
import Cronograma from "../components/Cronograma";

export default function MeuConvesHub({ userProfile, userUid, acoes }) {
  const minhasRemadas = useMemo(() => {
    const base = acoes.filter((a) => {
      if (userProfile?.role === "admin") return true;
      const n = userProfile?.nucleo;
      if (n === "Comunicação") return a.nucleoComms?.trim();
      if (n === "Produção") return a.nucleoProd?.trim();
      if (n === "Financeiro") return a.nucleoFin?.trim();
      if (a.uidResponsavel && a.uidResponsavel === userUid) return true;
      return false;
    });
    return base.filter((a) => a.status !== "Concluído");
  }, [acoes, userProfile, userUid]);

  const handleConcluir = async (acao) => {
    await updateDoc(
      doc(db, "artifacts", appId, "public", "data", "acoes", acao.id),
      { status: "Concluído", updatedAt: Timestamp.now() }
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
      <WidgetImpacto remadasCount={minhasRemadas.length} />
      <ChecklistTatico itens={minhasRemadas} onConcluir={handleConcluir} />
      <Cronograma acoes={acoes} userUid={userUid} />
    </div>
  );
}
