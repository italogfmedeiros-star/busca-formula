export type Situacao = "CF" | "AT" | "BA" | "PO" | "?";
export type Turno = "manha" | "tarde" | "semhorario";

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
  turno: Turno;
  situacao: Situacao;
  semInicio: boolean;
  formulas: Receita[];
  totalValor: number;
}

export interface TurnoGroup {
  turno: Turno;
  receitas: ReceitaGroup[];
}

export interface DiaGroup {
  data: string;
  isHoje: boolean;
  turnos: TurnoGroup[];
}

const SIT_MAP: Record<string, Situacao> = {
  CF: "CF",
  AT: "AT",
  BA: "BA",
  PO: "PO",
};

const URGENCIA: Record<Situacao, number> = {
  AT: 0,
  BA: 1,
  PO: 2,
  CF: 3,
  "?": 4,
};

export function parseCSV(text: string): Receita[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) throw new Error("CSV vazio");

  const rows = lines.slice(1);

  return rows
    .map((line) => {
      const cols = line.split(";");
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

export function classificarTurno(hora: number): Turno {
  if (hora === 0) return "semhorario";
  if (hora <= 12) return "manha";
  return "tarde";
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
        turno: classificarTurno(r.horaPrev),
        situacao: r.situacao,
        semInicio: false,
        formulas: [],
        totalValor: 0,
      });
    }
    const g = map.get(r.recId)!;
    g.formulas.push(r);
    g.totalValor += isNaN(r.valor) ? 0 : r.valor;
  }

  const grupos = Array.from(map.values());

  // Marca receitas sem nenhuma etapa iniciada
  for (const g of grupos) {
    g.semInicio = g.formulas.every(
      (f) => !f.confData && !f.laborData && !f.balcaoData
    );
  }

  return grupos;
}

export function groupPorDia(grupos: ReceitaGroup[], hoje: string): DiaGroup[] {
  const porData = new Map<string, ReceitaGroup[]>();

  for (const g of grupos) {
    const data = g.dtaPrev || "sem-data";
    if (!porData.has(data)) porData.set(data, []);
    porData.get(data)!.push(g);
  }

  // Ordena datas cronologicamente
  const datasOrdenadas = Array.from(porData.keys()).sort((a, b) =>
    a.localeCompare(b)
  );

  return datasOrdenadas.map((data) => {
    const receitasDoDia = porData.get(data)!;

    // Agrupa por turno dentro do dia
    const porTurno = new Map<Turno, ReceitaGroup[]>([
      ["manha", []],
      ["tarde", []],
      ["semhorario", []],
    ]);

    for (const g of receitasDoDia) {
      porTurno.get(g.turno)!.push(g);
    }

    // Ordena por urgência dentro de cada turno
    const ordenarUrgencia = (lista: ReceitaGroup[]) =>
      lista.sort((a, b) => {
        const urgDiff = URGENCIA[a.situacao] - URGENCIA[b.situacao];
        if (urgDiff !== 0) return urgDiff;
        return a.horaPrev - b.horaPrev;
      });

    const turnos: TurnoGroup[] = [];
    for (const turno of ["manha", "tarde", "semhorario"] as Turno[]) {
      const lista = porTurno.get(turno)!;
      if (lista.length > 0) {
        turnos.push({ turno, receitas: ordenarUrgencia(lista) });
      }
    }

    return { data, isHoje: data === hoje, turnos };
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
    AT: "bg-red-100 text-red-700 border-red-200",
    BA: "bg-blue-100 text-blue-700 border-blue-200",
    PO: "bg-yellow-100 text-yellow-700 border-yellow-200",
    "?": "bg-gray-100 text-gray-500 border-gray-200",
  }[s];
}

export function turnoLabel(hora: number): string {
  if (hora === 0) return "Sem horário";
  if (hora <= 12) return `Manhã · ${hora}h`;
  return `Tarde · ${hora}h`;
}

export function turnoTitulo(turno: Turno): string {
  return { manha: "Manhã", tarde: "Tarde", semhorario: "Sem horário definido" }[turno];
}

export function formatarData(data: string): string {
  // Converte MM/DD/YY para DD/MM/AAAA
  const parts = data.split("/");
  if (parts.length !== 3) return data;
  const [mm, dd, yy] = parts;
  const ano = parseInt(yy) + 2000;
  return `${dd}/${mm}/${ano}`;
}

export function hojeCSV(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(2);
  return `${mm}/${dd}/${yy}`;
}
