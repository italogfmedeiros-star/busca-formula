export type Situacao = "CF" | "AT" | "BA" | "PO" | "?";
export type Turno = "entrega" | "azul" | "sedex" | "retirada" | "semhorario";

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
  localArmz: string;
  vendedor: string;
  telefone: string;
  sit: string;
}

// Limites de tempo por etapa (em horas)
export const LIMITE_CONF_H  = 10;
export const LIMITE_LAB_H   = 15;

export type AlertaTipo = "conf_parada" | "lab_parado" | "em_risco" | "critica";

export interface Alerta {
  tipo: AlertaTipo;
  horasParado?: number;
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
  alertas: Alerta[];
  formulas: Receita[];
  totalValor: number;
  motoboys: string[];
}

export function motoboyLabel(localArmz: string): string | null {
  if (localArmz === "V") return "Vini";
  if (localArmz === "A") return "Aldrin";
  if (localArmz === "L") return "Loja";
  return null;
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
        empNome: (cols[18] ?? "").trim() || (cols[3]?.trim() === "1" ? "AMERICO" : cols[3]?.trim() === "2" ? "MOEMA" : "—"),
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
        localArmz: (cols[17] ?? "").trim().toUpperCase(),
        vendedor: (cols[19] ?? "").trim(),
        telefone: (cols[20] ?? "").trim(),
        sit,
      } satisfies Receita;
    })
    .filter((r) => r.recId !== "");
}

export function classificarTurno(hora: number): Turno {
  if (hora === 8)  return "entrega";
  if (hora === 11) return "azul";
  if (hora === 12) return "sedex";
  if (hora === 14) return "retirada";
  return "semhorario";
}

function horasDesde(data: string, hora: string): number | null {
  const dt = parseDatetime(data, hora);
  if (!dt) return null;
  return (Date.now() - dt.getTime()) / (1000 * 60 * 60);
}

export function groupReceitas(receitas: Receita[], hoje?: string): ReceitaGroup[] {
  const map = new Map<string, ReceitaGroup>();
  const diaHoje = hoje ?? hojeCSV();

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
        alertas: [],
        formulas: [],
        totalValor: 0,
        motoboys: [],
      });
    }
    const g = map.get(r.recId)!;
    g.formulas.push(r);
    g.totalValor += isNaN(r.valor) ? 0 : r.valor;
  }

  const grupos = Array.from(map.values());

  for (const g of grupos) {
    g.semInicio = g.formulas.every(
      (f) => !f.confData && !f.laborData && !f.balcaoData
    );

    g.motoboys = [...new Set(
      g.formulas
        .map((f) => f.localArmz)
        .filter((v) => v === "V" || v === "A" || v === "L")
    )];

    const alertas: Alerta[] = [];
    const isHoje = g.dtaPrev === diaHoje;

    // Receita crítica: entrega hoje e nenhuma fórmula chegou ao balcão
    if (isHoje && g.formulas.every((f) => !f.balcaoData)) {
      alertas.push({ tipo: "critica" });
    }

    // Receita em risco: entrega hoje e sem nenhuma etapa iniciada
    if (isHoje && g.semInicio) {
      alertas.push({ tipo: "em_risco" });
    }

    // Fórmulas paradas na conferência além do limite
    for (const f of g.formulas) {
      if (f.confData && !f.laborData) {
        const horas = horasDesde(f.confData, f.confHora);
        if (horas !== null && horas > LIMITE_CONF_H) {
          alertas.push({ tipo: "conf_parada", horasParado: horas });
          break;
        }
      }
      // Fórmulas paradas no laboratório além do limite
      if (f.laborData && !f.balcaoData) {
        const horas = horasDesde(f.laborData, f.laborHora);
        if (horas !== null && horas > LIMITE_LAB_H) {
          alertas.push({ tipo: "lab_parado", horasParado: horas });
          break;
        }
      }
    }

    g.alertas = alertas;
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
      ["entrega",    []],
      ["azul",       []],
      ["sedex",      []],
      ["retirada",   []],
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
    for (const turno of ["entrega", "azul", "sedex", "retirada", "semhorario"] as Turno[]) {
      const lista = porTurno.get(turno)!;
      if (lista.length > 0) {
        turnos.push({ turno, receitas: ordenarUrgencia(lista) });
      }
    }

    return { data, isHoje: data === hoje, turnos };
  });
}

// ─── Indicadores V2 ─────────────────────────────────────────────────────────

export interface Indicadores {
  totalReceitas: number;
  taxaAtraso: number;           // % do total com situação AT
  gargalo: { etapa: string; quantidade: number } | null;
  tempoMedioConfLab: number | null;   // horas entre conf e lab
  tempoMedioLabBalcao: number | null; // horas entre lab e balcão
  porVendedor: { nome: string; total: number; atraso: number }[];
  porFilial: { nome: string; total: number; atraso: number }[];
}

