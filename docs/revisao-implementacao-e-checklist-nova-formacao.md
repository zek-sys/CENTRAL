# Revisão do que foi implementado + Checklist antes de criar uma nova formação

**Data:** 27/02/2025  
**Objetivo:** Resumir as alterações feitas na Central Regatão e listar o que a Diretoria/Facilitador deve **checar antes de criar uma nova formação**.

---

## 1. Resumo do que foi feito (esta sessão)

### 1.1 Portal do Agente — Atiçamento Resiliente (`AreaDoAlunoPage.jsx`)

| Funcionalidade | Descrição |
|----------------|-----------|
| **Modo Econômico** | Toggle "⚡ Modo Econômico" no cabeçalho; quando ativo, imagens viram placeholders (poupa banda). Estado guardado em `localStorage` (`portal-agente-modo-economico`). |
| **Delta-Queue (Sync)** | Se estiver offline ou `updateDoc` falhar, ações (diário, caderno, dúvida, link, missão, especialidades) vão para uma fila no `localStorage`. Ao voltar online, a fila é enviada. Indicador: "☁️ Sincronizado" (verde) ou "💾 Guardado no celular" (amarelo). |
| **Régua de Maturidade** | Em vez de 4 etapas fixas, o Portal mostra **Semente 🌱 → Broto 🌿 → Fruto 🌳**. O nível sobe com base em `statusMaturidade` e entrega de missões. |
| **Ergonomia de toque** | Botões e inputs com mínimo 48×48 px; contraste de texto aumentado no modo escuro. |
| **Mural de Ecos** | Secção "Mural de Ecos" (Inteligência Coletiva) abaixo da trilha, com reflexões partilhadas pela turma. |
| **Relato por voz (Speech-to-Text)** | Botão de microfone 🎙️ no **Meu Caderno** e no campo **Reflexão** do Diário de Bordo. Usa Web Speech API; quando o browser não suporta, o ícone não aparece. Toast: "Microfone ativado. Fale agora para transcrever seu relato." |

### 1.2 Formulário Nova Formação (`FormularioFormacao.jsx`)

| Funcionalidade | Descrição |
|----------------|-----------|
| **Seção 1 — Configurações de Acessibilidade e Dados** | Toggle **"Ativar Modo Econômico por Padrão"** (`isLowDataDefault`). Select **"Modelo de Avaliação Pedagógica"**: "Tradicional (Notas 0-10)" ou "Atiçamento (Semente ➔ Broto ➔ Fruto)" (default: Atiçamento). |
| **Seção 2 — Cronograma de Encontros Dinâmico** | Em **cada encontro**: campo **"Link de Preparação / Aquecimento"** (URL: Spotify, YouTube, PDF no Drive) e **"Pergunta de Reflexão (Eco)"** (TextArea), que aparece no Diário do Agente para aquele encontro. |
| **Seção 3 — Trava de Provas e Documentação** | Campos **linkAvaliacoes** e **linkProvas** (pastas Drive) visíveis e editáveis; texto da Regra do Arquivo Leve. |
| **Persistência** | Todos os campos são gravados no documento da formação na coleção `acoes` (Firestore). URLs são passadas por `trim`. A ordem dos encontros em `modulos` e `cronograma` é preservada. |

### 1.3 Tipos Firestore (`src/types/actions.ts`)

- **ModuloFormacao** e **CronogramaItemFormacao**: `linkPreAula`, `perguntaMicroMissao`.
- **AcaoTipoD**: `isLowDataDefault`, `modeloAvaliacao` (`"tradicional"` | `"aticamento"`).

### 1.4 Portal do Agente — Consumo dos novos campos

- **Link de Preparação** por encontro: cada encontro pode ter o seu link (ou fallback para `formacao.linkPreAula`).
- **Pergunta de Reflexão**: o placeholder do campo de reflexão no Diário de Bordo usa `perguntaMicroMissao` do encontro (ex.: "Como essa batida se conecta com a sua comunidade?").
- **Modo Econômico por padrão**: se a formação tiver `isLowDataDefault === true` e o utilizador ainda não tiver preferência em `localStorage`, o Portal abre já em Modo Econômico.
- **Modelo de Avaliação**: se `formacao.modeloAvaliacao === "tradicional"`, o cabeçalho do Portal mostra a barra de 4 etapas (Inscrito → Formado); caso contrário, mostra a Régua de Maturidade (Semente/Broto/Fruto).

### 1.5 Guia de Bordo (`GuiaDeBordoPage.jsx`)

- **Rota:** `/guia`. No menu lateral: **"Guia de Bordo"** com ícone **Compass**.
- **Manuais por nível:** Diretoria → Manual do Comandante 🏛️; Facilitador (núcleo Pedagógico) → Manual do Timoneiro 🛶; restantes → Manual do Tripulante 🎒. Admin vê os três em **abas**.
- **Conteúdo:** Accordions por secção; termos como "Sincronizar", "Trava de Provas", "Modo Econômico" destacados em Amarelo Festival.
- **Offline:** Conteúdo estático no bundle; página lê-se sem rede após a primeira visita (PWA).

---

## 2. O que checar antes de criar uma nova formação

Use este checklist **antes** de abrir o formulário "Nova Formação" e clicar em "SALVAR FORMAÇÃO". Assim a experiência do Agente no celular fica alinhada ao que a Diretoria definiu.

### 2.1 Dados básicos e acessibilidade

