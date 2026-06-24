"use client";

import { useState } from "react";
import {
  type DiaGroup,
  type ReceitaGroup,
  type Situacao,
  type Turno,
  type Alerta,
  situacaoLabel,
  turnoLabel,
  turnoTitulo,
  formatarData,
  etapaAtual,
} from "@/lib/parser";

interface Props {
  dias: DiaGroup[];
}

const SITUACOES: { value: Situacao | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "CF", label: "Conforme" },
  { value: "AT", label: "Atraso" },
  { value: "BA", label: "Balcão c/Atraso" },
  { value: "PO", label: "Ocorrência" },
];

const FILIAL_CLASSES: Record<string, string> = {
  AMERICO: "bg-violet-100 text-violet-700",
  MOEMA:   "bg-teal-100   text-teal-700",
};

function situacaoBadgeClasses(s: Situacao): string {
  return {
    CF: "bg-green-100  text-green-700  border-green-200",
    AT: "bg-red-600    text-white       border-red-600",
    BA: "bg-blue-100   text-blue-700   border-blue-200",
    PO: "bg-yellow-100 text-yellow-700 border-yellow-200",
    "?": "bg-gray-100  text-gray-500   border-gray-200",
  }[s];
}

function situacaoCardBorder(s: Situacao): string {
  return {
    CF:  "border-green-200  bg-white",
    AT:  "border-red-400    bg-red-50",
    BA:  "border-blue-200   bg-white",
    PO:  "border-yellow-200 bg-white",
    "?": "border-gray-200   bg-white",
  }[s];
}

function situacaoLeftBar(s: Situacao): string {
  return {
    CF:  "bg-green-400",
    AT:  "bg-red-500",
    BA:  "bg-blue-400",
    PO:  "bg-yellow-400",
    "?": "bg-gray-300",
  }[s];
}

