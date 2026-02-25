/**
 * Hook para ler saldos reais do Google Sheets via Apps Script (URL configurável).
 * Retorna { saldos, loading, error, refetch }.
 * Configure VITE_FINANCEIRO_SCRIPT_URL no .env (ex.: https://script.google.com/macros/s/.../exec).
 */
import { useState, useEffect, useCallback } from "react";

const DEFAULT_URL = import.meta.env.VITE_FINANCEIRO_SCRIPT_URL || "";

export function useFinanceiro(scriptUrl = DEFAULT_URL) {
  const [saldos, setSaldos] = useState({
    rouanet: null,
    osf: null,
    pnab: null,
    saldoTotal: null,
  });
  const [loading, setLoading] = useState(!!scriptUrl);
  const [error, setError] = useState(null);

  const fetchSaldos = useCallback(async () => {
    if (!scriptUrl || !scriptUrl.startsWith("http")) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(scriptUrl, { mode: "cors" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const rouanet = data.rouanet != null ? Number(data.rouanet) : null;
      const osf = data.osf != null ? Number(data.osf) : null;
      const pnab = data.pnab != null ? Number(data.pnab) : null;
      setSaldos({
        rouanet,
        osf,
        pnab,
        saldoTotal:
          [rouanet, osf, pnab].every((n) => n != null)
            ? rouanet + osf + pnab
            : null,
      });
    } catch (e) {
      setError(e.message || "Falha ao carregar saldos");
      setSaldos({ rouanet: null, osf: null, pnab: null, saldoTotal: null });
    } finally {
      setLoading(false);
    }
  }, [scriptUrl]);

  useEffect(() => {
    fetchSaldos();
  }, [fetchSaldos]);

  return { saldos, loading, error, refetch: fetchSaldos };
}