| # | O que checar | Onde | Porquê |
|---|----------------|------|--------|
| 1 | **Título da formação** | Seção 1 | Obrigatório. Ex.: "Batidas do Rio". |
| 2 | **Eixo e Ação Continuada** | Seção 1 | Opcional; ajuda na matriz (raízes/troncos). |
| 3 | **Modo Econômico por Padrão** | Seção 1 — toggle | Se a turma usa muito dados no celular (rio/floresta), **ative**. O Portal do Agente abrirá sem imagens de capa por defeito para poupar banda. |
| 4 | **Modelo de Avaliação** | Seção 1 — select | **Tradicional:** barra de 4 etapas (Inscrito → Formado). **Atiçamento:** Régua Semente/Broto/Fruto. Escolha conforme a linguagem da formação. |

### 2.2 Cronograma de encontros

| # | O que checar | Onde | Porquê |
|---|----------------|------|--------|
| 5 | **Encontros criados** | Seção 2 | Pelo menos um encontro com nome (e opcionalmente data e carga). Use "Adicionar" para mais linhas. |
| 6 | **Link de Preparação** por encontro | Seção 2 — em cada bloco de encontro | Se houver podcast, vídeo ou PDF para o Agente ver **antes** do encontro, preencha o URL (Spotify, YouTube, Drive). Aparece no Portal como "🎯 Preparação" naquele encontro. |
| 7 | **Pergunta de Reflexão (Eco)** por encontro | Seção 2 — TextArea em cada encontro | É a pergunta que aparece no Diário de Bordo do Agente para aquele encontro. Ex.: "Como essa batida se conecta com a sua comunidade?" ou "O que você aprendeu hoje?". Se deixar em branco, usa o texto padrão. |

### 2.3 Materiais e links

| # | O que checar | Onde | Porquê |
|---|----------------|------|--------|
| 8 | **Link da pasta de materiais didáticos** | Seção 2 | Regra do Arquivo Leve: apenas link da pasta no Drive. O Agente vê como "📚 Material do Encontro". |
| 9 | **Link do formulário de inscrição** | Seção 3 | Google Forms (ou outro) para inscrições. |
| 10 | **Link da pasta de Avaliações** | Seção 3 | Pasta no Drive com avaliações da formação (Trava de Provas / documentação). |
| 11 | **Link da pasta de Provas** | Seção 3 | Pasta no Drive com provas. Necessário para concluir a formação com a Trava de Provas. |
| 12 | **Meta de presença mínima (%)** | Seção 3 | Opcional. Ex.: 80. Usado no cálculo de presença e relatórios. |

### 2.4 Após salvar a formação

| # | O que checar | Ação |
|---|----------------|------|
| 13 | **Turma (alunos)** | Se for usar a Área do Aluno, importe a turma (CSV) na formação para que os agentes entrem com WhatsApp + PIN. |
| 14 | **Testar no Portal do Agente** | Abra a formação como Agente (ou use login aluno) e confira: link de preparação por encontro, pergunta de reflexão no Diário, Modo Econômico (se ativou por padrão), tipo de evolução (barra 4 etapas ou Régua Semente/Broto/Fruto). |
| 15 | **Diário de Bordo (Facilitador)** | Ao marcar presenças e reflexões, use "Sincronizar" quando houver rede para não perder dados. |

---

## 3. Checklist rápido (imprimir ou colar no Mural)

Antes de **criar uma nova formação**, confirme:

- [ ] Título e (se quiser) eixo/programa preenchidos  
- [ ] Modo Econômico por Padrão: ligado se a turma estiver em contexto de pouca rede  
- [ ] Modelo de Avaliação escolhido (Tradicional ou Atiçamento)  
- [ ] Pelo menos um encontro com nome; por encontro, se aplicável:  
  - [ ] Link de Preparação (URL)  
  - [ ] Pergunta de Reflexão (Eco)  
- [ ] Link da pasta de materiais didáticos (Drive)  
- [ ] Link do formulário de inscrição  
- [ ] Links das pastas de Avaliações e Provas (Trava de Provas)  
- [ ] Após salvar: importar turma (CSV) e testar o Portal do Agente  

---

## 4. Ficheiros principais alterados (referência)

| Ficheiro | Função |
|----------|--------|
| `src/pages/AreaDoAlunoPage.jsx` | Portal do Agente: Modo Econômico, sync queue, Régua de Maturidade, relato por voz, link/pregunta por encontro, isLowDataDefault, modeloAvaliacao. |
| `src/components/pedagogico/FormularioFormacao.jsx` | Formulário Nova Formação: seções 1–3, isLowDataDefault, modeloAvaliacao, linkPreAula e perguntaMicroMissao por encontro, Trava de Provas. |
| `src/types/actions.ts` | Tipos: linkPreAula, perguntaMicroMissao (modulos/cronograma); isLowDataDefault, modeloAvaliacao (AcaoTipoD). |
| `src/hooks/useSpeechRecognition.js` | Hook de transcrição de voz (Web Speech API). |
| `src/lib/portalAgenteSyncQueue.js` | Fila de sincronização do Portal (localStorage). |
| `src/screens/GuiaDeBordoPage.jsx` | Página Guia de Bordo com manuais por nível. |
| `src/data/guiaDeBordoManuais.js` | Conteúdo dos manuais Comandante, Timoneiro, Tripulante. |
| `src/components/layout/Sidebar.jsx` | Item "Guia de Bordo" com ícone Compass. |
| `src/index.css` | Classe `.portal-modo-economico` e animação `.relato-oral-pulse`. |

---

*Documento gerado a partir da revisão do código e das alterações da sessão de 27/02/2025.*
