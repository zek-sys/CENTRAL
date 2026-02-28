# Relatório de Status de Implementação — Central Regatão

**Contexto:** Preparação para MVP com a turma "Batidas do Rio" (Formação de DJs).  
**Referência:** `docs/arquitetura.md` e `docs/desenvolvimento-pratico.md`.  
**Data:** 27/02/2025.  
**Atualização:** Hub de Notas e Tarefas Interativas (Diário de Bordo StickyNote, Área do Aluno Caderno/Missões/Dúvida, contador dúvidas em Minhas Turmas) implementado e build validado.

---

## 1. O que já está pronto e rodando

### Rotas e navegação
- [x] Rotas conforme arquitetura: `/minhas-tarefas`, `/perfil`, `/cultura`, `/projetos`, `/projetos/:id`, `/gestao`, `/comunicacao`, `/nucleo-pedagogico`, `/nucleo-pedagogico/:id`, `/area-aluno/:id`, `/login-aluno`.
- [x] Página inicial unificada em `/minhas-tarefas` (DEFAULT_PATH).
- [x] Sincronização path ↔ aba (pathToTab, tabToPath em `src/routes.ts`).
- [x] Sidebar + BottomNav; redirecionamento por nível (admin, diretoria, nível 4).

### Autenticação e segurança
- [x] Login por e-mail/senha e Google (whitelist em Firestore).
- [x] Perfil em `artifacts/{appId}/public/data/usuarios/{uid}`; timeout de 15s para perfil mínimo.
- [x] `ProtectedRoute` para rotas admin-only e diretoria-only.
- [x] Nível 4: vista restrita "Minhas Entregas" sem menu.
- [x] Check-in no porto (vinculação de ações por e-mail ao UID).

