# Busca Fórmula — Contexto do Projeto

## O que é este projeto

Plataforma web complementar ao ERP de um laboratório de fórmulas manipuladas.
O ERP exporta relatórios CSV com dados de produção — esta plataforma transforma esses dados em uma esteira visual de acompanhamento operacional.

**Não substitui o ERP.** É uma camada de visualização sobre os dados exportados.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16.2.9 (App Router) |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS v4 |
| Leitura de arquivos | FileReader nativo (client-side) |
| Deploy | Vercel (free tier) |
| Repositório | https://github.com/italogfmedeiros-star/busca-formula |

---

## Estrutura de Pastas

```
busca-formula/
├── app/                    ← Next.js App Router
│   ├── page.tsx            ← página principal (upload + esteira)
│   ├── layout.tsx          ← layout raiz (título, fonte, tema claro)
│   ├── globals.css         ← CSS global (sem dark mode — fixado em light)
│   └── favicon.ico
├── components/
│   ├── UploadArea.tsx      ← área de upload drag-and-drop
│   └── Esteira.tsx         ← cards de receitas, filtros, barras de progresso
├── lib/
│   └── parser.ts           ← parser do CSV do ERP + tipos + helpers
├── public/
├── busca-formula.md        ← briefing original do projeto
├── CLAUDE.md               ← este arquivo
├── package.json
└── ...config files
```

---

## Fonte de Dados

Relatório **"Controle Interno"** exportado do ERP em formato CSV.

- Separador: `;`
- Encoding: `latin1`
- Processamento: 100% client-side (sem backend)

### Mapeamento de Campos (Validado)

| Campo CSV | Significado |
|---|---|
| `REC_ID` | Número da receita |
| `REC_SEQ` | Sequência da fórmula dentro da receita (0, 1, 2...) |
| `REC_FLG_SITUACAO` | Flag numérico de situação (1/2/3) |
| `REC_EMP_ID` | ID da filial (1=AMERICO, 2=MOEMA) |
| `CLI_RAZAO` | Nome do cliente |
| `REC_VL_FINAL` | Valor da fórmula em R$ |
| `REC_DTA_ENT` | **Data de previsão de entrega** (`dtaPrev`) — usada para agrupamento por dia e alerta "isHoje" |
| `REC_HORA_ENT` | **Modal de expedição** (`horaPrev`): 8=Entrega Motoboy, 11=Azul Cargo, 12=SEDEX, 14=Retirada no Balcão, 0=Sem horário |
| `CONF` / `CONF_HORA` / `USR_CONF` | Conferência Farmacêutica: data, hora, responsável |
| `LABOR` / `LAB_HORA` / `USR_LAB` | Laboratório: data, hora, responsável |
| `BALCAO` / `BAL_HORA` / `USR_BAL` | Balcão: data, hora, responsável |
| `EMP_NOME` | Nome da filial (AMERICO ou MOEMA) |
| `VEND` | Vendedor/atendente |
| `CLI_FONE1` | Telefone do cliente |
| `REC_DTA_PREV` / `REC_HORA_PREV` | **não utilizados** |
| `SIT` | Situação em texto: CF, AT, BA, PO |
| `REC_LOCAL_ARMZ` | **Despacho/Expedição**: quem está com a fórmula — `V`=Vini (motoboy), `A`=Aldrin (motoboy), `L`=Loja (retirada). Outros valores ou vazio = não despachado. |
| `PLAN_DTA` / `PLAN_RESOL` | Planilha de ocorrência — **não utilizado** |

### Situações

| Código | Significado | Cor |
|---|---|---|
| `CF` | Conforme | Verde |
| `AT` | Atraso | Vermelho |
| `BA` | Balcão c/Atraso | Azul |
| `PO` | Planilha de Ocorrências | Amarelo |

### Fluxo de Produção

