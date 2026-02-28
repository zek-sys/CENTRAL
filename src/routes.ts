/**
 * Rotas do sistema conforme docs/arquitetura.md.
 * Sincronização path (URL) <-> activeTab (estado da aplicação).
 */

export const ROUTES = {
  MINHAS_TAREFAS: '/minhas-tarefas',
  PERFIL: '/perfil',
  GESTAO: '/gestao',
  PROJETOS: '/projetos',
  COMUNICACAO: '/comunicacao',
  CONFIGURACOES: '/configuracoes',
  CONHECA_INSTITUTO: '/conheca-o-instituto',
  GUIA_APRENDIZAGEM: '/guia',
  /** Rotas adicionais (sidebar) */
  VISAO_GERAL: '/visao-geral',
  CRONOGRAMA: '/cronograma',
  ARQUIVOS: '/arquivos',
  FINANCAS: '/financas',
  NUCLEO_PEDAGOGICO: '/nucleo-pedagogico',
  /** Área do Aluno (vista preparação por formação) */
  AREA_ALUNO: '/area-aluno',
  /** Login do Aluno (WhatsApp + PIN) */
  LOGIN_ALUNO: '/login-aluno',
  CULTURA: '/cultura',
  MAPA_IMPACTO: '/mapa-impacto',
  /** Rotas por núcleo (v4.0) — /nucleos/:slug */
  NUCLEOS: '/nucleos',
  NUCLEO_GESTAO: '/nucleos/gestao',
  NUCLEO_COMUNICACAO: '/nucleos/comunicacao',
  NUCLEO_CAMPO: '/nucleos/campo',
  NUCLEO_PEDAGOGICO_PAGE: '/nucleos/pedagogico',
  /** Master Outliner (Tree-Grid) — edição unificada Eixos → Projetos → Tarefas */
  MASTER: '/master',
} as const;

/** Path -> id da aba (activeTab). /comunicacao obsoleto — redireciona para minhas-tarefas. */
export const PATH_TO_TAB: Record<string, string> = {
  [ROUTES.MINHAS_TAREFAS]: 'meu_conves',
  [ROUTES.PERFIL]: 'perfil',
  [ROUTES.GESTAO]: 'admin',
  [ROUTES.PROJETOS]: 'projetos',
  [ROUTES.CONFIGURACOES]: 'mapa_cultural',
  [ROUTES.CONHECA_INSTITUTO]: 'conheca_o_instituto',
  [ROUTES.GUIA_APRENDIZAGEM]: 'guia_aprendizagem',
  [ROUTES.VISAO_GERAL]: 'bussola',
  [ROUTES.CRONOGRAMA]: 'cronograma_geral',
  [ROUTES.ARQUIVOS]: 'arquivos',
  [ROUTES.FINANCAS]: 'financeiro',
  [ROUTES.NUCLEO_PEDAGOGICO]: 'nucleo_pedagogico',
  [ROUTES.CULTURA]: 'cultura',
  [ROUTES.MAPA_IMPACTO]: 'mapa_impacto',
  [ROUTES.COMUNICACAO]: 'comunicacao',
  [ROUTES.NUCLEO_GESTAO]: 'nucleo_gestao',
  [ROUTES.NUCLEO_COMUNICACAO]: 'nucleo_comunicacao',
  [ROUTES.NUCLEO_CAMPO]: 'nucleo_campo',
  [ROUTES.NUCLEO_PEDAGOGICO_PAGE]: 'nucleo_pedagogico_page',
  [ROUTES.MASTER]: 'master_outliner',
};

/** id da aba -> path */
export const TAB_TO_PATH: Record<string, string> = {
  ...Object.fromEntries(Object.entries(PATH_TO_TAB).filter(([p]) => !p.startsWith('/nucleos')).map(([path, tab]) => [tab, path])),
  nucleo_gestao: ROUTES.NUCLEO_GESTAO,
  nucleo_comunicacao: ROUTES.NUCLEO_COMUNICACAO,
  nucleo_campo: ROUTES.NUCLEO_CAMPO,
  nucleo_pedagogico_page: ROUTES.NUCLEO_PEDAGOGICO_PAGE,
  master_outliner: ROUTES.MASTER,
};

/** Path padrão quando o usuário acessa / */
export const DEFAULT_PATH = ROUTES.MINHAS_TAREFAS;

/** Rotas que exigem perfil admin (apenas Gestão Estratégica). */
export const ROUTES_ADMIN_ONLY: string[] = [ROUTES.GESTAO];

/** Rotas visíveis apenas para role "diretoria" (Núcleo Pedagógico). */
export const ROUTES_DIRETORIA_ONLY: string[] = [ROUTES.NUCLEO_PEDAGOGICO];