### Paleta e identidade visual
- [x] Tokens em `src/theme/regatao.ts`: AMARELO_REGATAO (#EBE22F), VERDE_AMAZONIA, ROSA_BREGOSO, BG_DEEP, BG_CARD, BUTTON_MIN_HEIGHT_PX.
- [x] Modo escuro padrão; ThemeContext (light/soft/brand/dark).
- [x] Componentes visuais reutilizáveis (BadgeStatus, RegataoCard, NavItem, etc.).

### Minhas Tarefas e Kanban
- [x] Consulta `acoes` com `responsavelId === uid`; status ativos (excluindo concluído no Kanban).
- [x] Kanban horizontal (mobile-first), arrastar e soltar (DnD).
- [x] Detalhe da tarefa (TaskDetailPage, TaskDetailDrawer); conclusão com evidências.
- [x] Trava de compliance Tipo A: 3 links (Nota Fiscal, Comprovante, Prova Visual) via `UploadEvidencias`; botão Concluir desabilitado até preenchidos.
- [x] Trava Formação (Tipo D): 4 links (NF, PIX, Prova da Aula, Lista de Presença) em `ModalConcluirFormacao`; `evidenciasFormacaoCompletas` em `src/types/actions.ts`.
- [x] useTaskManager: atualizar status, evidências, concluir; integração com fila offline.

### Projetos
- [x] Lista (ProjetosVisaoGeral), detalhe (ProjetoDetalheScreen), novo (NovoProjetoPage) com gravação no Firestore.
- [x] Abas no detalhe: Visão Geral, Kanban, Cronograma (sem recarregar a página).
- [x] Filtro de projetos não arquivados (`status !== 'arquivado'`).

### Núcleo Pedagógico (Formações — Tipo D)
- [x] Lista de formações (`SetorPedagogico`) com `useFormacoes` (query `tipoAcao === "D"`).
- [x] Página detalhada da formação (`FormacaoDetalheScreen`): ementa, carga horária, módulos, cronograma, links de inscrição/avaliações/provas (somente leitura), presença.
- [x] Formulário criar/editar formação (`FormularioFormacao`): título, eixo, programa, tema, instrutor, carga horária, vagas, ementa, módulos/cronograma, link materiais didáticos, link Google Forms inscrição, meta de presença mínima; grava em `acoes` com `tipoAcao: "D"`.
- [x] Cadastro de turma: `ImportadorCSV` importa planilha (Google Forms) e grava na coleção `alunos` (formacaoId, nomeArtistico, comunidade, idade, whatsapp, pin, status).
- [x] Marcar presença: `DiarioDeBordoModal` — lista de alunos por formação, P/F por módulo/aula, persistência local (localStorage) e botão "Sincronizar chamada" que faz `updateDoc` em `acoes` com `chamadasPresenca` e `pedagogicoPresencaCount`.
- [x] Conclusão da formação: exige 4 links (Tríade + Lista de Presença); `ModalConcluirFormacao` e `podeConcluirFormacao` em `types/actions.ts`.

### Área do Aluno
- [x] Login aluno (`LoginAlunoPage`): validação por WhatsApp + PIN na coleção `alunos`.
- [x] Área do aluno (`AreaDoAlunoPage`) com layout mínimo quando sessão aluno válida (sem Firebase Auth).

### Outras telas
- [x] Perfil (PerfilScreen); Cultura e Manuais (CulturaManuaisScreen); Conheça o Instituto; Guia da Aprendizagem; Cronograma Geral; Mapa do Impacto; Gestão Estratégica; Financeiro (FinanceiroHub); Comunicação (ComunicacaoScreen — leitura de `comunicacao_agenda` e atalhos Drive).
- [x] Núcleos (Gestão, Comunicação, Campo, Pedagógico) com NucleoLayout e páginas específicas.
- [x] Master Outliner (admin); Minhas Entregas (nível 4).

### Dados e backend
- [x] Firestore: eixos, programas, projetos, acoes, kpis, usuarios, alunos; path `artifacts/{appId}/public/data/...`.
- [x] Regras Firestore em `firestore.rules` (usuários, alunos, acoes, projetos, eixos, programas, kpis, financeiro_lancamentos, etc.).

---

## 2. O que está implementado pela metade

- **Links "Trava de Provas" (Drive) na Formação**  
  A arquitetura prevê `linkAvaliacoes` e `linkProvas` (links para pastas no Drive). Eles existem no tipo (`AcaoTipoD`) e são exibidos em `FormacaoDetalheScreen` quando preenchidos. Porém **não há campos no `FormularioFormacao`** para o usuário editar esses dois links. Ou seja: não há UI para a equipe pedagógica configurar o "Link do Drive" da Trava de Provas na criação/edição da formação.
  - **Ação:** Adicionar no formulário de formação (criar/editar) dois campos opcionais: "Link da pasta de Avaliações (Drive)" e "Link da pasta de Provas (Drive)", persistindo em `linkAvaliacoes` e `linkProvas` no documento da ação.

- **Regras Firestore para `acoes`**  
  Em `firestore.rules`, a condição de update em `acoes` usa `resource.data.responsavelUid`. No código (useTaskManager, checkInNoPorto, etc.) o campo usado é `responsavelId` ou `uidResponsavel`. Pode haver documento com apenas um deles, gerando bloqueio ou permissão indevida.
  - **Ação:** Alinhar regras ao schema real (ex.: permitir update se `request.auth.uid == resource.data.responsavelId` ou `resource.data.responsavelUid` ou `resource.data.uidResponsavel`, ou ehDiretoria).

- **Comunicação**  
  Tela existe e lê a coleção `comunicacao_agenda`. Não foi verificada persistência de novos itens de agenda pela própria tela (ex.: botão "Salvar" que escreve no Firestore).
  - **Ação:** Confirmar se há fluxo de escrita na tela; se não houver, documentar como "somente leitura" ou implementar o CRUD de agenda.

- **Arquivos e Documentos**  
  Rota/aba existem; conteúdo é placeholder "Arquivos e Documentos — Em integração".
  - **Ação:** Definir escopo (links Drive, lista de documentos, etc.) e implementar ou manter como fora do MVP.

- **Novo Projeto e fila offline**  
  `NovoProjetoPage` grava direto com `addDoc` quando online. O guia de desenvolvimento menciona "Guardar no Celular" para modo sem rede; a fila offline (`offlineQueue.ts`) já suporta `create_projeto`, mas o fluxo de "novo projeto" não foi verificado se usa a fila quando offline.
  - **Ação:** Garantir que, em modo offline, criação de projeto entre na fila e seja enviada ao voltar online (ou documentar que novo projeto exige conexão no MVP).

---

## 3. O que falta para o MVP "Batidas do Rio"

Checklist para a equipe pedagógica conseguir **cadastrar a turma**, **marcar presença** e **aplicar a Trava de Provas (link do Drive)**.

| # | Item | Status | Observação |
|---|------|--------|------------|
| 1 | **Cadastrar a turma** | ✅ Pronto | Importador CSV na formação (Gestão de Turma no drawer/detalhe da formação). Grava em `alunos` com formacaoId. |
| 2 | **Marcar presença** | ✅ Pronto | Diário de Bordo (turma): lista de alunos por formação, P/F por módulo, sync para Firestore ao clicar "Sincronizar chamada". |
| 3 | **Trava de Provas (link do Drive)** | ✅ Pronto | Formulário de formação já inclui "Link da pasta de Avaliações" e "Link da pasta de Provas" (linkAvaliacoes, linkProvas). Conclusão da formação exige 4 links (NF, PIX, Prova da Aula, Lista de Presença). |

Itens para fechar o MVP Batidas do Rio:

1. ~~**Formulário de Formação (criar/editar)** — Adicionar linkAvaliacoes e linkProvas~~ ✅ Já implementado em `FormularioFormacao.jsx` (secção "Compliance e inscrições").
2. **Teste de fluxo completo**  
   - **Como fazer:** Use o **Roteiro de Teste Manual** em `docs/roteiro-teste-manual-mvp.md`.  
   - Passos: criar formação "Batidas do Rio" com eixo/programa, link de inscrição (Forms) e links de avaliações/provas → importar CSV de inscritos → abrir Diário de Bordo, marcar presenças por módulo e sincronizar → preencher os 4 links de evidências e concluir a formação.  
   - (Opcional) Validar login do aluno (WhatsApp + PIN) e área do aluno (Meu Caderno, Minhas Missões, Dúvida ao Facilitador).  
   - Para **automação E2E** no futuro: ver secção "Automação E2E" no mesmo roteiro (ex.: Playwright/Cypress).

3. ~~**Regras Firestore** — Ajustar update em `acoes`~~ ✅ Regras já permitem `responsavelId`, `responsavelUid`, `uidResponsavel` e `ehDiretoria(appId)`.

---

## 4. Status do Motor Offline

| Componente | Status | Detalhes |
|------------|--------|----------|
| **Service Worker** | ✅ Configurado | `vite-plugin-pwa` (VitePWA) em `vite.config.ts`. Workbox: precache de assets, NetworkFirst para Firestore, CacheFirst para Google Fonts, navigateFallback para SPA. |
| **Registro do SW** | ✅ Em produção | Em `src/main.tsx`: `if ('serviceWorker' in navigator && import.meta.env.PROD)` chama `registerSW({ immediate: true })` (virtual:pwa-register). Em desenvolvimento o SW não é registrado por padrão; `devOptions: { enabled: true }` permite testar em dev. |
| **Persistência Firestore** | ✅ Ativa | Em `src/core/firebase.js`: `enableIndexedDbPersistence(db)`. Tratamento de `failed-precondition` (múltiplas abas) e `unimplemented` (browser não suportado). |
| **Fila offline (IndexedDB)** | ✅ Implementada | `src/lib/offlineQueue.ts`: store `pending_sync`, tipos `update_status`, `update_evidencias`, `update_rsvp`, `create_acao`, `create_projeto`. |
| **Uso da fila** | ✅ Integrado | `useTaskManager` grava mutações na fila quando Firestore falha (rede) e faz flush no evento `online`. `MinhasTarefasKanbanDinamico` usa `addPendingMutation` para criação de ação e flush ao voltar online. |
| **Diário de Bordo** | ✅ Híbrido | Presenças guardadas em localStorage por formação/módulo; botão "Sincronizar chamada" envia `chamadasPresenca` e `pedagogicoPresencaCount` para o Firestore quando online. |

Resumo: o Motor Offline está configurado — Service Worker (produção), persistência Firestore (IndexedDB) e fila de mutações (IndexedDB + flush ao reconectar) estão implementados e em uso nas tarefas e no Diário de Bordo.

---

## 5. Checklist resumido (MVP Batidas do Rio)

- [x] Telas e navegação conforme arquitetura  
- [x] Paleta e componentes visuais  
- [x] Login e níveis de acesso  
- [x] Minhas Tarefas + Kanban + Trava de compliance (Tipo A e D)  
- [x] Projetos (lista, detalhe, novo, abas)  
- [x] Núcleo Pedagógico: lista e detalhe de formações  
- [x] Cadastro de turma (importação CSV → `alunos`)  
- [x] Marcar presença (Diário de Bordo + sync Firestore)  
- [x] **Hub de Notas e Tarefas Interativas (Módulo Pedagógico):**  
  - **Diário de Bordo (Facilitador):** ícone StickyNote por agente, área "Observações Pedagógicas", opção "Criar como Tarefa (Nível 4)" com Atribuir a + prazo; ao sincronizar cria documento em `acoes` (tipo B) vinculado ao projeto da formação.  
  - **Área do Aluno:** bloco "Meu Caderno" (textarea com salvamento automático em `cadernoVirtual`), "Minhas Missões" (tarefas Nível 4 do agente na formação + anexar link de prova), "Dúvida ao Facilitador" (envio para `duvidasPendentes` no doc da formação).  
  - **Minhas Turmas (Facilitador):** ícone MessageCircle com contador quando há `duvidasPendentes` na formação.  
- [x] Conclusão de formação com 4 links (Tríade + Lista de Presença)  
- [x] **Campos linkAvaliacoes e linkProvas no formulário de formação** (Trava de Provas — link Drive)  
- [x] **Regras Firestore** para `acoes` já consideram `responsavelId`, `responsavelUid`, `uidResponsavel` e `ehDiretoria`.  
- [x] Área do Aluno (login WhatsApp+PIN, página por formação)  
- [x] Service Worker e persistência Firestore  
- [x] Fila offline para tarefas e uso no online  
- [x] **Campos linkAvaliacoes e linkProvas no formulário de formação (Trava de Provas — link Drive)**  
- [x] **Regras Firestore** para `acoes` alinhadas ao campo responsável (`responsavelId` / `responsavelUid` / `uidResponsavel`).  
- [ ] **Teste E2E do fluxo:** criar formação → importar turma → presença → concluir com evidências.  
  **Como fazer:** seguir o roteiro em **`docs/roteiro-teste-manual-mvp.md`** (teste manual com a diretoria); automação (ex.: Playwright) pode ser adicionada depois.  

**Antes de criar uma nova formação:** use o checklist em **`docs/revisao-implementacao-e-checklist-nova-formacao.md`** (Modo Econômico por padrão, Modelo de Avaliação, Link de Preparação e Pergunta de Reflexão por encontro, Trava de Provas, etc.).

---

*Documento gerado a partir da varredura do código e do cruzamento com `docs/arquitetura.md` e `docs/desenvolvimento-pratico.md`.*
