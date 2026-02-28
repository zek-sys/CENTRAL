/**
 * Portal do Agente (Atiçamento Resiliente) — Batidas do Rio.
 * Offline-First: Modo Econômico, Delta-Queue, Régua de Maturidade, ergonomia de toque, Mural de Ecos.
 * bg-black, Rosa Bregoso (interações), Amarelo Festival (progresso).
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  BookOpen,
  Music,
  Target,
  Send,
  Loader2,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  ClipboardList,
  Users,
  Link as LinkIcon,
  Zap,
  Mic,
} from "lucide-react";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, arrayUnion, Timestamp } from "firebase/firestore";
import { db, appId } from "../core/firebase";
import { ALUNOS_PATH } from "../hooks/useAlunosFormacao";
import { getAlunoAuth } from "../lib/alunoAuth";
import { useFormacoes } from "../hooks/useFormacoes";
import { useAlunosFormacao } from "../hooks/useAlunosFormacao";
import { isAcaoTipoD } from "../types/actions";
import GuiaDeBordoAccordion from "../components/pedagogico/GuiaDeBordoAccordion";
import {
  getPortalSyncQueue,
  addToPortalSyncQueue,
  removeFromPortalSyncQueue,
  getPortalSyncQueuePendingCount,
} from "../lib/portalAgenteSyncQueue";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

const ACORES_PATH = ["artifacts", appId, "public", "data", "acoes"];
const DEBOUNCE_CADERNO_MS = 600;
const PORTAL_MODO_ECONOMICO_KEY = "portal-agente-modo-economico";

const ROSA_BREGOSO = "#db2669";
const AMARELO_FESTIVAL = "#EBE22F";

/** Régua de Maturidade do Atiçamento (rubricas qualitativas) — sobe com Diário de Bordo e Missões. */
const MATURIDADE_NIVEIS = [
  { id: "semente", emoji: "🌱", label: "Semente" },
  { id: "broto", emoji: "🌿", label: "Broto" },
  { id: "fruto", emoji: "🌳", label: "Fruto" },
];

/** Deriva o nível atual: Facilitador regista absorção + entrega de missões (statusMaturidade no doc). */
function getNivelMaturidade(statusMaturidade, missaoEntregue) {
  if (statusMaturidade === "formado") return "fruto";
  if (statusMaturidade === "missoes_entregues" || missaoEntregue) return "broto";
  return "semente";
}

/** Minha Evolução — 4 estados fixos (campo statusMaturidade no doc do agente) — usado como fallback em detalhes. */
const EVOLUCAO_ESTADOS = [
  { id: "inscrito", label: "Inscrito" },
  { id: "frequente", label: "Frequente" },
  { id: "missoes_entregues", label: "Missões Entregues" },
  { id: "formado", label: "Formado" },
];

/** Posso Ajudar Com — tags de especialidades (array especialidades no doc do agente). */
const ESPECIALIDADES_OPCOES = [
  "Som e Cabos",
  "Ritmos Regionais",
  "Redes Sociais",
  "Produção",
  "Dança",
];

/** Sintonia com o Facilitador — 3 opções para o agente */
const EMOJI_SINTONIA = [
  { value: "incrivel", emoji: "🤩", label: "Incrível" },
  { value: "pensativo", emoji: "🤔", label: "Pensativo" },
  { value: "desconectado", emoji: "😴", label: "Desconectado" },
];

function GuiaDeBordoSection() {
  return <GuiaDeBordoAccordion defaultOpen={true} />;
}

/** Deriva lista de encontros de formacao.modulos ou formacao.cronograma (inclui linkPreAula e perguntaMicroMissao por encontro). */
function getEncontros(formacao) {
  if (formacao?.modulos?.length) return formacao.modulos;
  if (formacao?.cronograma?.length) {
    return formacao.cronograma.map((c) => ({
      id: c.id,
      titulo: c.titulo || "Encontro",
      cargaHoraria: c.cargaHoraria,
      linkPreAula: c.linkPreAula,
      perguntaMicroMissao: c.perguntaMicroMissao,
    }));
  }
  return [];
}

const ENCONTROS_TITULOS_PADRAO = [
  "O Som do Rio",
  "Batidas da Floresta",
  "Ritmo e Comunidade",
  "A Bacia Hidromusical",
  "Cadência em Grupo",
  "Percussão Viva",
];

