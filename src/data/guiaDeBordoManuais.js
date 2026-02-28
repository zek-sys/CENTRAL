/**
 * Conteúdo dos Manuais do Guia de Bordo — por nível de acesso.
 * Comandante (Diretoria), Timoneiro (Facilitador), Tripulante (Agente).
 * Offline-first: todo o texto está aqui para leitura sem rede.
 * Termos críticos são destacados em Amarelo Festival na UI (ver GuiaDeBordoPage).
 */

export const MANUAL_COMANDANTE = {
  id: "comandante",
  titulo: "Manual do Comandante",
  icone: "🏛️",
  descricao: "Para a Diretoria: gestão estratégica, aprovações e visão de conjunto.",
  secoes: [
    {
      id: "c-visao",
      icone: "📊",
      titulo: "Visão Geral e Bússola",
      conteudo: "Use a Bússola (Visão Geral) para acompanhar indicadores e o estado dos projetos. A Gestão Estratégica concentra aprovações de demandas, contratos e o painel de direção. Acesse pelo menu lateral.",
    },
    {
      id: "c-aprovacoes",
      icone: "✅",
      titulo: "Aprovações e Demandas",
      conteudo: "As demandas pendentes aparecem na Gestão Estratégica. Aprove ou encaminhe com observações. Use o Canal de Escuta para responder às dúvidas enviadas pelo \"Fale com a Gestão\" no Perfil dos colaboradores.",
    },
    {
      id: "c-nucleo-pedagogico",
      icone: "🎓",
      titulo: "Núcleo Pedagógico e Formações",
      conteudo: "No Núcleo Pedagógico você cria e edita formações (tipo Batidas do Rio), define cronograma, link de preparação e pergunta de reflexão por encontro. Configure o Modo Econômico por padrão e o Modelo de Avaliação (Tradicional ou Atiçamento) para a experiência do Agente no celular. A Trava de Provas exige os links de evidência antes de concluir a formação.",
    },
    {
      id: "c-financeiro",
      icone: "💰",
      titulo: "Direção e Finanças",
      conteudo: "Na aba Direção e Finanças você acompanha indicadores, burn rate e aprovações de solicitações de pagamento. Mantenha os comprovantes (nota fiscal, PIX, prova visual) em dia para compliance.",
    },
    {
      id: "c-sincronizar",
      icone: "☁️",
      titulo: "Sincronização e Offline",
      conteudo: "Quando houver ações pendentes de rede, use Sincronizar para enviar os dados em fila. O sistema guarda no celular quando estiver offline e envia ao voltar o sinal. No Portal do Agente, o indicador \"Guardado no celular\" mostra que há itens na fila.",
    },
  ],
};

export const MANUAL_TIMONEIRO = {
  id: "timoneiro",
  titulo: "Manual do Timoneiro",
  icone: "🛶",
  descricao: "Para o Facilitador: turmas, diário de bordo e presenças.",
  secoes: [
    {
      id: "t-turmas",
      icone: "👥",
      titulo: "Minhas Turmas e Formações",
      conteudo: "Acesse o Núcleo Pedagógico para ver as formações sob sua responsabilidade. Abra uma formação para ver a lista de turmas, presenças e o Diário de Bordo da turma.",
    },
    {
      id: "t-diario",
      icone: "📔",
      titulo: "Diário de Bordo (Turma)",
      conteudo: "No Diário de Bordo você regista as presenças por encontro e a avaliação rápida de cada agente (Alerta / No Ritmo / Destaque). As reflexões que os agentes partilham no Mural da Turma aparecem no Portal do Agente; você pode acompanhar pelo detalhe da formação.",
    },
    {
      id: "t-presencas",
      icone: "📋",
      titulo: "Chamadas de Presença",
      conteudo: "Marque quem esteve presente em cada encontro. O sistema calcula a meta de presença mínima configurada na formação. Use o modo offline se estiver no campo: as chamadas são guardadas localmente e sincronizadas quando houver rede.",
    },
    {
      id: "t-trava",
      icone: "🔒",
      titulo: "Trava de Provas e Evidências",
      conteudo: "A formação só pode ser dada como concluída quando a Trava de Provas estiver satisfeita: link da Nota Fiscal, comprovante PIX, prova da aula (comprovação visual) e lista de presença. Preencha os links na pasta do Drive e atualize na formação.",
    },
    {
      id: "t-sincronizar",
      icone: "☁️",
      titulo: "Sincronizar no Campo",
      conteudo: "Em zonas de pouca rede, as alterações do Diário de Bordo e das presenças ficam em fila. Ao recuperar o sinal, use Sincronizar ou deixe a app abrir em segundo plano para enviar os dados pendentes.",
    },
  ],
};

export const MANUAL_TRIPULANTE = {
  id: "tripulante",
  titulo: "Manual do Tripulante",
  icone: "🎒",
  descricao: "Para o Agente Cultural: Portal do Agente, diário e missões.",
  secoes: [
    {
      id: "tr-portal",
      icone: "📱",
      titulo: "Portal do Agente",
      conteudo: "No Portal do Agente você vê a trilha de encontros da formação, o Meu Caderno (anotações guardadas automaticamente), as Missões e o Diário de Bordo com a pergunta de reflexão de cada encontro. Pode ativar o Modo Econômico para poupar dados e bateria.",
    },
    {
      id: "tr-diario",
      icone: "📝",
      titulo: "Meu Diário de Bordo",
      conteudo: "Em cada encontro há uma pergunta de reflexão (Eco). Escreva ou use o botão de microfone para relato por voz. Se marcar \"Postar no Mural da Turma\", sua reflexão será partilhada com os colegas na secção Mural de Ecos.",
    },
    {
      id: "tr-caderno",
      icone: "📓",
      titulo: "Meu Caderno e Salvamento",
      conteudo: "O Meu Caderno guarda as anotações automaticamente. Se estiver offline, o texto fica \"Guardado no celular\" e é enviado quando houver conexão. O indicador no topo mostra Sincronizado (verde) ou Guardado no celular (amarelo).",
    },
    {
      id: "tr-missoes",
      icone: "🎯",
      titulo: "Missões e Link de Prova",
      conteudo: "As missões atribuídas a você aparecem na formação. Envie o link da prova (vídeo, drive) quando concluir. A Régua de Maturidade (Semente, Broto, Fruto) mostra seu progresso na formação.",
    },
    {
      id: "tr-preparacao",
      icone: "🎧",
      titulo: "Link de Preparação",
      conteudo: "Antes de cada encontro, a formação pode ter um Link de Preparação (podcast, vídeo, PDF). Acesse para aquecer e chegar preparado ao encontro.",
    },
  ],
};

/** Retorna o manual ativo conforme o papel (comandante, timoneiro, tripulante). */
export function getManualPorPapel(papel) {
  if (papel === "comandante") return MANUAL_COMANDANTE;
  if (papel === "timoneiro") return MANUAL_TIMONEIRO;
  return MANUAL_TRIPULANTE;
}
