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
| `REC_DTA_ENT` | Data de previsão de entrega |
| `REC_HORA_ENT` | Turno de entrega (8=manhã, 14=tarde — não é horário literal) |
| `CONF` / `CONF_HORA` / `USR_CONF` | Conferência Farmacêutica: data, hora, responsável |
| `LABOR` / `LAB_HORA` / `USR_LAB` | Laboratório: data, hora, responsável |
| `BALCAO` / `BAL_HORA` / `USR_BAL` | Balcão: data, hora, responsável |
| `EMP_NOME` | Nome da filial (AMERICO ou MOEMA) |
| `VEND` | Vendedor/atendente |
| `CLI_FONE1` | Telefone do cliente |
| `REC_DTA_PREV` / `REC_HORA_PREV` | Data/turno secundário de previsão (M=Manhã, T=Tarde) |
| `SIT` | Situação em texto: CF, AT, BA, PO |
| `REC_LOCAL_ARMZ` | Local de armazenamento — **não utilizado** |
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
Receita entra
      ↓
[CONFERÊNCIA FARMACÊUTICA]  →  CONF + CONF_HORA + USR_CONF
      ↓
[LABORATÓRIO]               →  LABOR + LAB_HORA + USR_LAB
      ↓
[BALCÃO]                    →  BALCAO + BAL_HORA + USR_BAL
```

Campo vazio = etapa ainda não concluída.

---

## O que foi implementado (MVP)

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

---

## Próximos Passos

### V1 — Dashboard Operacional

- [ ] Agrupar receitas por turno de entrega (Manhã / Tarde)
- [ ] Ordenar por urgência: receitas com prazo mais próximo primeiro
- [ ] Destacar receitas do dia atual vs. dias futuros
- [ ] Separador visual por data de previsão
- [ ] Indicador de receitas sem nenhuma etapa iniciada (paradas)
- [ ] Distinção visual entre filiais AMERICO e MOEMA

### V2 — Indicadores de Produção

- [ ] Tempo médio por etapa (entrada → conf, conf → lab, lab → balcão)
- [ ] Gargalos: etapa com mais receitas paradas
- [ ] Volume por vendedor/atendente
- [ ] Volume por filial
- [ ] Taxa de atraso do dia

### V3 — Alertas

- [ ] Destacar receitas que ultrapassaram X horas em uma etapa
- [ ] Notificação visual de receitas críticas
- [ ] Filtro "em risco" (próximas do prazo e sem etapas concluídas)

### V4 — Integração com ERP

- [ ] Conexão direta (sem necessidade de exportar manualmente)
- [ ] Atualização automática dos dados

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