export default function AreaDoAlunoPage({ formacaoId: formacaoIdProp }) {
  const { id: idFromParams } = useParams();
  const formacaoId = formacaoIdProp ?? idFromParams ?? null;
  const navigate = useNavigate();
  const { formacoes, loading } = useFormacoes();
  const formacao = formacaoId ? formacoes.find((f) => f.id === formacaoId && isAcaoTipoD(f)) : null;
  const { alunos: colegasTurma, loading: loadingColegas } = useAlunosFormacao(formacaoId || null);

  const encontros = getEncontros(formacao);
  const totalEncontros = encontros.length;
  const concluidos = formacao?.checklists?.filter((c) => c.concluido).length ?? 0;
  const [percentTermometro, setPercentTermometro] = useState(0);
  const [cofreOpen, setCofreOpen] = useState(true);
  const [expandedEncontroId, setExpandedEncontroId] = useState(null);

  const alunoAuth = getAlunoAuth();
  const [linkDigitado, setLinkDigitado] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [missaoEnviada, setMissaoEnviada] = useState(null);
  const [mostrarFormEditar, setMostrarFormEditar] = useState(false);
  const [carregandoMissao, setCarregandoMissao] = useState(!!alunoAuth?.alunoId);

  const [diarioBordo, setDiarioBordo] = useState({});
  const [salvandoDiario, setSalvandoDiario] = useState(null);
  const [toast, setToast] = useState(null);

  /** Meu Caderno: texto salvo em cadernoVirtual do documento do aluno (debounce). */
  const [cadernoVirtual, setCadernoVirtual] = useState("");
  const cadernoDebounceRef = useRef(null);
  const cadernoDirtyRef = useRef(false);

  /** Minhas Missões: tarefas Nível 4 onde responsavelId === aluno e projetoId === formacaoId */
  const [minhasMissoes, setMinhasMissoes] = useState([]);
  const [loadingMissoes, setLoadingMissoes] = useState(false);

  /** Dúvida ao Facilitador: texto e envio para duvidasPendentes da formação */
  const [duvidaTexto, setDuvidaTexto] = useState("");
  const [enviandoDuvida, setEnviandoDuvida] = useState(false);

  /** Minha Evolução: lido do doc do agente (statusMaturidade). */
  const [statusMaturidade, setStatusMaturidade] = useState("inscrito");
  /** Posso Ajudar Com: array de tags (especialidades) no doc do agente. */
  const [especialidades, setEspecialidades] = useState([]);
  const especialidadesDirtyRef = useRef(false);

  /** Links da Turma: partilhar link (envio para formacao.linksTurma). */
  const [linkPartilhar, setLinkPartilhar] = useState("");
  const [enviandoLink, setEnviandoLink] = useState(false);

  /** Modo Econômico (text-first): persistido em localStorage */
  const [modoEconomico, setModoEconomico] = useState(() => {
    try {
      return localStorage.getItem(PORTAL_MODO_ECONOMICO_KEY) === "true";
    } catch {
      return false;
    }
  });

  /** Inteligência de Sincronização: estado e fila pendente */
  const [syncStatus, setSyncStatus] = useState("sincronizado");
  const [pendingCount, setPendingCount] = useState(0);
  const flushRef = useRef(null);

  /** Relato oral (Speech-to-Text) — Meu Caderno */
  const onCadernoResult = useCallback((chunk) => {
    cadernoDirtyRef.current = true;
    setCadernoVirtual((prev) => prev + chunk);
  }, []);
  const {
    isSupported: speechSupported,
    isListening: cadernoListening,
    toggle: toggleCadernoSpeech,
  } = useSpeechRecognition({
    onResult: onCadernoResult,
    onError: (msg) => {
      setToast("Erro: " + (msg || "microfone"));
      setTimeout(() => setToast(null), 4000);
    },
  });
  useEffect(() => {
    if (!cadernoListening) return;
    setToast("Microfone ativado. Fale agora para transcrever seu relato.");
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [cadernoListening]);

  /** Persistir Modo Econômico no localStorage */
  useEffect(() => {
    try {
      localStorage.setItem(PORTAL_MODO_ECONOMICO_KEY, modoEconomico ? "true" : "false");
    } catch (_) {}
  }, [modoEconomico]);

  /** Formação com isLowDataDefault: aplicar modo econômico por padrão quando não há preferência guardada */
  useEffect(() => {
    if (!formacao?.isLowDataDefault) return;
    try {
      if (localStorage.getItem(PORTAL_MODO_ECONOMICO_KEY) === null) setModoEconomico(true);
    } catch (_) {}
  }, [formacao?.isLowDataDefault]);

  /** Atualizar indicador de fila e estado de conexão */
  const refreshSyncState = useCallback(() => {
    const n = getPortalSyncQueuePendingCount();
    setPendingCount(n);
    if (!navigator.onLine) {
      setSyncStatus("guardado_celular");
    } else if (n > 0) {
      setSyncStatus("guardado_celular");
    } else {
      setSyncStatus("sincronizado");
    }
  }, []);

  useEffect(() => {
    refreshSyncState();
    const interval = setInterval(refreshSyncState, 2000);
    return () => clearInterval(interval);
  }, [refreshSyncState]);

  /** Flush da fila ao voltar online */
  const flushPortalQueue = useCallback(async () => {
    if (!navigator.onLine) return;
    const queue = getPortalSyncQueue();
    if (queue.length === 0) return;
    for (const item of queue) {
      try {
        if (item.type === "caderno" && item.payload?.alunoId) {
          const ref = doc(db, ...ALUNOS_PATH, item.payload.alunoId);
          await updateDoc(ref, { cadernoVirtual: item.payload.cadernoVirtual ?? "" });
        } else if (item.type === "diario" && item.payload?.alunoId) {
          const refAluno = doc(db, ...ALUNOS_PATH, item.payload.alunoId);
          await updateDoc(refAluno, { diarioBordo: item.payload.diarioBordo });
          if (item.payload.postarNoMural && item.payload.formacaoId) {
            const refFormacao = doc(db, ...ACORES_PATH, item.payload.formacaoId);
            const m = item.payload.muralItem;
            await updateDoc(refFormacao, {
              muralTurma: arrayUnion({
                alunoId: m.alunoId,
                alunoNome: m.alunoNome,
                moduloId: m.moduloId,
                texto: m.texto,
                createdAt: Timestamp.fromMillis(m.createdAt || Date.now()),
              }),
            });
          }
        } else if (item.type === "duvida" && item.payload?.formacaoId) {
          const ref = doc(db, ...ACORES_PATH, item.payload.formacaoId);
          const d = item.payload.duvida;
          await updateDoc(ref, {
            duvidasPendentes: arrayUnion({
              texto: d.texto,
              alunoId: d.alunoId,
              alunoNome: d.alunoNome,
              createdAt: Timestamp.fromMillis(d.createdAt || Date.now()),
            }),
          });
        } else if (item.type === "link" && item.payload?.formacaoId) {
          const ref = doc(db, ...ACORES_PATH, item.payload.formacaoId);
          const l = item.payload.linkItem;
          await updateDoc(ref, {
            linksTurma: arrayUnion({
              url: l.url,
              alunoId: l.alunoId,
              alunoNome: l.alunoNome,
              createdAt: Timestamp.fromMillis(l.createdAt || Date.now()),
            }),
          });
        } else if (item.type === "missao" && item.payload?.alunoId) {
          const ref = doc(db, ...ALUNOS_PATH, item.payload.alunoId);
          await updateDoc(ref, { missaoEntregueLink: item.payload.missaoEntregueLink, missaoStatus: "enviada" });
        } else if (item.type === "anexar_prova" && item.payload?.tarefaId) {
          const ref = doc(db, ...ACORES_PATH, item.payload.tarefaId);
          await updateDoc(ref, { linkProva: item.payload.linkProva });
        } else if (item.type === "especialidades" && item.payload?.alunoId) {
          const ref = doc(db, ...ALUNOS_PATH, item.payload.alunoId);
          await updateDoc(ref, { especialidades: item.payload.especialidades });
        }
        removeFromPortalSyncQueue(item.id);
      } catch (e) {
        console.warn("Portal sync flush item failed:", item.id, e);
      }
    }
    refreshSyncState();
  }, [refreshSyncState]);

  useEffect(() => {
    flushRef.current = flushPortalQueue;
  }, [flushPortalQueue]);

  useEffect(() => {
    const onOnline = () => {
      if (flushRef.current) flushRef.current();
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  useEffect(() => {
    if (!alunoAuth?.alunoId) {
      setCarregandoMissao(false);
      return;
    }
    const ref = doc(db, ...ALUNOS_PATH, alunoAuth.alunoId);
    getDoc(ref)
      .then((snap) => {
        if (!snap.exists()) {
          setCarregandoMissao(false);
          return;
        }
        const d = snap.data();
        if (d.missaoStatus === "enviada" && d.missaoEntregueLink) {
          setMissaoEnviada({ link: d.missaoEntregueLink });
        }
        if (d.diarioBordo && typeof d.diarioBordo === "object") {
          setDiarioBordo(d.diarioBordo);
        }
        if (typeof d.cadernoVirtual === "string") {
          setCadernoVirtual(d.cadernoVirtual);
        }
        setStatusMaturidade(typeof d.statusMaturidade === "string" ? d.statusMaturidade : "inscrito");
        setEspecialidades(Array.isArray(d.especialidades) ? d.especialidades : []);
        cadernoDirtyRef.current = false;
      })
      .catch(() => {})
      .finally(() => setCarregandoMissao(false));
  }, [alunoAuth?.alunoId]);

  /** VU Meter: % baseada em presença da formação (checklists) ou, se agente logado, em diário + missão */
  useEffect(() => {
    if (totalEncontros === 0) {
      setPercentTermometro(0);
      return;
    }
    if (alunoAuth?.alunoId) {
      const entradasDiario = Object.keys(diarioBordo).length;
      const temMissao = Boolean(missaoEnviada?.link);
      const completados = Math.min(entradasDiario + (temMissao ? 1 : 0), totalEncontros);
      setPercentTermometro(Math.round((completados / totalEncontros) * 100));
    } else {
      setPercentTermometro(Math.round((concluidos / totalEncontros) * 100));
    }
  }, [totalEncontros, concluidos, alunoAuth?.alunoId, diarioBordo, missaoEnviada]);

  /** Carrega Minhas Missões: acoes onde responsavelId === aluno e projetoId === formacaoId */
  useEffect(() => {
    if (!alunoAuth?.alunoId || !formacaoId) {
      setMinhasMissoes([]);
      return;
    }
    setLoadingMissoes(true);
    const colRef = collection(db, ...ACORES_PATH);
    const q = query(
      colRef,
      where("responsavelId", "==", alunoAuth.alunoId),
      where("projetoId", "==", formacaoId)
    );
    getDocs(q)
      .then((snap) => {
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setMinhasMissoes(list);
      })
      .catch(() => setMinhasMissoes([]))
      .finally(() => setLoadingMissoes(false));
  }, [alunoAuth?.alunoId, formacaoId]);

  /** Salvamento automático (debounce) do caderno virtual — enfileira se offline/falha */
  useEffect(() => {
    if (!alunoAuth?.alunoId || !cadernoDirtyRef.current) return;
    if (cadernoDebounceRef.current) clearTimeout(cadernoDebounceRef.current);
    cadernoDebounceRef.current = setTimeout(() => {
      const doSave = () => {
        const ref = doc(db, ...ALUNOS_PATH, alunoAuth.alunoId);
        return updateDoc(ref, { cadernoVirtual: cadernoVirtual }).then(() => {
          cadernoDirtyRef.current = false;
        });
      };
      if (!navigator.onLine) {
        addToPortalSyncQueue({
          type: "caderno",
          payload: { alunoId: alunoAuth.alunoId, cadernoVirtual },
        });
        cadernoDirtyRef.current = false;
        refreshSyncState();
      } else {
        doSave().catch(() => {
          addToPortalSyncQueue({
            type: "caderno",
            payload: { alunoId: alunoAuth.alunoId, cadernoVirtual },
          });
          refreshSyncState();
        });
      }
      cadernoDebounceRef.current = null;
    }, DEBOUNCE_CADERNO_MS);
    return () => {
      if (cadernoDebounceRef.current) clearTimeout(cadernoDebounceRef.current);
    };
  }, [cadernoVirtual, alunoAuth?.alunoId, refreshSyncState]);

  const handleEnviarDuvida = async () => {
    const texto = (duvidaTexto || "").trim();
    if (!texto || !formacaoId || !alunoAuth?.alunoId) return;
    setEnviandoDuvida(true);
    const duvidaPayload = {
      texto,
      alunoId: alunoAuth.alunoId,
      alunoNome: alunoAuth.nomeArtistico || "Agente cultural",
      createdAt: Date.now(),
    };
    try {
      if (!navigator.onLine) {
        addToPortalSyncQueue({ type: "duvida", payload: { formacaoId, duvida: duvidaPayload } });
        refreshSyncState();
        setDuvidaTexto("");
        setToast("Guardado no celular. Será enviado quando houver conexão.");
        setTimeout(() => setToast(null), 3000);
        return;
      }
      const ref = doc(db, ...ACORES_PATH, formacaoId);
      await updateDoc(ref, {
        duvidasPendentes: arrayUnion({
          ...duvidaPayload,
          createdAt: Timestamp.now(),
        }),
      });
      setDuvidaTexto("");
      setToast("Dúvida enviada ao facilitador!");
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error("Erro ao enviar dúvida:", err);
      addToPortalSyncQueue({ type: "duvida", payload: { formacaoId, duvida: { ...duvidaPayload, createdAt: Date.now() } } });
      refreshSyncState();
      setToast("Guardado no celular. Será enviado quando houver conexão.");
      setTimeout(() => setToast(null), 3000);
    } finally {
      setEnviandoDuvida(false);
    }
  };

  const handleAnexarProva = async (tarefaId, linkProva) => {
    if (!linkProva?.trim()) return;
    const payload = { tarefaId, linkProva: linkProva.trim() };
    try {
      if (!navigator.onLine) {
        addToPortalSyncQueue({ type: "anexar_prova", payload });
        refreshSyncState();
        setMinhasMissoes((prev) =>
          prev.map((t) => (t.id === tarefaId ? { ...t, linkProva: linkProva.trim() } : t))
        );
        setToast("Guardado no celular. Será enviado quando houver conexão.");
        setTimeout(() => setToast(null), 2500);
        return;
      }
      const ref = doc(db, ...ACORES_PATH, tarefaId);
      await updateDoc(ref, { linkProva: payload.linkProva });
      setMinhasMissoes((prev) =>
        prev.map((t) => (t.id === tarefaId ? { ...t, linkProva: linkProva.trim() } : t))
      );
      setToast("Link de prova anexado!");
      setTimeout(() => setToast(null), 2500);
    } catch (err) {
      console.error("Erro ao anexar prova:", err);
      addToPortalSyncQueue({ type: "anexar_prova", payload });
      refreshSyncState();
      setToast("Guardado no celular. Será enviado quando houver conexão.");
      setTimeout(() => setToast(null), 2500);
    }
  };

  const handleEnviarMissao = async () => {
    const url = linkDigitado.trim();
    if (!url || !alunoAuth?.alunoId) return;
    setEnviando(true);
    const payload = { alunoId: alunoAuth.alunoId, missaoEntregueLink: url };
    try {
      if (!navigator.onLine) {
        addToPortalSyncQueue({ type: "missao", payload });
        refreshSyncState();
        setMissaoEnviada({ link: url });
        setLinkDigitado("");
        setMostrarFormEditar(false);
        setToast("Guardado no celular. Será enviado quando houver conexão.");
        setTimeout(() => setToast(null), 3000);
        return;
      }
      const ref = doc(db, ...ALUNOS_PATH, alunoAuth.alunoId);
      await updateDoc(ref, { missaoEntregueLink: url, missaoStatus: "enviada" });
      setMissaoEnviada({ link: url });
      setLinkDigitado("");
      setMostrarFormEditar(false);
    } catch (err) {
      console.error("Erro ao enviar missão:", err);
      addToPortalSyncQueue({ type: "missao", payload });
      refreshSyncState();
      setToast("Guardado no celular. Será enviado quando houver conexão.");
      setTimeout(() => setToast(null), 3000);
    } finally {
      setEnviando(false);
    }
  };

  const handlePartilharLink = async () => {
    const url = (linkPartilhar || "").trim();
    if (!url || !formacaoId || !alunoAuth?.alunoId) return;
    setEnviandoLink(true);
    const linkItem = {
      url,
      alunoId: alunoAuth.alunoId,
      alunoNome: alunoAuth.nomeArtistico || "Agente cultural",
      createdAt: Date.now(),
    };
    try {
      if (!navigator.onLine) {
        addToPortalSyncQueue({ type: "link", payload: { formacaoId, linkItem } });
        refreshSyncState();
        setLinkPartilhar("");
        setToast("Guardado no celular. Será partilhado quando houver conexão.");
        setTimeout(() => setToast(null), 2500);
        return;
      }
      const refFormacao = doc(db, ...ACORES_PATH, formacaoId);
      await updateDoc(refFormacao, {
        linksTurma: arrayUnion({
          ...linkItem,
          createdAt: Timestamp.now(),
        }),
      });
      setLinkPartilhar("");
      setToast("Link partilhado na turma!");
      setTimeout(() => setToast(null), 2500);
    } catch (err) {
      console.error("Erro ao partilhar link:", err);
      addToPortalSyncQueue({ type: "link", payload: { formacaoId, linkItem } });
      refreshSyncState();
      setToast("Guardado no celular. Será partilhado quando houver conexão.");
      setTimeout(() => setToast(null), 3000);
    } finally {
      setEnviandoLink(false);
    }
  };

  const handleToggleEspecialidade = useCallback((tag) => {
    setEspecialidades((prev) => {
      const next = prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag];
      especialidadesDirtyRef.current = true;
      return next;
    });
  }, []);

  useEffect(() => {
    if (!alunoAuth?.alunoId || !especialidadesDirtyRef.current) return;
    const ref = doc(db, ...ALUNOS_PATH, alunoAuth.alunoId);
    const payload = { alunoId: alunoAuth.alunoId, especialidades };
    if (!navigator.onLine) {
      addToPortalSyncQueue({ type: "especialidades", payload });
      especialidadesDirtyRef.current = false;
      refreshSyncState();
      return;
    }
    updateDoc(ref, { especialidades })
      .then(() => {
        especialidadesDirtyRef.current = false;
      })
      .catch(() => {
        addToPortalSyncQueue({ type: "especialidades", payload });
        refreshSyncState();
      });
  }, [especialidades, alunoAuth?.alunoId, refreshSyncState]);

  const handleGuardarDiario = useCallback(
    async (moduloId, reflexao, avaliacaoFacilitador, postarNoMural = false) => {
      if (!alunoAuth?.alunoId) return;
      setSalvandoDiario(moduloId);
      setToast(null);
      const novoDiario = {
        ...diarioBordo,
        [moduloId]: {
          reflexao: reflexao.trim() || "",
          avaliacaoFacilitador: avaliacaoFacilitador || null,
        },
      };
      const muralItem =
        postarNoMural && reflexao.trim() && formacaoId
          ? {
              alunoId: alunoAuth.alunoId,
              alunoNome: alunoAuth.nomeArtistico || "Agente cultural",
              moduloId: String(moduloId),
              texto: reflexao.trim(),
              createdAt: Date.now(),
            }
          : null;

      try {
        if (!navigator.onLine) {
          addToPortalSyncQueue({
            type: "diario",
            payload: {
              alunoId: alunoAuth.alunoId,
              diarioBordo: novoDiario,
              postarNoMural: Boolean(muralItem),
              formacaoId: formacaoId || null,
              muralItem,
            },
          });
          refreshSyncState();
          setDiarioBordo(novoDiario);
          setToast("Guardado no celular. Será sincronizado quando houver conexão.");
          setTimeout(() => setToast(null), 3000);
          return;
        }

        const refAluno = doc(db, ...ALUNOS_PATH, alunoAuth.alunoId);
        await updateDoc(refAluno, { diarioBordo: novoDiario });
        setDiarioBordo(novoDiario);

        if (muralItem && formacaoId) {
          const refFormacao = doc(db, ...ACORES_PATH, formacaoId);
          await updateDoc(refFormacao, {
            muralTurma: arrayUnion({
              ...muralItem,
              createdAt: Timestamp.now(),
            }),
          });
        }

        setToast("Reflexão guardada!");
        setTimeout(() => setToast(null), 3000);
      } catch (err) {
        console.error("Erro ao guardar diário:", err);
        addToPortalSyncQueue({
          type: "diario",
          payload: {
            alunoId: alunoAuth.alunoId,
            diarioBordo: novoDiario,
            postarNoMural: Boolean(muralItem),
            formacaoId: formacaoId || null,
            muralItem,
          },
        });
        refreshSyncState();
        setToast("Guardado no celular. Será sincronizado quando houver conexão.");
        setTimeout(() => setToast(null), 3000);
      } finally {
        setSalvandoDiario(null);
      }
    },
    [alunoAuth?.alunoId, alunoAuth?.nomeArtistico, diarioBordo, formacaoId, refreshSyncState]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-zinc-50">
        A carregar…
      </div>
    );
  }

  if (formacaoId && !formacao) {
    return (
      <div className="min-h-screen bg-black text-zinc-50 p-6">
        <p className="text-zinc-500">Formação não encontrada.</p>
        <button
          type="button"
          onClick={() => navigate("/nucleo-pedagogico")}
          className="mt-4 text-pink-500 hover:underline"
        >
          Voltar
        </button>
      </div>
    );
  }

  const linkCaderno = formacao?.linkMateriaisDidaticos ?? null;
  /** Link de preparação global (fallback) ou por encontro — preferir por encontro quando existir */
  const getLinkPreAula = (encontro) => encontro?.linkPreAula ?? formacao?.linkPreAula ?? null;

  return (
    <div className={`min-h-screen bg-black text-zinc-300 pb-24 ${modoEconomico ? "portal-modo-economico" : ""}`}>
      <header className="sticky top-0 z-10 bg-black border-b border-zinc-800/80">
        <div className="flex items-center gap-3 p-4">
          <button
            type="button"
            onClick={() => (formacaoId ? navigate(`/nucleo-pedagogico/${formacaoId}`) : navigate("/nucleo-pedagogico"))}
            className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold truncate text-zinc-100" style={{ color: ROSA_BREGOSO }}>
              Portal do Agente
            </h1>
            <p className="text-xs text-zinc-400">{formacao?.titulo ?? "Trilha de aprendizagem"}</p>
          </div>
        </div>
        {/* Modo Econômico + Indicador de Sincronização */}
        <div className="flex items-center justify-between gap-3 px-4 pb-3 flex-wrap">
          <label className="flex items-center gap-2 min-h-[48px] cursor-pointer select-none">
            <span className="text-sm text-zinc-300">⚡ Modo Econômico</span>
            <button
              type="button"
              role="switch"
              aria-checked={modoEconomico}
              onClick={() => setModoEconomico((v) => !v)}
              className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 transition-colors ${modoEconomico ? "border-[#EBE22F] bg-[#EBE22F]/20" : "border-zinc-600 bg-zinc-800"}`}
              style={{ minWidth: 48, minHeight: 48 }}
            >
              <span
                className={`absolute top-1 inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${modoEconomico ? "translate-x-6" : "translate-x-1"}`}
                aria-hidden
              />
            </button>
          </label>
          <span
            className={`text-sm font-medium min-h-[48px] flex items-center ${
              syncStatus === "sincronizado" ? "text-emerald-400" : "text-[#EBE22F]"
            }`}
            title={pendingCount > 0 ? `${pendingCount} pendente(s) no celular` : "Tudo sincronizado"}
          >
            {syncStatus === "sincronizado" ? "☁️ Sincronizado" : "💾 Guardado no celular"}
            {pendingCount > 0 && (
              <span className="ml-1 text-zinc-400 font-normal">({pendingCount})</span>
            )}
          </span>
        </div>
        <div className="px-4 pb-3">
          {formacao?.modeloAvaliacao === "tradicional" ? (
            <>
              <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Minha Evolução</p>
              <div className="flex items-center gap-1">
                {EVOLUCAO_ESTADOS.map((estado, idx) => {
                  const ativo = statusMaturidade === estado.id;
                  const indiceAtual = EVOLUCAO_ESTADOS.findIndex((e) => e.id === statusMaturidade);
                  const preenchido = idx <= indiceAtual;
                  return (
                    <div key={estado.id} className="flex-1 min-w-0 flex flex-col items-center gap-1" title={estado.label}>
                      <div
                        className="h-2 w-full rounded-full transition-colors"
                        style={{ backgroundColor: preenchido ? (ativo ? AMARELO_FESTIVAL : "rgba(235, 226, 47, 0.5)") : "rgb(39 39 42)" }}
                      />
                      <span className={`text-[10px] font-medium truncate w-full text-center ${preenchido ? "text-zinc-200" : "text-zinc-500"}`}>{estado.label}</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Régua de Maturidade do Atiçamento</p>
              <div className="flex items-center gap-2">
                {MATURIDADE_NIVEIS.map((nivel) => {
                  const nivelAtual = getNivelMaturidade(statusMaturidade, Boolean(missaoEnviada?.link));
                  const ativo = nivel.id === nivelAtual;
                  const indiceAtual = MATURIDADE_NIVEIS.findIndex((n) => n.id === nivelAtual);
                  const indiceNivel = MATURIDADE_NIVEIS.findIndex((n) => n.id === nivel.id);
                  const desbloqueado = indiceNivel <= indiceAtual;
                  return (
                    <div
                      key={nivel.id}
                      className={`flex-1 min-w-0 flex flex-col items-center gap-1.5 p-2 rounded-xl border min-h-[48px] justify-center ${
                        ativo ? "border-[#EBE22F] bg-[#EBE22F]/10" : desbloqueado ? "border-zinc-600 bg-zinc-800/60" : "border-zinc-800 bg-zinc-900/40"
                      }`}
                      title={nivel.label}
                    >
                      <span className="text-xl" aria-hidden>{nivel.emoji}</span>
                      <span className={`text-xs font-medium truncate w-full text-center ${ativo ? "text-[#EBE22F]" : desbloqueado ? "text-zinc-200" : "text-zinc-500"}`}>{nivel.label}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </header>

      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6 text-zinc-200">
        <section aria-labelledby="guia-bordo-title">
          <h2 id="guia-bordo-title" className="sr-only">Guia de Bordo — Preparação</h2>
          <GuiaDeBordoSection />
        </section>

        {alunoAuth?.alunoId && (
          <>
            {/* Meu Caderno — textarea com salvamento automático (cadernoVirtual) + Relato Oral */}
            <section aria-labelledby="meu-caderno-title" className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden border-l-4" style={{ borderLeftColor: ROSA_BREGOSO }}>
              <h2 id="meu-caderno-title" className="text-sm font-semibold text-zinc-400 uppercase tracking-wider p-4 pb-2 flex items-center gap-2" style={{ color: ROSA_BREGOSO }}>
                <BookOpen size={18} />
                Meu Caderno
              </h2>
              <div className="p-4 pt-0">
                <div className="relative">
                  <textarea
                    value={cadernoVirtual}
                    onChange={(e) => {
                      cadernoDirtyRef.current = true;
                      setCadernoVirtual(e.target.value);
                    }}
                    placeholder="Tuas anotações da formação (guardadas automaticamente)…"
                    rows={5}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-3 pr-14 pb-14 text-zinc-50 placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 resize-y"
                  />
                  {speechSupported && (
                    <button
                      type="button"
                      onClick={toggleCadernoSpeech}
                      className={`absolute bottom-3 right-3 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-[#db2669] ${cadernoListening ? "relato-oral-pulse border-[#db2669] bg-[#db2669]/20 text-[#db2669]" : "border-zinc-600 bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"}`}
                      aria-label={cadernoListening ? "Parar gravação de voz" : "Relato por voz — transcrever fala para texto"}
                      title={cadernoListening ? "Parar gravação" : "Ativar microfone para transcrever"}
                    >
                      <Mic size={24} aria-hidden />
                    </button>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mt-2">Salvamento automático ao parar de escrever.</p>
              </div>
            </section>

            {/* Minhas Missões — tarefas Nível 4 do agente nesta formação */}
            <section aria-labelledby="minhas-missoes-title" className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden border-l-4" style={{ borderLeftColor: ROSA_BREGOSO }}>
              <h2 id="minhas-missoes-title" className="text-sm font-semibold text-zinc-400 uppercase tracking-wider p-4 pb-2 flex items-center gap-2" style={{ color: ROSA_BREGOSO }}>
                <ClipboardList size={18} />
                Minhas Missões
              </h2>
              <div className="p-4 pt-0">
                {loadingMissoes ? (
                  <p className="text-sm text-zinc-500 flex items-center gap-2">
                    <Loader2 size={18} className="animate-spin" /> A carregar…
                  </p>
                ) : minhasMissoes.length === 0 ? (
                  <p className="text-sm text-zinc-500">Nenhuma missão atribuída a ti nesta formação.</p>
                ) : (
                  <ul className="space-y-3">
                    {minhasMissoes.map((t) => (
                      <li key={t.id} className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-3 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium text-zinc-100">{t.titulo || "Sem título"}</span>
                          <span className="text-xs px-2 py-1 rounded-lg bg-zinc-700 text-zinc-400 capitalize">{t.status || "pendente"}</span>
                        </div>
                        {t.descricao && <p className="text-sm text-zinc-500 line-clamp-2">{t.descricao}</p>}
                        <div>
                          <label className="block text-xs font-medium text-zinc-500 mb-1">Link de prova (opcional)</label>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              defaultValue={t.linkProva ?? ""}
                              placeholder="https://drive.google.com/..."
                              className="flex-1 min-h-[48px] rounded-lg border border-zinc-600 bg-zinc-800 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                              onBlur={(e) => {
                                const v = e.target.value.trim();
                                if (v && v !== (t.linkProva || "")) handleAnexarProva(t.id, v);
                              }}
                            />
                            {t.linkProva && (
                              <a href={t.linkProva} target="_blank" rel="noopener noreferrer" className="shrink-0 flex items-center gap-1 text-xs" style={{ color: ROSA_BREGOSO }}>
                                <ExternalLink size={14} /> Abrir
                              </a>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            {/* Dúvida ao Facilitador — envia para duvidasPendentes da formação */}
            <section aria-labelledby="duvida-facilitador-title" className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden border-l-4" style={{ borderLeftColor: ROSA_BREGOSO }}>
              <h2 id="duvida-facilitador-title" className="text-sm font-semibold text-zinc-400 uppercase tracking-wider p-4 pb-2 flex items-center gap-2" style={{ color: ROSA_BREGOSO }}>
                <HelpCircle size={18} />
                Dúvida ao Facilitador
              </h2>
              <div className="p-4 pt-0 space-y-3">
                <textarea
                  value={duvidaTexto}
                  onChange={(e) => setDuvidaTexto(e.target.value)}
                  placeholder="Escreve aqui a tua dúvida. O facilitador verá na área Minhas Turmas."
                  rows={3}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-3 text-zinc-50 placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 resize-y"
                  disabled={enviandoDuvida}
                />
                <button
                  type="button"
                  onClick={handleEnviarDuvida}
                  disabled={enviandoDuvida || !duvidaTexto.trim()}
                  className="w-full min-h-[48px] rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors text-white"
                  style={{ backgroundColor: ROSA_BREGOSO }}
                >
                  {enviandoDuvida ? <><Loader2 size={18} className="animate-spin" /> A enviar…</> : <><Send size={18} /> Enviar dúvida</>}
                </button>
              </div>
            </section>
          </>
        )}

        {totalEncontros > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Target size={16} style={{ color: ROSA_BREGOSO }} />
              Trilha de Encontros
            </h2>
            <ul className="relative space-y-0">
              {encontros.map((m, i) => {
                const ordem = i + 1;
                const tituloEncontro = m.titulo?.trim() || ENCONTROS_TITULOS_PADRAO[i % ENCONTROS_TITULOS_PADRAO.length];
                const isUltimo = i === totalEncontros - 1;
                const isExpanded = expandedEncontroId === (m.id || i);
                const mostraDiario = !isUltimo && alunoAuth;
                const mostraMissaoFinal = isUltimo && alunoAuth;
                const diarioAtual = diarioBordo[m.id || String(i)] ?? {};
                const temReflexaoOuAvaliacao = diarioAtual.reflexao || diarioAtual.avaliacaoFacilitador;

                return (
                  <li
                    key={m.id || i}
                    className="relative flex gap-3"
                  >
                    <div
                      className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-zinc-700/80"
                      style={{ display: i === totalEncontros - 1 ? "none" : undefined }}
                      aria-hidden
                    />
                    <div
                      className="shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold bg-black z-10"
                      style={{ borderColor: ROSA_BREGOSO, color: ROSA_BREGOSO }}
                    >
                      {ordem}
                    </div>
                    <div className="flex-1 min-w-0 pb-4">
                      <div
                        className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden border-l-4"
                        style={{ borderLeftColor: ROSA_BREGOSO }}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedEncontroId(isExpanded ? null : (m.id || i))}
                          className="w-full min-h-[52px] p-4 flex items-center justify-between gap-3 text-left"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-zinc-50">
                              {ordem}º Encontro: {tituloEncontro}
                            </p>
                            {m.cargaHoraria != null && (
                              <p className="text-xs text-zinc-500 mt-0.5">{m.cargaHoraria}h</p>
                            )}
                          </div>
                          {isExpanded ? (
                            <ChevronUp size={20} className="text-zinc-500 shrink-0" />
                          ) : (
                            <ChevronDown size={20} className="text-zinc-500 shrink-0" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="border-t border-zinc-800/80 p-4 space-y-4 bg-zinc-800/20">
                            {getLinkPreAula(m) && (
                              <div>
                                <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">🎯 Preparação</p>
                                <a
                                  href={getLinkPreAula(m)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 min-h-[48px] min-w-[48px] px-3 py-2 rounded-xl border border-zinc-600/80 bg-zinc-800/50 text-zinc-200 text-sm font-medium hover:bg-zinc-800/80 hover:text-zinc-100 transition-colors"
                                >
                                  <Music size={18} className="shrink-0 opacity-80" />
                                  Ouvir Podcast Afluentes
                                  <ExternalLink size={14} className="shrink-0 opacity-60" />
                                </a>
                              </div>
                            )}
                            {linkCaderno && (
                              <div>
                                <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">📚 Material do Encontro</p>
                                <a
                                  href={linkCaderno}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-3 w-full min-h-[48px] rounded-xl border px-4 py-3 text-zinc-50 font-medium hover:bg-zinc-800/80 transition-colors"
                                  style={{ borderColor: `${ROSA_BREGOSO}66`, backgroundColor: "rgba(0,0,0,0.2)" }}
                                >
                                  <BookOpen size={22} className="shrink-0" style={{ color: ROSA_BREGOSO }} />
                                  Caderno de Saberes
                                  <ExternalLink size={18} className="shrink-0 text-zinc-500 ml-auto" />
                                </a>
                              </div>
                            )}

                            {mostraDiario && (
                              <MeuDiarioDeBordo
                                moduloId={m.id || String(i)}
                                diarioAtual={diarioAtual}
                                onSave={handleGuardarDiario}
                                salvando={salvandoDiario === (m.id || i)}
                                amareloFestival={AMARELO_FESTIVAL}
                                perguntaMicroMissao={m.perguntaMicroMissao}
                                onListeningStart={() => {
                                  setToast("Microfone ativado. Fale agora para transcrever seu relato.");
                                  setTimeout(() => setToast(null), 4000);
                                }}
                                onSpeechError={(msg) => {
                                  setToast("Erro: " + (msg || "microfone"));
                                  setTimeout(() => setToast(null), 4000);
                                }}
                              />
                            )}

                            {mostraMissaoFinal && (
                              <div className="border-t border-zinc-700/80 pt-4">
                                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                                  Missão Final (Trava de Provas)
                                </p>
                                {carregandoMissao ? (
                                  <p className="text-sm text-zinc-500">A carregar…</p>
                                ) : missaoEnviada && !mostrarFormEditar ? (
                                  <div className="rounded-xl border-2 border-emerald-500/60 bg-emerald-950/30 p-3 space-y-2">
                                    <p className="font-medium text-emerald-400 text-sm">✅ Missão Enviada! A tua entrega está no nosso radar.</p>
                                    <p className="text-xs text-zinc-400 break-all">{missaoEnviada.link}</p>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <a href={missaoEnviada.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs hover:underline" style={{ color: AMARELO_FESTIVAL }}>
                                        <ExternalLink size={12} /> Abrir link
                                      </a>
                                      <button type="button" onClick={() => setMostrarFormEditar(true)} className="text-xs text-zinc-400 hover:text-zinc-50 underline">
                                        Editar entrega
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    <input
                                      type="url"
                                      value={linkDigitado}
                                      onChange={(e) => setLinkDigitado(e.target.value)}
                                      placeholder="Cola aqui o link do Google Drive da tua entrega"
                                      className="w-full min-h-[44px] rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-zinc-50 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                                      disabled={enviando}
                                    />
                                    <button
                                      type="button"
                                      onClick={handleEnviarMissao}
                                      disabled={enviando || !linkDigitado.trim()}
                                      className="w-full min-h-[48px] rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                                      style={{ backgroundColor: ROSA_BREGOSO }}
                                    >
                                      {enviando ? <><Loader2 size={18} className="animate-spin" /> A enviar…</> : <><Send size={18} /> ENVIAR MISSÃO</>}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Mural de Ecos (Inteligência Coletiva) — reflexões partilhadas pelos colegas */}
        {alunoAuth?.alunoId && (
          <section aria-labelledby="mural-turma-title" className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden border-l-4" style={{ borderLeftColor: ROSA_BREGOSO }}>
            <h2 id="mural-turma-title" className="text-sm font-semibold text-zinc-300 uppercase tracking-wider p-4 pb-1 flex items-center gap-2" style={{ color: ROSA_BREGOSO }}>
              <MessageSquare size={18} />
              Mural de Ecos
            </h2>
            <p className="text-xs text-zinc-400 px-4 pb-3">Inteligência Coletiva — reflexões da turma</p>
            <div className="p-4 pt-0">
              {!formacao?.muralTurma?.length ? (
                <p className="text-sm text-zinc-400">Nenhuma reflexão partilhada ainda. Marca &quot;Postar no Mural da Turma&quot; ao guardar a tua reflexão num encontro.</p>
              ) : (
                <ul className="space-y-3">
                  {[...(formacao.muralTurma || [])].reverse().map((eco, idx) => (
                    <li key={idx} className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-3">
                      <p className="text-xs font-semibold text-zinc-400 mb-1.5" style={{ color: ROSA_BREGOSO }}>{eco.alunoNome}</p>
                      <p className="text-sm text-zinc-100 whitespace-pre-wrap">{eco.texto}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {/* Posso Ajudar Com — especialidades + quem pode te ajudar */}
        {alunoAuth?.alunoId && (
          <section aria-labelledby="posso-ajudar-title" className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden border-l-4" style={{ borderLeftColor: ROSA_BREGOSO }}>
            <h2 id="posso-ajudar-title" className="text-sm font-semibold text-zinc-400 uppercase tracking-wider p-4 pb-2 flex items-center gap-2" style={{ color: ROSA_BREGOSO }}>
              <Users size={18} />
              Posso Ajudar Com
            </h2>
            <div className="p-4 pt-0 space-y-4">
              <p className="text-sm text-zinc-400">Marca as áreas em que podes ajudar os colegas:</p>
              <div className="flex flex-wrap gap-2">
                {ESPECIALIDADES_OPCOES.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleEspecialidade(tag)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors border ${
                      especialidades.includes(tag)
                        ? "border-[#EBE22F] text-[#121212]"
                        : "border-zinc-600 text-zinc-400 hover:border-zinc-500"
                    }`}
                    style={especialidades.includes(tag) ? { backgroundColor: AMARELO_FESTIVAL } : { backgroundColor: "rgb(39 39 42)" }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <div className="border-t border-zinc-700/80 pt-4">
                <p className="text-sm font-medium text-zinc-300 mb-2">Veja quem na turma pode te ajudar</p>
                {loadingColegas ? (
                  <p className="text-sm text-zinc-500 flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> A carregar…</p>
                ) : (
                  <ul className="space-y-2">
                    {colegasTurma
                      .filter((c) => c.id !== alunoAuth?.alunoId && c.especialidades?.length > 0)
                      .map((c) => (
                        <li key={c.id} className="rounded-lg bg-zinc-800/50 px-3 py-2">
                          <span className="font-medium text-zinc-200">{c.nomeArtistico}</span>
                          <span className="text-zinc-500 text-sm ml-2">
                            {c.especialidades?.join(", ")}
                          </span>
                        </li>
                      ))}
                    {colegasTurma.filter((c) => c.id !== alunoAuth?.alunoId && c.especialidades?.length > 0).length === 0 && (
                      <li className="text-sm text-zinc-500">Ninguém da turma marcou especialidades ainda.</li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Links Úteis da Turma — partilhar e ver links da formação */}
        {alunoAuth?.alunoId && (
          <section aria-labelledby="links-turma-title" className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden border-l-4" style={{ borderLeftColor: ROSA_BREGOSO }}>
            <h2 id="links-turma-title" className="text-sm font-semibold text-zinc-400 uppercase tracking-wider p-4 pb-2 flex items-center gap-2" style={{ color: ROSA_BREGOSO }}>
              <LinkIcon size={18} />
              Links Úteis da Turma
            </h2>
            <div className="p-4 pt-0 space-y-4">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={linkPartilhar}
                  onChange={(e) => setLinkPartilhar(e.target.value)}
                  placeholder="Partilhar Link (YouTube, Spotify, etc.)"
                  className="flex-1 min-h-[48px] rounded-xl border border-zinc-600 bg-zinc-800 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                  disabled={enviandoLink}
                />
                <button
                  type="button"
                  onClick={handlePartilharLink}
                  disabled={enviandoLink || !linkPartilhar.trim()}
                  className="shrink-0 min-h-[48px] min-w-[48px] px-4 rounded-xl font-semibold text-sm text-[#121212] disabled:opacity-50"
                  style={{ backgroundColor: AMARELO_FESTIVAL }}
                >
                  {enviandoLink ? <Loader2 size={18} className="animate-spin" /> : "Partilhar"}
                </button>
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Links da Turma</p>
                {!formacao?.linksTurma?.length ? (
                  <p className="text-sm text-zinc-500">Nenhum link partilhado ainda.</p>
                ) : (
                  <ul className="space-y-2">
                    {[...(formacao.linksTurma || [])].reverse().map((item, idx) => (
                      <li key={idx} className="flex items-center justify-between gap-2 rounded-lg bg-zinc-800/50 px-3 py-2">
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm truncate flex-1 min-w-0" style={{ color: ROSA_BREGOSO }}>
                          {item.url}
                        </a>
                        <span className="text-xs text-zinc-500 shrink-0">{item.alunoNome}</span>
                        <ExternalLink size={14} className="text-zinc-500 shrink-0" />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
          <button
            type="button"
            onClick={() => setCofreOpen((o) => !o)}
            className="w-full min-h-[52px] flex items-center justify-between gap-3 px-4 py-3 text-left bg-zinc-800/50 hover:bg-zinc-800/70 transition-colors border-b border-zinc-800/80"
            aria-expanded={cofreOpen}
          >
            <span className="font-semibold text-zinc-50 flex items-center gap-2">
              <BookOpen size={20} style={{ color: ROSA_BREGOSO }} />
              Cofre de Saberes
            </span>
            <ChevronDown size={20} className={`text-zinc-500 shrink-0 transition-transform ${cofreOpen ? "rotate-180" : ""}`} />
          </button>
          {cofreOpen && (
            <div className="p-4 space-y-3 border-t border-zinc-800/80">
              <p className="text-sm text-zinc-400">Materiais, gravações e recursos para atiçar o ritmo.</p>
              <a href={formacao?.linkMateriaisDidaticos || "#"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 w-full min-h-[56px] rounded-xl border px-4 py-3 text-zinc-50 font-medium hover:bg-zinc-800/80 transition-colors" style={{ borderColor: `${ROSA_BREGOSO}66`, backgroundColor: "rgba(0,0,0,0.15)" }}>
                <BookOpen size={22} className="shrink-0" style={{ color: ROSA_BREGOSO }} />
                📚 Caderno de Saberes
              </a>
              <a href="#" className="flex items-center gap-3 w-full min-h-[56px] rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-zinc-50 font-medium hover:bg-zinc-800/80 transition-colors">
                <Music size={22} className="text-pink-500/90 shrink-0" /> 🎧 Pack de Ritmos
              </a>
            </div>
          )}
        </section>
      </div>

      {toast && (
        <div
          className="fixed bottom-24 left-4 right-4 max-w-md mx-auto py-3 px-4 rounded-xl text-center text-sm font-medium shadow-lg z-50 animate-in fade-in duration-200"
          style={{ backgroundColor: toast.includes("Erro") ? "#b91c1c" : "#059669", color: "#fff" }}
          role="status"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

/** Meu Diário (com partilha): Sintonia + Reflexão + checkbox "Postar no Mural da Turma" + Salvar. Inclui botão Relato Oral (Speech-to-Text). */
function MeuDiarioDeBordo({ moduloId, diarioAtual, onSave, salvando, amareloFestival, perguntaMicroMissao, onListeningStart, onSpeechError }) {
  const [aberto, setAberto] = useState(false);
  const [reflexao, setReflexao] = useState(diarioAtual.reflexao ?? "");
  const [avaliacaoFacilitador, setAvaliacaoFacilitador] = useState(diarioAtual.avaliacaoFacilitador ?? diarioAtual.avaliacaoProfessor ?? null);
  const [postarNoMural, setPostarNoMural] = useState(false);

  const onReflexaoResult = useCallback((chunk) => {
    setReflexao((prev) => prev + chunk);
  }, []);
  const { isSupported: speechSupported, isListening: reflexaoListening, toggle: toggleReflexaoSpeech } = useSpeechRecognition({
    onResult: onReflexaoResult,
    onError: onSpeechError,
  });
  const handleMicClick = useCallback(() => {
    if (!reflexaoListening) onListeningStart?.();
    toggleReflexaoSpeech();
  }, [reflexaoListening, onListeningStart, toggleReflexaoSpeech]);

  useEffect(() => {
    setReflexao(diarioAtual.reflexao ?? "");
    setAvaliacaoFacilitador(diarioAtual.avaliacaoFacilitador ?? diarioAtual.avaliacaoProfessor ?? null);
  }, [diarioAtual.reflexao, diarioAtual.avaliacaoFacilitador, diarioAtual.avaliacaoProfessor]);

  const handleSalvar = () => {
    onSave(moduloId, reflexao, avaliacaoFacilitador, postarNoMural);
  };

  const temConteudo = reflexao.trim() || avaliacaoFacilitador;

  return (
    <div className="border-t border-zinc-700/80 pt-4">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        className="w-full min-h-[48px] flex items-center justify-between gap-2 rounded-xl border border-zinc-600/80 bg-zinc-800/40 px-4 text-left text-zinc-300 font-medium hover:bg-zinc-800/60 transition-colors"
      >
        <span className="flex items-center gap-2">
          <MessageSquare size={18} style={{ color: amareloFestival }} />
          Meu Diário de Bordo
          {temConteudo && <span className="text-xs text-emerald-400">(guardado)</span>}
        </span>
        {aberto ? <ChevronUp size={20} className="text-zinc-500" /> : <ChevronDown size={20} className="text-zinc-500" />}
      </button>
      {aberto && (
        <div className="mt-3 space-y-4 pl-0">
          <div>
            <p className="text-sm text-zinc-300 mb-2">Sintonia com o Facilitador</p>
            <div className="flex gap-3 flex-wrap">
              {EMOJI_SINTONIA.map((op) => (
                <button
                  key={op.value}
                  type="button"
                  onClick={() => setAvaliacaoFacilitador(op.value)}
                  className="min-h-[52px] min-w-[52px] flex flex-col items-center justify-center rounded-xl border-2 transition-all text-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-amber-400"
                  style={{
                    borderColor: avaliacaoFacilitador === op.value ? amareloFestival : "rgb(39 39 42)",
                    backgroundColor: avaliacaoFacilitador === op.value ? `${amareloFestival}20` : "rgb(39 39 42 / 0.5)",
                  }}
                  aria-pressed={avaliacaoFacilitador === op.value}
                  aria-label={op.label}
                >
                  <span className="leading-none">{op.emoji}</span>
                  <span className="text-[10px] font-medium text-zinc-400 mt-1">{op.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor={`reflexao-${moduloId}`} className="block text-sm text-zinc-300 mb-1.5">
              Reflexão Rápida
            </label>
            <div className="relative">
              <textarea
                id={`reflexao-${moduloId}`}
                value={reflexao}
                onChange={(e) => setReflexao(e.target.value)}
                placeholder={(perguntaMicroMissao || "").trim() || "O que ficou ecoando na sua cabeça após o encontro de hoje?"}
                className="w-full min-h-[80px] rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 pr-14 pb-14 text-zinc-50 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 resize-y"
                disabled={salvando}
              />
              {speechSupported && (
                <button
                  type="button"
                  onClick={handleMicClick}
                  className={`absolute bottom-3 right-3 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-[#db2669] ${reflexaoListening ? "relato-oral-pulse border-[#db2669] bg-[#db2669]/20 text-[#db2669]" : "border-zinc-600 bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"}`}
                  aria-label={reflexaoListening ? "Parar gravação de voz" : "Relato por voz — transcrever fala para texto"}
                  title={reflexaoListening ? "Parar gravação" : "Ativar microfone para transcrever"}
                >
                  <Mic size={24} aria-hidden />
                </button>
              )}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer min-h-[48px]">
            <input
              type="checkbox"
              checked={postarNoMural}
              onChange={(e) => setPostarNoMural(e.target.checked)}
              className="rounded border-zinc-500 bg-zinc-800 text-pink-500 focus:ring-pink-500 w-5 h-5 shrink-0"
            />
            <span className="text-sm text-zinc-200">Postar no Mural da Turma</span>
          </label>
          <button
            type="button"
            onClick={handleSalvar}
            disabled={salvando}
            className="w-full min-h-[48px] rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors border-2"
            style={{ borderColor: amareloFestival, backgroundColor: `${amareloFestival}20`, color: amareloFestival }}
          >
            {salvando ? <><Loader2 size={18} className="animate-spin" /> A guardar…</> : "Salvar Reflexão"}
          </button>
        </div>
      )}
    </div>
  );
}