```
Receita entra (andar de baixo)
      ↓
[CONFERÊNCIA FARMACÊUTICA]  →  CONF + CONF_HORA + USR_CONF   (andar de baixo)
      ↓  farmacêutico confere e libera para o lab
[LABORATÓRIO / MANIPULAÇÃO] →  LABOR + LAB_HORA + USR_LAB    (andar de cima)
      ↓  fórmula pronta, responsável confere saída
[BALCÃO / EXPEDIÇÃO]        →  BALCAO + BAL_HORA + USR_BAL   (andar de baixo)
```

Campo vazio = etapa ainda não concluída.

**Estados de gargalo:**
- Sem `CONF` → "Aguardando Conferência" (andar de baixo, ainda na entrada)
- Com `CONF`, sem `LABOR` → "Em Laboratório" (andar de cima, em manipulação)
- Com `LABOR`, sem `BALCAO` → "Aguardando Balcão" (desceu do lab, aguarda expedição)

---

## O que foi implementado

### MVP

- [x] Upload de CSV por drag-and-drop ou clique
- [x] Parser do relatório Controle Interno (encoding latin1, separador `;`)
- [x] Agrupamento de fórmulas por receita (`REC_ID`)
- [x] Cálculo de valor total por receita
- [x] Barras de progresso por etapa de cada fórmula
- [x] Cards coloridos por situação com barra lateral e badge
- [x] Contadores de situação (Conforme / Atraso / Balcão c/Atraso / Ocorrência)
- [x] Filtro por situação, filial e busca por cliente/receita
- [x] Expansão de responsáveis por etapa (conf, lab, balcão)
- [x] Tema claro fixo (sem dependência do modo escuro do sistema)
- [x] Deploy na Vercel

### V1 — Dashboard Operacional ✅ Concluído

- [x] Agrupar receitas por modal de expedição (Motoboy / Azul / SEDEX / Retirada / Sem horário)
- [x] Ordenar por urgência dentro de cada grupo (AT → BA → PO → CF)
- [x] Destacar receitas do dia atual vs. dias futuros
- [x] Separador visual por data de previsão
- [x] Indicador de receitas sem nenhuma etapa iniciada ("Sem início")
- [x] Distinção visual entre filiais AMERICO e MOEMA

### V2 — Indicadores de Produção ✅ Concluído

- [x] Tempo médio por etapa (conf→lab, lab→balcão)
- [x] Gargalo: etapa com mais receitas paradas
- [x] Volume por vendedor/atendente
- [x] Volume por filial
- [x] Taxa de atraso do dia

### V3 — Alertas ✅ Concluído

- [x] Badges de alerta por receita (Crítica / Em risco / Conf. parada / Lab parado)
- [x] Ring vermelho pulsante em receitas críticas
- [x] Filtro "Em risco" no dashboard
- [x] Contador de receitas em alerta nos indicadores

> **Limites de alerta FICTÍCIOS — validar com gestor:**
> - Conferência parada: `LIMITE_CONF_H = 2h` (lib/parser.ts)
> - Laboratório parado: `LIMITE_LAB_H = 4h` (lib/parser.ts)

### V4 — Integração com ERP (em andamento)

- [x] Watcher de pasta com chokidar (lib/watcher.ts)
- [x] Inicialização automática via instrumentation.ts
- [x] API Route GET /api/receitas com cache em memória
- [x] Polling a cada 30s no frontend
- [x] Exibição do timestamp de exportação (extraído do nome do arquivo)
- [ ] Configurar `PASTA_RELATORIOS` no servidor e instalar Node.js
- [ ] V4-SQL: query direta ao banco do ERP via `mssql` (requer acesso VPN ao SQL Server)

---

## Regras Importantes

1. **Não assuma significados de campos sem validação** — o processo produtivo do laboratório tem nomenclaturas específicas.
2. **Construção iterativa** — valide regras de negócio antes de implementar.
3. **Sem backend no MVP** — todo processamento é client-side.
4. **Tema sempre claro** — o `@media (prefers-color-scheme: dark)` foi removido intencionalmente do `globals.css`.

---

## Como rodar localmente

```bash
npm install
npm run dev
# acesse http://localhost:3000
```

## Como fazer deploy

```bash
git add .
git commit -m "descrição"
git push
# Vercel faz deploy automático ao receber o push na branch main
```