/** Título da página por path (para document.title) */
export const PATH_TO_TITLE: Record<string, string> = {
  [ROUTES.MINHAS_TAREFAS]: 'Minhas Tarefas',
  [ROUTES.PERFIL]: 'Meu Perfil',
  [ROUTES.GESTAO]: 'Gestão Estratégica',
  [ROUTES.PROJETOS]: 'Projetos',
  [ROUTES.CONFIGURACOES]: 'Configurações',
  [ROUTES.CONHECA_INSTITUTO]: 'Conheça o Instituto',
  [ROUTES.GUIA_APRENDIZAGEM]: 'Guia de Bordo',
  [ROUTES.VISAO_GERAL]: 'Visão Geral',
  [ROUTES.CRONOGRAMA]: 'Cronograma Geral',
  [ROUTES.ARQUIVOS]: 'Arquivos e Documentos',
  [ROUTES.FINANCAS]: 'Direção e Finanças',
  [ROUTES.NUCLEO_PEDAGOGICO]: 'Núcleo Pedagógico',
  [ROUTES.CULTURA]: 'Cultura e Manuais',
  [ROUTES.MAPA_IMPACTO]: 'Mapa do Impacto',
  [ROUTES.COMUNICACAO]: 'Comunicação',
  [ROUTES.NUCLEO_GESTAO]: 'Núcleo Gestão',
  [ROUTES.NUCLEO_COMUNICACAO]: 'Núcleo Comunicação',
  [ROUTES.NUCLEO_CAMPO]: 'Núcleo Campo',
  [ROUTES.NUCLEO_PEDAGOGICO_PAGE]: 'Núcleo Pedagógico',
  [ROUTES.MASTER]: 'Master Outliner',
};

const BASE_TITLE = 'Central Regatão';

/** Retorna o título completo da aba (ex.: "Minhas Tarefas — Central Regatão"). */
export function getPageTitle(pathname: string): string {
  const normalized = pathname.replace(/\/$/, '') || DEFAULT_PATH;
  if (normalized.startsWith('/minhas-tarefas/')) return `Atividade — ${BASE_TITLE}`;
  if (normalized.startsWith('/projetos/')) return normalized === '/projetos/novo' ? `Novo Projeto — ${BASE_TITLE}` : `Projeto — ${BASE_TITLE}`;
  if (normalized.startsWith('/nucleo-pedagogico/')) return `Formação — ${BASE_TITLE}`;
  if (normalized.startsWith('/area-aluno/')) return `Área do Aluno — ${BASE_TITLE}`;
  if (normalized === '/login-aluno') return `Entrar — ${BASE_TITLE}`;
  if (normalized.startsWith('/nucleos/')) return `${PATH_TO_TITLE[normalized] ?? 'Núcleo'} — ${BASE_TITLE}`;
  if (normalized === '/master') return `${PATH_TO_TITLE[normalized] ?? 'Master'} — ${BASE_TITLE}`;
  const title = PATH_TO_TITLE[normalized] ?? PATH_TO_TITLE[DEFAULT_PATH];
  return title ? `${title} — ${BASE_TITLE}` : BASE_TITLE;
}

export function pathToTab(pathname: string): string | null {
  const normalized = pathname.replace(/\/$/, '') || '/';
  if (normalized === '/' || normalized === '') return PATH_TO_TAB[DEFAULT_PATH] ?? 'meu_conves';
  if (normalized.startsWith('/minhas-tarefas')) return 'meu_conves';
  if (normalized.startsWith('/projetos/')) return 'projetos';
  if (normalized === '/perfil') return 'perfil';
  if (normalized.startsWith('/nucleo-pedagogico/')) return 'nucleo_pedagogico';
  if (normalized.startsWith('/area-aluno/')) return 'nucleo_pedagogico';
  if (normalized === '/login-aluno') return 'login_aluno';
  if (normalized === '/cultura') return 'cultura';
  if (normalized === '/comunicacao') return 'comunicacao';
  if (normalized === '/cronograma') return 'cronograma_geral';
  if (normalized === '/visao-geral') return 'bussola';
  if (normalized === '/arquivos') return 'arquivos';
  if (normalized === '/financas') return 'financeiro';
  if (normalized === '/gestao') return 'admin';
  if (normalized === '/conheca-o-instituto') return 'conheca_o_instituto';
  if (normalized === '/guia') return 'guia_aprendizagem';
  if (normalized === '/configuracoes') return 'mapa_cultural';
  if (normalized === '/mapa-impacto') return 'mapa_impacto';
  if (normalized === '/master') return 'master_outliner';
  if (normalized.startsWith('/nucleos/')) {
    const slug = normalized.replace(/^\/nucleos\/?/, '').split('/')[0] || 'gestao';
    if (slug === 'gestao') return 'nucleo_gestao';
    if (slug === 'comunicacao') return 'nucleo_comunicacao';
    if (slug === 'campo') return 'nucleo_campo';
    if (slug === 'pedagogico') return 'nucleo_pedagogico_page';
    return 'nucleo_gestao';
  }
  return PATH_TO_TAB[normalized] ?? null;
}

export function tabToPath(tabId: string): string {
  return TAB_TO_PATH[tabId] ?? DEFAULT_PATH;
}
