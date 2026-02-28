/**
 * Schema Firestore — Coleção acoes (artifacts/{appId}/public/data/acoes).
 * Campos: responsavelId (ou responsavelUid/uidResponsavel), status (pendente|em_andamento|revisao|concluido).
 */

import type { Timestamp } from "firebase/firestore";

/** Status da ação (compliance: concluido só com evidências preenchidas para Tipo A) */
export type StatusAcao = "pendente" | "em_andamento" | "revisao" | "concluido";

/** Tipo da ação: A = Projeto (financeiro), B = Rotina, C = Reunião, D = Formação (pedagógico) */
export type TipoAcao = "A" | "B" | "C" | "D";

/** Fase da atividade de projeto (Tipo A) */
export type FaseProjeto = "pre" | "execucao" | "pos";

/** RSVP do convidado (Tipo C) */
export type RsvpStatus = "confirmado" | "pendente" | "recusado";

/** Item de checklist (Tipo A e Tipo D — Formação) */
export interface ChecklistItem {
  id: string;
  label: string;
  concluido: boolean;
}

/** Módulo de uma formação (curso) */
export interface ModuloFormacao {
  id: string;
  titulo: string;
  descricao?: string;
  cargaHoraria?: number;
  /** Link de preparação pré-aula (Spotify, YouTube, etc.) — LMS Resiliente. */
  linkPreAula?: string;
  /** Pergunta da micro-missão no Diário do Agente (ex.: "O que você aprendeu hoje?"). */
  perguntaMicroMissao?: string;
}

/** Item do cronograma da formação (datas de aulas/fases) */
export interface CronogramaItemFormacao {
  id: string;
  titulo: string;
  dataInicio: string;
  dataFim: string;
  /** Carga horária do encontro/módulo em horas (opcional). */
  cargaHoraria?: number;
  /** Link de preparação pré-aula (Spotify, YouTube, etc.) — LMS Resiliente. */
  linkPreAula?: string;
  /** Pergunta da micro-missão no Diário do Agente. */
  perguntaMicroMissao?: string;
}

/** Evidências financeiras (Tipo A). Mapeamento arquitetura: linkNF→linkNotaFiscal, linkPix→linkComprovantePagamento, linkComprovacaoVisual→linkProvaVisual.
 * URLs podem vir de links (Google Drive) ou de upload no Firebase Storage (urlNotaFiscal, urlComprovantePagamento, urlProvaServico). */
export interface Evidencias {
  linkNF: string;
  linkPix: string;
  linkComprovacaoVisual: string;
  /** URL no Storage após upload de ficheiro (Nota Fiscal). */
  urlNotaFiscal?: string;
  /** URL no Storage após upload (Comprovante de Pagamento). */
  urlComprovantePagamento?: string;
  /** URL no Storage após upload (Prova do Serviço). */
  urlProvaServico?: string;
}

/** Evidências para Formação (Tipo D): Tríade + Lista de Presença. linkComprovacaoVisual = Prova da Aula (fotos/vídeos). */
export interface EvidenciasFormacao extends Evidencias {
  linkListaPresenca: string;
}

/** Convidado da reunião (Tipo C) */
export interface ConvidadoReuniao {
  uid: string;
  rsvp: RsvpStatus;
}

/** Campos comuns a todas as ações. Firestore (docs/arquitetura): tarefas.responsavelId */
export interface AcaoBase {
  id: string;
  titulo: string;
  descricao?: string;
  projetoId: string | null;
  /** UID do responsável — no Firestore use o campo responsavelId (arquitetura). */
  responsavelId: string;
  status: StatusAcao;
  criadoEm: Timestamp;
  prazoFinal: Timestamp | null;
  tipoAcao: TipoAcao;
  /** Horas registadas ao concluir (arquitetura: horasDedicadas). */
  horasDedicadas?: number;
  /** Preenchido ao concluir (atualizadoEm no Firestore); usado para gráficos de horas por período. */
  atualizadoEm?: Timestamp | null;
  /** Soft delete: tarefa arquivada não aparece na lista Minhas Tarefas. */
  arquivado?: boolean;
  arquivadoEm?: Timestamp | null;
}

/** Tipo A — Atividade de Projeto (foco financeiro e compliance) */
export interface AcaoTipoA extends AcaoBase {
  tipoAcao: "A";
  orcamentoTeto: number;
  fase: FaseProjeto;
  checklists: ChecklistItem[];
  evidencias: Evidencias;
}

/** Tipo B — Rotina Administrativa */
export interface AcaoTipoB extends AcaoBase {
  tipoAcao: "B";
  templateId: string | null;
}

/** Tipo C — Reunião */
export interface AcaoTipoC extends AcaoBase {
  tipoAcao: "C";
  dataHoraInicio: Timestamp;
  dataHoraFim: Timestamp;
  localizacao: string;
  convidados: ConvidadoReuniao[];
}