export default function Esteira({ dias }: Props) {
  const [filtroSit, setFiltroSit] = useState<Situacao | "ALL">("ALL");
  const [filtroFilial, setFiltroFilial] = useState("ALL");
  const [filtroAlerta, setFiltroAlerta] = useState(false);
  const [busca, setBusca] = useState("");

  // Coleta totais e lista de filiais de todos os dias
  const todosGrupos = dias.flatMap((d) => d.turnos.flatMap((t) => t.receitas));
  const filiais = Array.from(new Set(todosGrupos.map((g) => g.empNome).filter(Boolean))).sort();

  const contagens = {
    CF: todosGrupos.filter((g) => g.situacao === "CF").length,
    AT: todosGrupos.filter((g) => g.situacao === "AT").length,
    BA: todosGrupos.filter((g) => g.situacao === "BA").length,
    PO: todosGrupos.filter((g) => g.situacao === "PO").length,
  };

  const totalEmRisco = todosGrupos.filter((g) => g.alertas.length > 0).length;

  function filtrar(grupos: ReceitaGroup[]): ReceitaGroup[] {
    return grupos.filter((g) => {
      if (filtroSit !== "ALL" && g.situacao !== filtroSit) return false;
      if (filtroFilial !== "ALL" && g.empNome !== filtroFilial) return false;
      if (filtroAlerta && g.alertas.length === 0) return false;
      if (busca) {
        const q = busca.toLowerCase();
        if (!g.cliente.toLowerCase().includes(q) && !g.recId.includes(q)) return false;
      }
      return true;
    });
  }

  const totalFiltrado = dias.flatMap((d) =>
    d.turnos.flatMap((t) => filtrar(t.receitas))
  ).length;

  return (
    <div className="space-y-5">
      {/* Contadores */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Contador label="Conforme"        valor={contagens.CF} cor="text-green-600"  bg="bg-green-50  border-green-200"  activeBg="bg-green-600"  isActive={filtroSit === "CF"}  onClick={() => { setFiltroSit(filtroSit === "CF" ? "ALL" : "CF"); setFiltroAlerta(false); }} />
        <Contador label="Atraso"          valor={contagens.AT} cor="text-red-600"    bg="bg-red-50    border-red-200"    activeBg="bg-red-600"    isActive={filtroSit === "AT"}  onClick={() => { setFiltroSit(filtroSit === "AT" ? "ALL" : "AT"); setFiltroAlerta(false); }} />
        <Contador label="Balcão c/Atraso" valor={contagens.BA} cor="text-blue-600"   bg="bg-blue-50   border-blue-200"   activeBg="bg-blue-600"   isActive={filtroSit === "BA"}  onClick={() => { setFiltroSit(filtroSit === "BA" ? "ALL" : "BA"); setFiltroAlerta(false); }} />
        <Contador label="Ocorrência"      valor={contagens.PO} cor="text-yellow-600" bg="bg-yellow-50 border-yellow-200" activeBg="bg-yellow-500" isActive={filtroSit === "PO"}  onClick={() => { setFiltroSit(filtroSit === "PO" ? "ALL" : "PO"); setFiltroAlerta(false); }} />
        <Contador label="Em risco / Alertas" valor={totalEmRisco} cor="text-orange-600" bg="bg-orange-50 border-orange-200" activeBg="bg-orange-500" isActive={filtroAlerta} onClick={() => { setFiltroAlerta(!filtroAlerta); setFiltroSit("ALL"); }} />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        <input
          type="text"
          placeholder="Buscar cliente ou receita..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 w-56 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
        />
        <div className="flex gap-2 flex-wrap">
          {SITUACOES.map((s) => (
            <button
              key={s.value}
              onClick={() => setFiltroSit(s.value)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-medium
                ${filtroSit === s.value
                  ? "bg-gray-800 text-white border-gray-800"
                  : "border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50"
                }`}
            >
              {s.label}
            </button>
          ))}
          {totalEmRisco > 0 && (
            <button
              onClick={() => setFiltroAlerta(!filtroAlerta)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-medium
                ${filtroAlerta
                  ? "bg-orange-500 text-white border-orange-500"
                  : "border-orange-300 text-orange-600 hover:border-orange-400 hover:bg-orange-50"
                }`}
            >
              ⚠ Em risco ({totalEmRisco})
            </button>
          )}
        </div>
        {filiais.length > 1 && (
          <select
            value={filtroFilial}
            onChange={(e) => setFiltroFilial(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-400 bg-white"
          >
            <option value="ALL">Todas as filiais</option>
            {filiais.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        )}
        <span className={`ml-auto text-sm font-semibold px-3 py-1 rounded-full border ${
          filtroFilial === "AMERICO" ? "bg-violet-100 text-violet-700 border-violet-200" :
          filtroFilial === "MOEMA"   ? "bg-teal-100 text-teal-700 border-teal-200" :
                                       "bg-gray-600 text-white border-gray-600"
        }`}>
          {totalFiltrado} receita{totalFiltrado !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Seções por dia e turno */}
      {dias.map((dia) => {
        const turnosFiltrados = dia.turnos
          .map((t) => ({ ...t, receitas: filtrar(t.receitas) }))
          .filter((t) => t.receitas.length > 0);

        if (turnosFiltrados.length === 0) return null;

        return (
          <div key={dia.data}>
            {/* Cabeçalho do dia */}
            <div className="flex items-center gap-3 mb-3">
              <div className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                dia.isHoje
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}>
                {dia.isHoje ? "Hoje" : ""}
                {!dia.isHoje && formatarData(dia.data)}
              </div>
              {dia.isHoje && (
                <span className="text-gray-500 text-sm">{formatarData(dia.data)}</span>
              )}
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Turnos do dia */}
            <div className="space-y-4">
              {turnosFiltrados.map((turnoGrp) => (
                <div key={turnoGrp.turno}>
                  <TurnoCabecalho turno={turnoGrp.turno} total={turnoGrp.receitas.length} />
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-2">
                    {turnoGrp.receitas.map((g) => (
                      <ReceitaCard key={g.recId} grupo={g} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {totalFiltrado === 0 && (
        <p className="text-center text-gray-400 py-12 text-sm">Nenhuma receita encontrada.</p>
      )}
    </div>
  );
}

function TurnoCabecalho({ turno, total }: { turno: Turno; total: number }) {
  const icon = {
    entrega:    "🛵",
    azul:       "📦",
    sedex:      "📮",
    retirada:   "🏪",
    semhorario: "⏳",
  }[turno];
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 font-medium">
        {icon} {turnoTitulo(turno)}
      </span>
      <span className="text-xs text-gray-400">· {total} receita{total !== 1 ? "s" : ""}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

function Contador({ label, valor, cor, bg, activeBg, isActive, onClick }: {
  label: string; valor: number; cor: string; bg: string; activeBg: string; isActive: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`border rounded-xl px-4 py-3 shadow-sm text-left w-full transition-all cursor-pointer select-none
        ${isActive ? `${activeBg} border-transparent` : `${bg} hover:brightness-95`}`}
    >
      <p className={`text-xs font-medium ${isActive ? "text-white/80" : "text-gray-500"}`}>{label}</p>
      <p className={`text-2xl font-bold ${isActive ? "text-white" : cor}`}>{valor}</p>
    </button>
  );
}

function alertaBadge(a: Alerta): { label: string; cls: string } {
  if (a.tipo === "critica")     return { label: "Crítica", cls: "bg-red-600 text-white border-red-600" };
  if (a.tipo === "em_risco")    return { label: "Em risco", cls: "bg-orange-500 text-white border-orange-500" };
  if (a.tipo === "conf_parada") return {
    label: `Conf. parada ${a.horasParado !== undefined ? a.horasParado.toFixed(0) + "h" : ""}`,
    cls: "bg-amber-500 text-white border-amber-500",
  };
  return {
    label: `Lab parado ${a.horasParado !== undefined ? a.horasParado.toFixed(0) + "h" : ""}`,
    cls: "bg-amber-600 text-white border-amber-600",
  };
}

function ReceitaCard({ grupo }: { grupo: ReceitaGroup }) {
  const [aberto, setAberto] = useState(false);
  const filialCls = FILIAL_CLASSES[grupo.empNome] ?? "bg-gray-100 text-gray-600";
  const isCritica = grupo.alertas.some((a) => a.tipo === "critica");

  return (
    <div className={`rounded-xl border shadow-sm overflow-hidden ${situacaoCardBorder(grupo.situacao)} ${isCritica ? "ring-4 ring-red-500 ring-offset-2 animate-pulse" : ""}`}>
      <div className="flex">
        <div className={`w-1 shrink-0 ${situacaoLeftBar(grupo.situacao)}`} />
        <div className="flex-1 min-w-0">

          {/* Cabeçalho do card */}
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-gray-400 font-mono">#{grupo.recId}</p>
                <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{grupo.cliente}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${situacaoBadgeClasses(grupo.situacao)}`}>
                  {situacaoLabel(grupo.situacao)}
                </span>
                {grupo.semInicio && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                    Sem início
                  </span>
                )}
                {grupo.alertas.map((a, i) => {
                  const { label, cls } = alertaBadge(a);
                  return (
                    <span key={i} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cls}`}>
                      ⚠ {label}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
              <span className={`px-1.5 py-0.5 rounded font-medium text-xs ${filialCls}`}>
                {grupo.empNome || "—"}
              </span>
              <span>👤 {grupo.vendedor || "—"}</span>
              <span>🕐 {turnoLabel(grupo.horaPrev)}</span>
              <span className="text-gray-700 font-semibold ml-auto">
                R$ {grupo.totalValor.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>

          {/* Progresso de cada fórmula */}
          <div className="px-4 pb-3 space-y-2">
            {grupo.formulas.map((f) => (
              <FormulaProgresso key={`${f.recId}-${f.recSeq}`} formula={f} />
            ))}
          </div>

          {/* Responsáveis */}
          {grupo.formulas.some((f) => f.usrConf || f.usrLab || f.usrBal) && (
            <button
              onClick={() => setAberto(!aberto)}
              className="w-full text-xs text-gray-400 hover:text-gray-600 py-2 border-t border-gray-100 transition-colors bg-gray-50/60 hover:bg-gray-100/60"
            >
              {aberto ? "Ocultar detalhes ▲" : "Ver responsáveis ▼"}
            </button>
          )}

          {aberto && (
            <div className="border-t border-gray-100 px-4 py-3 space-y-2 bg-gray-50/60">
              {grupo.formulas.map((f) => (
                <div key={`det-${f.recId}-${f.recSeq}`} className="text-xs text-gray-500 space-y-0.5">
                  <p className="text-gray-400 font-medium">
                    Fórmula {f.recSeq + 1} · R$ {isNaN(f.valor) ? "—" : f.valor.toFixed(2).replace(".", ",")}
                  </p>
                  {f.usrConf && <p>Conf: <span className="text-gray-700">{f.usrConf}</span> {f.confHora}</p>}
                  {f.usrLab  && <p>Lab: <span className="text-gray-700">{f.usrLab}</span> {f.laborHora}</p>}
                  {f.usrBal  && <p>Balcão: <span className="text-gray-700">{f.usrBal}</span> {f.balcaoHora}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const ETAPA_ORDER = ["entrada", "conf", "lab", "balcao", "pronto"] as const;

function FormulaProgresso({ formula }: { formula: import("@/lib/parser").Receita }) {
  const etapa = etapaAtual(formula);
  const idx = ETAPA_ORDER.indexOf(etapa);

  return (
    <div>
      <p className="text-xs text-gray-400 mb-1">Fórmula {formula.recSeq + 1}</p>
      <div className="flex items-center gap-1">
        {ETAPA_ORDER.map((e, i) => {
          const done = i < idx || etapa === "pronto";
          const active = e === etapa && etapa !== "pronto";
          return (
            <div key={e} className="flex items-center gap-1 flex-1 min-w-0">
              <div
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  done ? "bg-green-400" : active ? "bg-blue-400" : "bg-gray-200"
                }`}
              />
              {i === ETAPA_ORDER.length - 1 && (
                <div className={`w-2 h-2 rounded-full shrink-0 ${etapa === "pronto" ? "bg-green-400" : "bg-gray-200"}`} />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 mt-0.5">
        {etapa === "pronto"   ? "✓ No balcão"
        : etapa === "balcao"  ? "Aguardando balcão"
        : etapa === "lab"     ? "Em laboratório"
        : etapa === "conf"    ? "Aguardando conferência"
        :                       "Aguardando início"}
      </p>
    </div>
  );
}