function parseDatetime(data: string, hora: string): Date | null {
  // data: MM/DD/YY, hora: HH:MM
  if (!data || !hora) return null;
  const dp = data.split("/");
  const hp = hora.split(":");
  if (dp.length !== 3 || hp.length !== 2) return null;
  const year  = 2000 + parseInt(dp[2]);
  const month = parseInt(dp[0]) - 1;
  const day   = parseInt(dp[1]);
  const h     = parseInt(hp[0]);
  const m     = parseInt(hp[1]);
  if ([year, month, day, h, m].some(isNaN)) return null;
  return new Date(year, month, day, h, m);
}

function diffHoras(a: Date | null, b: Date | null): number | null {
  if (!a || !b) return null;
  const diff = (b.getTime() - a.getTime()) / (1000 * 60 * 60);
  return diff >= 0 ? diff : null;
}

function mediaNaoNula(vals: (number | null)[]): number | null {
  const validos = vals.filter((v): v is number => v !== null && v < 48); // ignora outliers > 48h
  if (validos.length === 0) return null;
  return validos.reduce((a, b) => a + b, 0) / validos.length;
}

export function calcularIndicadores(grupos: ReceitaGroup[]): Indicadores {
  const total = grupos.length;
  const atrasadas = grupos.filter((g) => g.situacao === "AT").length;

  // Gargalo: etapa onde mais receitas estão paradas
  let paradas = { entrada: 0, conf: 0, lab: 0 };
  for (const g of grupos) {
    for (const f of g.formulas) {
      if (!f.confData && !f.laborData && !f.balcaoData) paradas.entrada++;
      else if (f.confData && !f.laborData) paradas.conf++;
      else if (f.laborData && !f.balcaoData) paradas.lab++;
    }
  }
  const maxParada = Math.max(paradas.entrada, paradas.conf, paradas.lab);
  let gargalo: Indicadores["gargalo"] = null;
  if (maxParada > 0) {
    const etapa =
      paradas.entrada === maxParada ? "Aguardando Conferência" :
      paradas.conf    === maxParada ? "Em Laboratório" :
                                      "Aguardando Balcão";
    gargalo = { etapa, quantidade: maxParada };
  }

  // Tempos médios entre etapas (por fórmula individual)
  const todasFormulas = grupos.flatMap((g) => g.formulas);
  const temposConfLab    = todasFormulas.map((f) =>
    diffHoras(parseDatetime(f.confData, f.confHora), parseDatetime(f.laborData, f.laborHora))
  );
  const temposLabBalcao  = todasFormulas.map((f) =>
    diffHoras(parseDatetime(f.laborData, f.laborHora), parseDatetime(f.balcaoData, f.balcaoHora))
  );

  // Volume por vendedor
  const vendMap = new Map<string, { total: number; atraso: number }>();
  for (const g of grupos) {
    const nome = g.vendedor || "—";
    if (!vendMap.has(nome)) vendMap.set(nome, { total: 0, atraso: 0 });
    const v = vendMap.get(nome)!;
    v.total++;
    if (g.situacao === "AT") v.atraso++;
  }
  const porVendedor = Array.from(vendMap.entries())
    .map(([nome, v]) => ({ nome, ...v }))
    .sort((a, b) => b.total - a.total);

  // Volume por filial
  const filialMap = new Map<string, { total: number; atraso: number }>();
  for (const g of grupos) {
    const nome = g.empNome || "—";
    if (!filialMap.has(nome)) filialMap.set(nome, { total: 0, atraso: 0 });
    const f = filialMap.get(nome)!;
    f.total++;
    if (g.situacao === "AT") f.atraso++;
  }
  const porFilial = Array.from(filialMap.entries())
    .map(([nome, f]) => ({ nome, ...f }))
    .sort((a, b) => b.total - a.total);

  return {
    totalReceitas: total,
    taxaAtraso: total > 0 ? (atrasadas / total) * 100 : 0,
    gargalo,
    tempoMedioConfLab:    mediaNaoNula(temposConfLab),
    tempoMedioLabBalcao:  mediaNaoNula(temposLabBalcao),
    porVendedor,
    porFilial,
  };
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
  if (hora === 8)  return "Entrega · Motoboy";
  if (hora === 11) return "Azul Cargo";
  if (hora === 12) return "SEDEX";
  if (hora === 14) return "Retirada no Balcão";
  return "Sem horário";
}

export function turnoTitulo(turno: Turno): string {
  return {
    entrega:    "Entrega · Motoboy",
    azul:       "Azul Cargo",
    sedex:      "SEDEX",
    retirada:   "Retirada no Balcão",
    semhorario: "Sem horário definido",
  }[turno];
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
