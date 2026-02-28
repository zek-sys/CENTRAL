/**
 * Formulário Nova Formação — Cérebro da experiência de campo do Agente Cultural.
 * Arquitetura LMS Resiliente (Instituto Regatão).
 * Mobile-first, modo escuro rigoroso (bg-black / bg-zinc-900), Amarelo Festival (ações), Rosa Bregoso (indicadores).
 */

import React, { useState, useCallback, useEffect } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2, X } from "lucide-react";
import { collection, doc, addDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db, appId } from "../../core/firebase";
import { EVIDENCIAS_FORMACAO_VAZIAS } from "../../types/actions";

const ACORES_PATH = ["artifacts", appId, "public", "data", "acoes"];
const AMARELO_FESTIVAL = "#EBE22F";
const ROSA_BREGOSO = "#db2669";

const INPUT_BASE =
  "w-full min-h-[48px] rounded-xl border border-zinc-600 bg-zinc-800/80 px-4 py-3 text-base text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-[#EBE22F]/50 focus:border-[#EBE22F]/50 outline-none transition-colors [color-scheme:dark]";
const TEXTAREA_BASE = INPUT_BASE + " min-h-[80px] resize-y";
const LABEL_BASE = "block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5";

/** Uma linha do bloco Módulos/Cronograma: nome, data, carga, link pré-aula, pergunta micro-missão. */
function getEmptyModuloCronograma() {
  return {
    id: `mc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    titulo: "",
    data: "",
    cargaHoraria: "",
    linkPreAula: "",
    perguntaMicroMissao: "",
  };
}

/** Accordion de secção (expandir/colapsar). */
function SectionAccordion({ title, open, onToggle, children, accentBorder }) {
  const isOpen = Boolean(open);
  return (
    <div
      className="rounded-xl border overflow-hidden bg-zinc-900/50"
      style={accentBorder ? { borderColor: "rgba(219, 38, 105, 0.4)" } : { borderColor: "rgb(39 39 42)" }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full min-h-[52px] flex items-center justify-between gap-3 px-4 py-3 text-left font-medium text-zinc-200 hover:bg-zinc-800/50 transition-colors"
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        {isOpen ? <ChevronUp size={20} className="text-zinc-500 shrink-0" /> : <ChevronDown size={20} className="text-zinc-500 shrink-0" />}
      </button>
      {isOpen && <div className="px-4 pb-4 pt-0 border-t border-zinc-800/80 space-y-4">{children}</div>}
    </div>
  );
}

export default function FormularioFormacao({
  isOpen,
  onClose,
  eixos = [],
  programas = [],
  responsavelId,
  formacao = null,
  onSaved,
  onCreatedWithId,
}) {
  const isEdit = Boolean(formacao?.id);

  // —— DADOS BÁSICOS ——
  const [titulo, setTitulo] = useState("");
  const [eixoId, setEixoId] = useState("");
  const [programaId, setProgramaId] = useState("");
  const [pedagogicoTema, setPedagogicoTema] = useState("");
  const [pedagogicoInstrutor, setPedagogicoInstrutor] = useState("");
  const [cargaHoraria, setCargaHoraria] = useState("");
  const [vagas, setVagas] = useState("");
  const [prazoFinal, setPrazoFinal] = useState("");
  const [isLowDataDefault, setIsLowDataDefault] = useState(false);
  const [modeloAvaliacao, setModeloAvaliacao] = useState("aticamento");

  // —— ESTRUTURA PEDAGÓGICA ——
  const [ementa, setEmenta] = useState("");
  const [modulosCronograma, setModulosCronograma] = useState([]);
  const [linkMateriaisDidaticos, setLinkMateriaisDidaticos] = useState("");

  // —— COMPLIANCE E INSCRIÇÕES ——
  const [linkInscricoesGoogleForms, setLinkInscricoesGoogleForms] = useState("");
  const [linkAvaliacoes, setLinkAvaliacoes] = useState("");
  const [linkProvas, setLinkProvas] = useState("");
  const [metaPresencaMinimaPercentual, setMetaPresencaMinimaPercentual] = useState("");

  // Accordions: [ DADOS_BASICOS, ESTRUTURA, COMPLIANCE ]
  const [openSections, setOpenSections] = useState([true, false, false]);
  const toggleSection = useCallback((index) => {
    setOpenSections((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }, []);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const programasDoEixo = programas.filter((p) => p.eixoId === eixoId);

  // Preencher ao editar
  useEffect(() => {
    if (!isOpen) return;
    if (formacao) {
      setTitulo(formacao.titulo ?? "");
      setEixoId(formacao.eixoId ?? "");
      setProgramaId(formacao.programaId ?? "");
      setPedagogicoTema(formacao.pedagogicoTema ?? "");
      setPedagogicoInstrutor(formacao.pedagogicoInstrutor ?? "");
      setCargaHoraria(formacao.cargaHoraria != null ? String(formacao.cargaHoraria) : "");
      setVagas(formacao.vagas != null ? String(formacao.vagas) : "");
      setPrazoFinal(formacao.prazoFinal?.toDate?.()?.toISOString?.()?.slice(0, 10) ?? "");
      setIsLowDataDefault(Boolean(formacao.isLowDataDefault));
      setModeloAvaliacao(formacao.modeloAvaliacao === "tradicional" ? "tradicional" : "aticamento");
      setEmenta(formacao.ementa ?? "");
      setLinkMateriaisDidaticos(formacao.linkMateriaisDidaticos ?? "");
      setLinkInscricoesGoogleForms(formacao.linkInscricoesGoogleForms ?? "");
      setLinkAvaliacoes(formacao.linkAvaliacoes ?? "");
      setLinkProvas(formacao.linkProvas ?? "");
      setMetaPresencaMinimaPercentual(formacao.metaPresencaMinimaPercentual != null ? String(formacao.metaPresencaMinimaPercentual) : "");

      const cronograma = formacao.cronograma ?? [];
      const modulos = formacao.modulos ?? [];
      const merged = cronograma.length > 0
        ? cronograma.map((c, i) => ({
            id: c.id || getEmptyModuloCronograma().id,
            titulo: c.titulo ?? "",
            data: (c.dataInicio || "").slice(0, 10),
            cargaHoraria: modulos[i]?.cargaHoraria != null ? String(modulos[i].cargaHoraria) : "",
            linkPreAula: c.linkPreAula ?? modulos[i]?.linkPreAula ?? "",
            perguntaMicroMissao: c.perguntaMicroMissao ?? modulos[i]?.perguntaMicroMissao ?? "",
          }))
        : modulos.map((m) => ({
            id: m.id || getEmptyModuloCronograma().id,
            titulo: m.titulo ?? "",
            data: "",
            cargaHoraria: m.cargaHoraria != null ? String(m.cargaHoraria) : "",
            linkPreAula: m.linkPreAula ?? "",
            perguntaMicroMissao: m.perguntaMicroMissao ?? "",
          }));
      setModulosCronograma(merged.length > 0 ? merged : [getEmptyModuloCronograma()]);
    } else {
      setTitulo("");
      setEixoId("");
      setProgramaId("");
      setPedagogicoTema("");
      setPedagogicoInstrutor("");
      setCargaHoraria("");
      setVagas("");
      setPrazoFinal("");
      setEmenta("");
      setIsLowDataDefault(false);
      setModeloAvaliacao("aticamento");
      setModulosCronograma([getEmptyModuloCronograma()]);
      setLinkMateriaisDidaticos("");
      setLinkInscricoesGoogleForms("");
      setLinkAvaliacoes("");
      setLinkProvas("");
      setMetaPresencaMinimaPercentual("");
    }
    setError(null);
  }, [isOpen, formacao]);

  // Ao mudar eixo, limpar programa se não pertencer ao eixo
  useEffect(() => {
    if (programaId && !programasDoEixo.some((p) => p.id === programaId)) setProgramaId("");
  }, [eixoId, programaId, programasDoEixo]);

  const addModuloCronograma = useCallback(() => {
    setModulosCronograma((prev) => [...prev, getEmptyModuloCronograma()]);
  }, []);

  const updateModuloCronograma = useCallback((index, field, value) => {
    setModulosCronograma((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }, []);

  const removeModuloCronograma = useCallback((index) => {
    setModulosCronograma((prev) => (prev.length <= 1 ? [getEmptyModuloCronograma()] : prev.filter((_, i) => i !== index)));
  }, []);

  const handleSubmit = useCallback(async () => {
    const tituloTrim = titulo.trim();
    if (!tituloTrim) {
      setError("Título da formação é obrigatório.");
      return;
    }
    if (!responsavelId && !isEdit) {
      setError("Responsável é obrigatório para criar.");
      return;
    }

    setSaving(true);
    setError(null);

    // Normalizar e limpar URLs (trim) e preservar ordem dos encontros em modulos/cronograma
    const trimUrl = (v) => (typeof v === "string" ? v.trim() : "") || undefined;
    const modulosFiltrados = modulosCronograma.filter((r) => r.titulo.trim() || r.data || r.cargaHoraria !== "" || (r.linkPreAula || "").trim() || (r.perguntaMicroMissao || "").trim());
    const cronograma = modulosFiltrados.map((r) => ({
      id: r.id,
      titulo: r.titulo.trim() || "Encontro",
      dataInicio: r.data || new Date().toISOString().slice(0, 10),
      dataFim: r.data || new Date().toISOString().slice(0, 10),
      cargaHoraria: r.cargaHoraria !== "" && !Number.isNaN(Number(r.cargaHoraria)) ? Number(r.cargaHoraria) : undefined,
      linkPreAula: (r.linkPreAula || "").trim() || undefined,
      perguntaMicroMissao: (r.perguntaMicroMissao || "").trim() || undefined,
    }));
    const modulos = modulosFiltrados.map((r) => ({
      id: r.id,
      titulo: r.titulo.trim() || "Encontro",
      cargaHoraria: r.cargaHoraria !== "" && !Number.isNaN(Number(r.cargaHoraria)) ? Number(r.cargaHoraria) : undefined,
      linkPreAula: (r.linkPreAula || "").trim() || undefined,
      perguntaMicroMissao: (r.perguntaMicroMissao || "").trim() || undefined,
    }));

    let prazoFinalTs = null;
    if (prazoFinal.trim()) {
      try {
        const [y, m, d] = prazoFinal.split("-").map(Number);
        prazoFinalTs = Timestamp.fromDate(new Date(y, m - 1, d));
      } catch (_) {}
    }

    const payload = {
      titulo: tituloTrim,
      eixoId: eixoId || null,
      programaId: programaId || null,
      pedagogicoTema: pedagogicoTema.trim() || null,
      pedagogicoInstrutor: pedagogicoInstrutor.trim() || null,
      cargaHoraria: cargaHoraria !== "" && !Number.isNaN(Number(cargaHoraria)) ? Number(cargaHoraria) : null,
      vagas: vagas !== "" && !Number.isNaN(Number(vagas)) ? Number(vagas) : null,
      prazoFinal: prazoFinalTs,
      ementa: ementa.trim() || null,
      cronograma: cronograma.length > 0 ? cronograma : null,
      modulos: modulos.length > 0 ? modulos : null,
      linkMateriaisDidaticos: trimUrl(linkMateriaisDidaticos) ?? null,
      linkInscricoesGoogleForms: trimUrl(linkInscricoesGoogleForms) ?? null,
      linkAvaliacoes: trimUrl(linkAvaliacoes) ?? null,
      linkProvas: trimUrl(linkProvas) ?? null,
      metaPresencaMinimaPercentual:
        metaPresencaMinimaPercentual !== "" && !Number.isNaN(Number(metaPresencaMinimaPercentual))
          ? Number(metaPresencaMinimaPercentual)
          : null,
      isLowDataDefault: isLowDataDefault,
      modeloAvaliacao: modeloAvaliacao === "tradicional" ? "tradicional" : "aticamento",
      atualizadoEm: Timestamp.now(),
    };

    try {
      if (isEdit) {
        const ref = doc(db, ...ACORES_PATH, formacao.id);
        await updateDoc(ref, payload);
        onSaved?.();
        onClose?.();
      } else {
        const colRef = collection(db, ...ACORES_PATH);
        const nowTs = Timestamp.now();
        const docRef = await addDoc(colRef, {
          ...payload,
          tipoAcao: "D",
          responsavelId,
          status: "pendente",
          projetoId: "PROJ-TRANSVERSAL",
          criadoEm: nowTs,
          evidencias: EVIDENCIAS_FORMACAO_VAZIAS,
          pedagogicoPresencaCount: 0,
        });
        onCreatedWithId?.(docRef.id);
        onSaved?.();
        onClose?.();
      }
    } catch (err) {
      setError(err?.message ?? "Erro ao salvar formação.");
    } finally {
      setSaving(false);
    }
  }, [
    titulo,
    eixoId,
    programaId,
    pedagogicoTema,
    pedagogicoInstrutor,
    cargaHoraria,
    vagas,
    prazoFinal,
    ementa,
    modulosCronograma,
    linkMateriaisDidaticos,
    linkInscricoesGoogleForms,
    linkAvaliacoes,
    linkProvas,
    metaPresencaMinimaPercentual,
    isLowDataDefault,
    modeloAvaliacao,
    isEdit,
    formacao,
    responsavelId,
    onSaved,
    onClose,
    onCreatedWithId,
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-zinc-100" role="dialog" aria-modal="true" aria-labelledby="formacao-title">
      {/* Header fixo */}
      <header className="shrink-0 flex items-center justify-between gap-3 min-h-[56px] px-4 py-3 border-b border-zinc-800 bg-zinc-900/95">
        <h1 id="formacao-title" className="text-lg font-bold text-white truncate">
          {isEdit ? "Editar Formação" : "Nova Formação"}
        </h1>
        <button
          type="button"
          onClick={onClose}
          className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          aria-label="Fechar"
        >
          <X size={24} />
        </button>
      </header>

      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-y-auto p-4 pb-32 space-y-4">
        {error && (
          <div className="rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-sm p-3">
            {error}
          </div>
        )}

        {/* 1. CONFIGURAÇÕES DE ACESSIBILIDADE E DADOS */}
        <SectionAccordion
          title="1. Configurações de Acessibilidade e Dados"
          open={openSections[0]}
          onToggle={() => toggleSection(0)}
        >
          <div>
            <label className={LABEL_BASE}>Título da Formação *</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Batidas do Rio"
              className={INPUT_BASE}
            />
          </div>
          <div>
            <label className={LABEL_BASE}>Eixo Estratégico (Nível 1)</label>
            <select
              value={eixoId}
              onChange={(e) => setEixoId(e.target.value)}
              className={INPUT_BASE}
            >
              <option value="">— Selecione o eixo —</option>
              {eixos.map((e) => (
                <option key={e.id} value={e.id}>{e.nome}</option>
              ))}
            </select>
            <p className="text-xs text-zinc-500 mt-1">Raízes da matriz: Fortalecimento Organizacional, Trilhas de Aprendizagem, Tecituras da Resistência, Culturas em Cena, Gestão de Conhecimento e Comunicação.</p>
          </div>
          <div>
            <label className={LABEL_BASE}>Ação Continuada (Nível 2)</label>
            <select
              value={programaId}
              onChange={(e) => setProgramaId(e.target.value)}
              className={INPUT_BASE}
              disabled={!eixoId}
            >
              <option value="">— Selecione a ação continuada —</option>
              {programasDoEixo.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
            <p className="text-xs text-zinc-500 mt-1">Troncos da árvore: Governança e Gestão, Projetos, Comunicação, Atiçamento (Formações, Fomentos e Mentorias), etc.</p>
          </div>
          <div>
            <label className={LABEL_BASE}>Tema Principal</label>
            <input
              type="text"
              value={pedagogicoTema}
              onChange={(e) => setPedagogicoTema(e.target.value)}
              placeholder="Ex: Ritmo e percussão"
              className={INPUT_BASE}
            />
          </div>
          <div>
            <label className={LABEL_BASE}>Facilitador Principal</label>
            <input
              type="text"
              value={pedagogicoInstrutor}
              onChange={(e) => setPedagogicoInstrutor(e.target.value)}
              placeholder="Ex: Zek Picoteiro"
              className={INPUT_BASE}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_BASE}>Carga Horária Total (h)</label>
              <input
                type="number"
                min={0}
                step={1}
                value={cargaHoraria}
                onChange={(e) => setCargaHoraria(e.target.value)}
                placeholder="Ex: 32"
                className={INPUT_BASE}
              />
            </div>
            <div>
              <label className={LABEL_BASE}>Número de Vagas</label>
              <input
                type="number"
                min={0}
                step={1}
                value={vagas}
                onChange={(e) => setVagas(e.target.value)}
                placeholder="Ex: 20"
                className={INPUT_BASE}
              />
            </div>
          </div>
          <div>
            <label className={LABEL_BASE}>Prazo final (opcional)</label>
            <input
              type="date"
              value={prazoFinal}
              onChange={(e) => setPrazoFinal(e.target.value)}
              className={INPUT_BASE}
            />
          </div>
          <div className="flex items-center justify-between gap-3 min-h-[52px] rounded-xl border px-4 border-zinc-700 bg-zinc-800/50" style={{ borderLeftWidth: 4, borderLeftColor: ROSA_BREGOSO }}>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-zinc-200">Ativar Modo Econômico por Padrão</span>
              <p className="text-xs text-zinc-500 mt-0.5">Se ativado, o Portal do Agente carregará sem imagens de capa para poupar banda no rio.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isLowDataDefault}
              onClick={() => setIsLowDataDefault((v) => !v)}
              className="shrink-0 relative inline-flex h-7 w-12 rounded-full border-2 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
              style={{ borderColor: isLowDataDefault ? AMARELO_FESTIVAL : "rgb(63 63 70)", backgroundColor: isLowDataDefault ? `${AMARELO_FESTIVAL}20` : "rgb(39 39 42)" }}
            >
              <span
                className="absolute top-1 inline-block h-5 w-5 rounded-full bg-white shadow transition-transform"
                style={{ transform: isLowDataDefault ? "translateX(26px)" : "translateX(4px)" }}
                aria-hidden
              />
            </button>
          </div>
          <div>
            <label className={LABEL_BASE}>Modelo de Avaliação Pedagógica</label>
            <select
              value={modeloAvaliacao}
              onChange={(e) => setModeloAvaliacao(e.target.value)}
              className={INPUT_BASE}
              aria-describedby="modelo-avaliacao-desc"
            >
              <option value="tradicional">Tradicional (Notas 0-10)</option>
              <option value="aticamento">Atiçamento (Semente ➔ Broto ➔ Fruto)</option>
            </select>
            <p id="modelo-avaliacao-desc" className="text-xs text-zinc-500 mt-1">Default: Atiçamento. Define como a evolução do Agente é exibida no Portal.</p>
          </div>
        </SectionAccordion>

        {/* 2. CRONOGRAMA DE ENCONTROS DINÂMICO */}
        <SectionAccordion
          title="2. Cronograma de Encontros Dinâmico"
          open={openSections[1]}
          onToggle={() => toggleSection(1)}
          accentBorder
        >
          <div>
            <label className={LABEL_BASE}>Ementa resumida</label>
            <textarea
              value={ementa}
              onChange={(e) => setEmenta(e.target.value)}
              placeholder="Resumo do curso, objetivos e conteúdo..."
              rows={4}
              className={`${INPUT_BASE} min-h-[120px] resize-y`}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={LABEL_BASE + " mb-0"}>Encontros / Cronograma</label>
              <button
                type="button"
                onClick={addModuloCronograma}
                className="flex items-center gap-1.5 text-sm font-medium hover:opacity-90 min-h-[48px] min-w-[48px] px-2 rounded-xl touch-manipulation"
                style={{ color: AMARELO_FESTIVAL }}
              >
                <Plus size={18} /> Adicionar
              </button>
            </div>
            <div className="space-y-3">
              {modulosCronograma.map((row, index) => (
                <div key={row.id} className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-3 space-y-2">
                  <div className="flex gap-2 items-start">
                    <input
                      type="text"
                      value={row.titulo}
                      onChange={(e) => updateModuloCronograma(index, "titulo", e.target.value)}
                      placeholder="Nome do encontro"
                      className={`${INPUT_BASE} flex-1 min-h-[44px]`}
                    />
                    <button
                      type="button"
                      onClick={() => removeModuloCronograma(index)}
                      className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl text-zinc-400 hover:bg-red-500/20 hover:text-red-400"
                      aria-label="Remover linha"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={row.data}
                      onChange={(e) => updateModuloCronograma(index, "data", e.target.value)}
                      placeholder="Data"
                      className={INPUT_BASE}
                    />
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={row.cargaHoraria}
                      onChange={(e) => updateModuloCronograma(index, "cargaHoraria", e.target.value)}
                      placeholder="Carga (h)"
                      className={INPUT_BASE}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-1 block">Link de Preparação / Aquecimento</label>
                    <input
                      type="url"
                      value={row.linkPreAula ?? ""}
                      onChange={(e) => updateModuloCronograma(index, "linkPreAula", e.target.value)}
                      placeholder="Spotify, YouTube, PDF no Drive… (materiais que o Agente deve ver ANTES do encontro)"
                      className={INPUT_BASE}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-1 block">Pergunta de Reflexão (Eco)</label>
                    <textarea
                      value={row.perguntaMicroMissao ?? ""}
                      onChange={(e) => updateModuloCronograma(index, "perguntaMicroMissao", e.target.value)}
                      placeholder="Ex: Como essa batida se conecta com a sua comunidade?"
                      rows={2}
                      className={TEXTAREA_BASE}
                    />
                    <p className="text-xs text-zinc-500 mt-1">Esta pergunta aparecerá no Diário de Bordo do Agente para este encontro.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className={LABEL_BASE}>Link da pasta de materiais didáticos (Google Drive)</label>
            <input
              type="url"
              value={linkMateriaisDidaticos}
              onChange={(e) => setLinkMateriaisDidaticos(e.target.value)}
              placeholder="https://drive.google.com/..."
              className={INPUT_BASE}
            />
            <p className="text-xs text-zinc-500 mt-1">Regra do Arquivo Leve: apenas link da pasta no Drive.</p>
          </div>
        </SectionAccordion>

        {/* 3. TRAVA DE PROVAS E DOCUMENTAÇÃO */}
        <SectionAccordion
          title="3. Trava de Provas e Documentação"
          open={openSections[2]}
          onToggle={() => toggleSection(2)}
        >
          <p className="text-xs text-zinc-500 -mt-1">Regra do Arquivo Leve: use apenas links de pastas no Google Drive. Campos visíveis e editáveis para compliance.</p>
          <div>
            <label className={LABEL_BASE}>Link do formulário de inscrição (Google Forms)</label>
            <input
              type="url"
              value={linkInscricoesGoogleForms}
              onChange={(e) => setLinkInscricoesGoogleForms(e.target.value)}
              placeholder="https://docs.google.com/forms/..."
              className={INPUT_BASE}
            />
          </div>
          <div>
            <label className={LABEL_BASE}>Link da pasta de Avaliações (Google Drive)</label>
            <input
              type="url"
              value={linkAvaliacoes}
              onChange={(e) => setLinkAvaliacoes(e.target.value)}
              placeholder="https://drive.google.com/..."
              className={INPUT_BASE}
            />
            <p className="text-xs text-zinc-500 mt-1">Pasta no Drive com avaliações da formação.</p>
          </div>
          <div>
            <label className={LABEL_BASE}>Link da pasta de Provas (Google Drive)</label>
            <input
              type="url"
              value={linkProvas}
              onChange={(e) => setLinkProvas(e.target.value)}
              placeholder="https://drive.google.com/..."
              className={INPUT_BASE}
            />
            <p className="text-xs text-zinc-500 mt-1">Trava de Provas: pasta no Drive com provas da formação.</p>
          </div>
          <div>
            <label className={LABEL_BASE}>Meta de presença mínima (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={5}
              value={metaPresencaMinimaPercentual}
              onChange={(e) => setMetaPresencaMinimaPercentual(e.target.value)}
              placeholder="Ex: 80"
              className={INPUT_BASE}
            />
          </div>
        </SectionAccordion>
      </div>

      {/* Botão fixo no rodapé — Amarelo Festival, 100% operável no celular */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 pt-3 pb-[env(safe-area-inset-bottom)] bg-black/95 border-t border-zinc-800">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || !titulo.trim()}
          className="w-full min-h-[56px] rounded-xl font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 touch-manipulation"
          style={{ backgroundColor: AMARELO_FESTIVAL, color: "#121212" }}
        >
          {saving ? "A guardar…" : "SALVAR FORMAÇÃO"}
        </button>
      </footer>
    </div>
  );
}