/** Tipo D — Formação (Núcleo Pedagógico). Vinculada a eixo/programa; ementa, módulos, checklist, cronograma. */
export interface AcaoTipoD extends AcaoBase {
  tipoAcao: "D";
  pedagogicoInstrutor: string;
  pedagogicoTema: string;
  pedagogicoPresencaCount: number;
  evidencias: EvidenciasFormacao;
  /** Vinculação (igual projeto) */
  eixoId?: string | null;
  programaId?: string | null;
  /** Curso */
  ementa?: string;
  cargaHoraria?: number;
  modulos?: ModuloFormacao[];
  checklists?: ChecklistItem[];
  cronograma?: CronogramaItemFormacao[];
  /** Inscrições (Google Forms) */
  linkInscricoesGoogleForms?: string;
  linkPlanilhaRespostas?: string;
  /** Avaliações e provas (links Drive) */
  linkAvaliacoes?: string;
  linkProvas?: string;
  /** Outros */
  publicoAlvo?: string;
  objetivos?: string;
  metodologia?: string;
  certificacao?: string;
  vagas?: number;
  local?: string;
  /** Link da pasta de materiais didáticos (Google Drive — Regra do Arquivo Leve). */
  linkMateriaisDidaticos?: string;
  /** Meta de presença mínima em percentual (ex.: 80). */
  metaPresencaMinimaPercentual?: number;
  /** Registo de chamadas de presença (Diário de Bordo). Sincronizado quando online. */
  chamadasPresenca?: ChamadaPresenca[];
  /** Dúvidas enviadas pelos agentes culturais (Portal do Agente). */
  duvidasPendentes?: DuvidaFacilitador[];
  /** Reflexões partilhadas no Mural da Turma (Portal do Agente — Batidas do Rio). */
  muralTurma?: EcoMural[];
  /** Links partilhados pelos agentes (YouTube, Spotify, etc.). */
  linksTurma?: LinkTurma[];
  /** Ativar Modo Econômico por padrão para os agentes (LMS Resiliente). */
  isLowDataDefault?: boolean;
  /** Modelo de avaliação: tradicional (notas) ou atiçamento (Semente/Broto/Fruto). */
  modeloAvaliacao?: "tradicional" | "aticamento";
}

/** Item do Mural da Turma (reflexão partilhada por um agente). */
export interface EcoMural {
  alunoId: string;
  alunoNome: string;
  moduloId: string;
  texto: string;
  createdAt: Timestamp;
}

/** Link partilhado na turma. */
export interface LinkTurma {
  url: string;
  alunoId: string;
  alunoNome: string;
  createdAt: Timestamp;
}

/** Dúvida enviada ao facilitador por um agente cultural. */
export interface DuvidaFacilitador {
  texto: string;
  alunoId: string;
  alunoNome: string;
  createdAt: Timestamp;
}

/** Uma chamada de presença (um módulo/aula, uma data, lista de alunos P/F + avaliação do facilitador). */
export interface ChamadaPresenca {
  moduloId: string;
  moduloTitulo?: string;
  data: string;
  alunos: { nome: string; presente: boolean; avaliacaoFacilitador?: string | null }[];
}

/** União polimórfica */
export type Acao = AcaoTipoA | AcaoTipoB | AcaoTipoC | AcaoTipoD;

/** Type guards */
export function isAcaoTipoA(a: Acao): a is AcaoTipoA {
  return a.tipoAcao === "A";
}

export function isAcaoTipoB(a: Acao): a is AcaoTipoB {
  return a.tipoAcao === "B";
}

export function isAcaoTipoC(a: Acao): a is AcaoTipoC {
  return a.tipoAcao === "C";
}

export function isAcaoTipoD(a: Acao): a is AcaoTipoD {
  return a.tipoAcao === "D";
}

/** Trava de Evidência: Tipo A só pode ser concluído com os 3 documentos (link ou URL de upload). */
export function evidenciasCompletas(a: AcaoTipoA): boolean {
  const e = a.evidencias;
  const hasNF = Boolean((e?.linkNF ?? e?.urlNotaFiscal)?.trim());
  const hasPix = Boolean((e?.linkPix ?? e?.urlComprovantePagamento)?.trim());
  const hasProva = Boolean((e?.linkComprovacaoVisual ?? e?.urlProvaServico)?.trim());
  return hasNF && hasPix && hasProva;
}

export function podeConcluirTipoA(a: AcaoTipoA): boolean {
  return evidenciasCompletas(a);
}

/** Valores padrão para evidências (Tipo A) */
export const EVIDENCIAS_VAZIAS: Evidencias = {
  linkNF: "",
  linkPix: "",
  linkComprovacaoVisual: "",
};

/** Valores padrão para evidências Formação (Tipo D) */
export const EVIDENCIAS_FORMACAO_VAZIAS: EvidenciasFormacao = {
  ...EVIDENCIAS_VAZIAS,
  linkListaPresenca: "",
};

/** Regex simples para validar URL (Google Drive, etc.) */
export const URL_REGEX = /^https?:\/\/.+/i;

/** Trava Formação: 4 links preenchidos (NF, Comprovante, Prova da Aula, Lista de Presença) */
export function evidenciasFormacaoCompletas(a: AcaoTipoD): boolean {
  const e = a.evidencias;
  return Boolean(
    e?.linkNF?.trim() && URL_REGEX.test(e.linkNF.trim()) &&
    e?.linkPix?.trim() && URL_REGEX.test(e.linkPix.trim()) &&
    e?.linkComprovacaoVisual?.trim() && URL_REGEX.test(e.linkComprovacaoVisual.trim()) &&
    e?.linkListaPresenca?.trim() && URL_REGEX.test(e.linkListaPresenca.trim())
  );
}

export function podeConcluirFormacao(a: AcaoTipoD): boolean {
  return evidenciasFormacaoCompletas(a);
}
