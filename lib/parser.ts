export type Situacao = "CF" | "AT" | "BA" | "PO" | "?";

export interface Receita {
  recId: string;
  recSeq: number;
  situacao: Situacao;
  empId: number;
  empNome: string;
  cliente: string;
  valor: number;
  dtaPrev: string;
  horaPrev: number;
  confData: string;
  confHora: string;
  usrConf: string;
  laborData: string;
  laborHora: string;
  usrLab: string;
  balcaoData: string;
  balcaoHora: string;
  usrBal: string;
  vendedor: string;
  telefone: string;
  sit: string;
}

export interface ReceitaGroup {
  recId: string;
  cliente: string;
  empNome: string;
  vendedor: string;
  telefone: string;
  dtaPrev: string;
  horaPrev: number;
  situacao: Situacao;
  formulas: Receita[];
  totalValor: number;
}

const SIT_MAP: Record<string, Situacao> = {
  CF: "CF",
  AT: "AT",
  BA: "BA",
  PO: "PO",
};

export function parseCSV(text: string): Receita[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) throw new Error("CSV vazio");

  // Remove header
  const rows = lines.slice(1);

  return rows
    .map((line) => {
      const cols = line.split(";");
      // Columns: REC_ID;REC_SEQ;REC_FLG_SITUACAO;REC_EMP_ID;CLI_RAZAO;REC_VL_FINAL;
      //          REC_DTA_ENT;REC_HORA_ENT;CONF;CONF_HORA;USR_CONF;
      //          LABOR;LAB_HORA;USR_LAB;BALCAO;BAL_HORA;USR_BAL;
      //          REC_LOCAL_ARMZ;EMP_NOME;VEND;CLI_FONE1;
      //          REC_DTA_PREV;REC_HORA_PREV;PLAN_DTA;PLAN_RESOL;SIT
      const sit = (cols[25] ?? "").trim().toUpperCase();
      return {
        recId: (cols[0] ?? "").trim(),
        recSeq: parseInt(cols[1] ?? "0", 10),
        situacao: (SIT_MAP[sit] ?? "?") as Situacao,
        empId: parseInt(cols[3] ?? "0", 10),
        empNome: (cols[18] ?? "").trim(),
        cliente: (cols[4] ?? "").trim(),
        valor: parseFloat((cols[5] ?? "0").replace(",", ".")),
        dtaPrev: (cols[6] ?? "").trim(),
        horaPrev: parseInt(cols[7] ?? "0", 10),
        confData: (cols[8] ?? "").trim(),
        confHora: (cols[9] ?? "").trim(),
        usrConf: (cols[10] ?? "").trim(),
        laborData: (cols[11] ?? "").trim(),
        laborHora: (cols[12] ?? "").trim(),
        usrLab: (cols[13] ?? "").trim(),
        balcaoData: (cols[14] ?? "").trim(),
        balcaoHora: (cols[15] ?? "").trim(),
        usrBal: (cols[16] ?? "").trim(),
        vendedor: (cols[19] ?? "").trim(),
        telefone: (cols[20] ?? "").trim(),
        sit,
      } satisfies Receita;
    })
    .filter((r) => r.recId !== "");
}

export function groupReceitas(receitas: Receita[]): ReceitaGroup[] {
  const map = new Map<string, ReceitaGroup>();

  for (const r of receitas) {
    if (!map.has(r.recId)) {
      map.set(r.recId, {
        recId: r.recId,
        cliente: r.cliente,
        empNome: r.empNome,
        vendedor: r.vendedor,
        telefone: r.telefone,
        dtaPrev: r.dtaPrev,
        horaPrev: r.horaPrev,
        situacao: r.situacao,
        formulas: [],
        totalValor: 0,
      });
    }
    const g = map.get(r.recId)!;
    g.formulas.push(r);
    g.totalValor += isNaN(r.valor) ? 0 : r.valor;
  }

  return Array.from(map.values()).sort((a, b) => {
    // Sort by date then hour
    if (a.dtaPrev !== b.dtaPrev) return a.dtaPrev.localeCompare(b.dtaPrev);
    return a.horaPrev - b.horaPrev;
  });
}

export function etapaAtual(r: Receita): "entrada" | "conf" | "lab" | "balcao" | "pronto" {
  if (r.balcaoData) return "pronto";
  if (r.laborData) return "balcao";
  if (r.confData) return "lab";
  return "entrada";
}

export function situacaoLabel(s: Situacao) {
  return {
    CF: "Conforme",
    AT: "Atraso",
    BA: "Balcão c/Atraso",
    PO: "Ocorrência",
    "?": "—",
  }[s];
}

export function situacaoClasses(s: Situacao): string {
  return {
    CF: "bg-green-100 text-green-700 border-green-200",
    AT: "bg-orange-100 text-orange-700 border-orange-200",
    BA: "bg-blue-100 text-blue-700 border-blue-200",
    PO: "bg-yellow-100 text-yellow-700 border-yellow-200",
    "?": "bg-gray-100 text-gray-500 border-gray-200",
  }[s];
}

export function turnoLabel(hora: number): string {
  if (hora === 0) return "—";
  if (hora <= 12) return `Manhã (${hora}h)`;
  return `Tarde (${hora}h)`;
}
