# Formulário "Nova Formação" — Resumo atual e sugestões de refinamento

## Onde está

- **Componente:** `src/components/pedagogico/FormularioFormacao.jsx`
- **Uso:** 
  - `SetorPedagogico.jsx` — drawer "Nova Formação" e edição ao clicar numa formação
  - `NucleoPedagogicoPage.jsx` — modal/drawer ao clicar em "CRIAR NOVA FORMAÇÃO"
- **Persistência:** Firestore em `artifacts/{appId}/public/data/acoes` como documento com `tipoAcao: "D"` (Formação). Na criação: `responsavelId`, `status: "pendente"`, `projetoId: "PROJ-TRANSVERSAL"`, `evidencias: EVIDENCIAS_FORMACAO_VAZIAS`, `pedagogicoPresencaCount: 0`.

---

## Estrutura atual do formulário

### Layout

- **Tela cheia** (fixed inset-0), fundo preto, texto claro (mobile-first, modo escuro).
- **Header fixo:** título "Nova Formação" ou "Editar Formação" + botão fechar (X).
- **Conteúdo** em 3 **accordions** (seções expansíveis). Estado inicial: secção 1 aberta, 2 e 3 fechadas.
- **Rodapé fixo:** botão único "SALVAR FORMAÇÃO" (Amarelo Festival #EBE22F).

### 1. Dados básicos

| Campo | Tipo | Obrigatório | Observação |
|-------|------|-------------|------------|
| **Título da Formação** | text | Sim | Placeholder: "Ex: Batidas do Rio" |
| **Eixo Estratégico (Nível 1)** | select | Não | Opções de `eixos` (raízes da matriz) |
| **Ação Continuada (Nível 2)** | select | Não | Filtrado por eixo; "troncos da árvore" |
| **Tema Principal** | text | Não | Ex: Ritmo e percussão |
| **Facilitador Principal** | text | Não | Ex: Zek Picoteiro |
| **Carga Horária Total (h)** | number | Não | Ex: 32 |
| **Número de Vagas** | number | Não | Ex: 20 |
| **Prazo final** | date | Não | Opcional |

- Textos de ajuda sob Eixo e Ação Continuada explicando a matriz (raízes/troncos).

### 2. Estrutura pedagógica

| Campo | Tipo | Obrigatório | Observação |
|-------|------|-------------|------------|
| **Ementa resumida** | textarea (4 linhas) | Não | Resumo do curso, objetivos e conteúdo |
| **Encontros / Cronograma** | lista dinâmica | Não | Por linha: Nome do encontro, Data, Carga (h). Botão "Adicionar" e remover por linha. Mínimo 1 linha. |
| **Link da pasta de materiais didáticos** | url | Não | Google Drive — "Regra do Arquivo Leve" |

- **Cronograma:** ao salvar, vira `cronograma` (com `dataInicio`/`dataFim`) e `modulos` (com `titulo`, `cargaHoraria`). Linhas vazias são filtradas; linhas com só título geram "Encontro" e data padrão hoje.

### 3. Compliance e inscrições

| Campo | Tipo | Obrigatório | Observação |
|-------|------|-------------|------------|
| **Link do formulário de inscrição (Google Forms)** | url | Não | Inscrições |
| **Link da pasta de Avaliações (Google Drive)** | url | Não | Opcional |
| **Link da pasta de Provas (Google Drive)** | url | Não | Trava de Provas |
| **Meta de presença mínima (%)** | number 0–100, step 5 | Não | Ex: 80 |

---

## Regras de negócio atuais

- **Criação:** exige `titulo` e `responsavelId` (passado por prop; se não houver, mostra erro "Responsável é obrigatório para criar").
- **Edição:** preenche todos os campos a partir de `formacao`; `cronograma` e `modulos` são fundidos (prioridade cronograma se existir).
- **Eixo/Programa:** ao trocar eixo, o programa selecionado é limpo se não pertencer ao eixo.
- **Payload:** todos os campos opcionais vazios viram `null`; números válidos são enviados como número; `prazoFinal` como `Timestamp`; `atualizadoEm: Timestamp.now()` sempre.

---

## UX e acessibilidade atuais

- Inputs: `min-h-[48px]`, bordas `zinc-600`/`zinc-800`, focus com Amarelo Festival.
- Accordions: botão com `min-h-[52px]`.
- Alguns botões secundários (Adicionar linha, Remover) ainda com `min-h-[44px]` / `min-w-[44px]` — abaixo do ideal 48px para toque.
- Mensagem de erro em banner amarelo acima do conteúdo.
- Sem validação de URL (apenas trim e null se vazio).
- Sem modo offline/fila de sync neste formulário (diferente do Portal do Agente).

---

## Sugestões de refinamento

### Conteúdo e campos

1. **Link Pré-Aula**  
   O Portal do Agente usa `formacao.linkPreAula`. Considerar adicionar no formulário (ex.: na secção 2), para o agente aceder antes do encontro.

2. **Link para o caderno / materiais**  
   Já existe `linkMateriaisDidaticos`. Garantir que o rótulo ou ajuda deixe claro que é o mesmo "Link do Caderno" usado no Portal do Agente.

3. **Mural da Turma / Mural de Ecos**  
   O mural é preenchido pelos agentes (reflexões). Não precisa de campo no formulário da formação; apenas confirmar que a formação expõe `muralTurma` (array) quando existir.

4. **Checklists da formação**  
   O tipo D tem `checklists` (ex.: encontros concluídos). O formulário não edita checklists; podem ser criados/geridos noutra tela (ex.: detalhe da formação) ou um futuro bloco "Marcar encontros concluídos" aqui.

5. **Evidências (NF, PIX, Comprovação, Lista de Presença)**  
   Não estão no formulário; são preenchidas noutro fluxo (compliance). Manter assim, mas no resumo da formação pode mostrar se está "Trava satisfeita" ou não.

### UX e acessibilidade

6. **Alvos de toque ≥ 48px**  
   Ajustar "Adicionar" e o botão de remover linha do cronograma para `min-h-[48px]` e `min-w-[48px]` para alinhar ao Portal do Agente e boas práticas de toque.

7. **Validação de URLs**  
   Opcional: validar formato de URL nos campos de link (ex.: regex ou `new URL()`) e mostrar erro inline ou sob o campo, em vez de falhar só ao usar o link.

8. **Indicador de progresso / etapas**  
   Opcional: barra ou steps "Dados básicos → Estrutura → Compliance" para indicar em que etapa está e quantas secções preenchidas.

9. **Salvar rascunho / offline**  
   Para contextos de baixa conectividade: guardar rascunho em `localStorage` (ou fila como no Portal do Agente) quando "SALVAR FORMAÇÃO" falhar ou estiver offline, e reenviar ao voltar online.

10. **Confirmação ao fechar**  
    Se o utilizador preencheu algo e clica em Fechar (X), perguntar "Descartar alterações?" para evitar perda acidental.

### Consistência visual

11. **Rosa Bregoso em ações secundárias**  
    Manter Amarelo Festival no "SALVAR FORMAÇÃO". Em botões secundários (ex.: "Adicionar" do cronograma), usar Rosa Bregoso (#db2669) para alinhar ao resto da Central.

12. **Título da secção 2**  
    Pode passar a "Estrutura pedagógica e materiais" para deixar claro que inclui link de materiais/caderno.

---

## Resumo rápido (checklist para refinamento)

- [ ] Adicionar **Link Pré-Aula** (secção 2) se for usado no Portal.
- [ ] Garantir **48×48 px** em todos os botões (Adicionar, Remover linha).
- [ ] Opcional: **validação de URL** nos links.
- [ ] Opcional: **salvar rascunho / fila offline** ao falhar ou sem rede.
- [ ] Opcional: **confirmar ao fechar** se houver alterações.
- [ ] Opcional: **indicador de etapas** (1 → 2 → 3).
- [ ] **Rosa Bregoso** em botões secundários; **Amarelo Festival** só no SALVAR.

Se quiser, posso implementar no código alguma destas sugestões (por exemplo: Link Pré-Aula, 48px nos botões e confirmação ao fechar).
