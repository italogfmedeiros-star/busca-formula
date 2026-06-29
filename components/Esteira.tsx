"use client";

import { useState } from "react";
import {
  MagnifyingGlass, Warning, User, Clock,
  Package, Envelope, Storefront, Hourglass, Motorcycle,
  CaretDown, CaretUp, Check,
} from "@phosphor-icons/react";
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
  motoboyLabel,
} from "@/lib/parser";

interface Props {
  dias: DiaGroup[];
}

const SITUACOES: { value: Situacao | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "CF",  label: "Conforme" },
  { value: "AT",  label: "Atraso" },
  { value: "BA",  label: "Balcao c/Atraso" },
  { value: "PO",  label: "Ocorrencia" },
];

const MOTOBOYS = [
  { value: "ALL",    label: "Todos" },
  { value: "V",      label: "Vini" },
  { value: "A",      label: "Aldrin" },
  { value: "L",      label: "Loja" },
  { value: "OUTROS", label: "Outros" },
];

const FILIAL_CLASSES: Record<string, string> = {
  AMERICO: "bg-violet-100 text-violet-700",
  MOEMA:   "bg-teal-100 text-teal-700",
};

const FILIAL_ACTIVE: Record<string, string> = {
  AMERICO: "bg-violet-600 text-white border-violet-600",
  MOEMA:   "bg-teal-600 text-white border-teal-600",
};

function situacaoBadgeClasses(s: Situacao): string {
  return ({
    CF:  "bg-green-100 text-green-700 border-green-200",
    AT:  "bg-red-600 text-white border-red-600",
    BA:  "bg-blue-100 text-blue-700 border-blue-200",
    PO:  "bg-yellow-100 text-yellow-700 border-yellow-200",
    "?": "bg-gray-100 text-gray-500 border-gray-200",
  } as Record<string, string>)[s] ?? "bg-gray-100 text-gray-500 border-gray-200";
}

function situacaoCardBorder(s: Situacao): string {
  return ({
    CF:  "border-green-200 bg-white",
    AT:  "border-red-300 bg-red-50/50",
    BA:  "border-blue-200 bg-white",
    PO:  "border-yellow-200 bg-white",
    "?": "border-gray-200 bg-white",
  } as Record<string, string>)[s] ?? "border-gray-200 bg-white";
}

function situacaoLeftBar(s: Situacao): string {
  return ({
    CF:  "bg-green-400",
    AT:  "bg-red-500",
    BA:  "bg-blue-400",
    PO:  "bg-yellow-400",
    "?": "bg-gray-300",
  } as Record<string, string>)[s] ?? "bg-gray-300";
}

type EtapaFluxo = "conferencia" | "producao" | "expedicao" | "finalizado";

function etapaFluxo(g: ReceitaGroup): EtapaFluxo {
  if (g.formulas.some((f) => f.balcaoData)) return "finalizado";
  if (g.formulas.some((f) => f.laborData))  return "expedicao";
  if (g.formulas.some((f) => f.confData))   return "producao";
  return "conferencia";
}

function badgePrioridade(grupo: ReceitaGroup): { label: string; cls: string } | null {
  const critica = grupo.alertas.find((a) => a.tipo === "critica");
  if (critica) return { label: "Critica", cls: "bg-red-600 text-white border-red-600" };
  const risco = grupo.alertas.find((a) => a.tipo === "em_risco");
  if (risco) return { label: "Em risco", cls: "bg-orange-500 text-white border-orange-500" };
  const conf = grupo.alertas.find((a) => a.tipo === "conf_parada");
  if (conf) return {
    label: `Conf. parada ${conf.horasParado !== undefined ? conf.horasParado.toFixed(0) + "h" : ""}`,
    cls: "bg-amber-500 text-white border-amber-500",
  };
  const lab = grupo.alertas.find((a) => a.tipo === "lab_parado");
  if (lab) return {
    label: `Lab parado ${lab.horasParado !== undefined ? lab.horasParado.toFixed(0) + "h" : ""}`,
    cls: "bg-amber-600 text-white border-amber-600",
  };
  return null;
}

export default function Esteira({ dias }: Props) {
  const [filtroSit,    setFiltroSit]    = useState<Situacao | "ALL">("ALL");
  const [filtroFilial, setFiltroFilial] = useState("ALL");
  const [filtroAlerta, setFiltroAlerta] = useState(false);
  const [filtroMotoboy,setFiltroMotoboy]= useState("ALL");
  const [filtroEtapa,  setFiltroEtapa]  = useState<EtapaFluxo | "ALL">("ALL");
  const [busca,        setBusca]        = useState("");

  const todosGrupos = dias.flatMap((d) => d.turnos.flatMap((t) => t.receitas));
  const filiais = Array.from(new Set(todosGrupos.map((g) => g.empNome).filter(Boolean))).sort();
  const totalEmRisco = todosGrupos.filter((g) => g.alertas.length > 0).length;

  const contagensFluxo = {
    conferencia: todosGrupos.filter((g) => etapaFluxo(g) === "conferencia").length,
    producao:    todosGrupos.filter((g) => etapaFluxo(g) === "producao").length,
    expedicao:   todosGrupos.filter((g) => etapaFluxo(g) === "expedicao").length,
    finalizado:  todosGrupos.filter((g) => etapaFluxo(g) === "finalizado").length,
  };

  function filtrar(grupos: ReceitaGroup[]): ReceitaGroup[] {
    return grupos.filter((g) => {
      if (filtroSit !== "ALL" && g.situacao !== filtroSit) return false;
      if (filtroFilial !== "ALL" && g.empNome !== filtroFilial) return false;
      if (filtroAlerta && g.alertas.length === 0) return false;
      if (filtroMotoboy === "OUTROS" && g.motoboys.length > 0) return false;
      if (filtroMotoboy !== "ALL" && filtroMotoboy !== "OUTROS" && !g.motoboys.includes(filtroMotoboy)) return false;
      if (filtroEtapa !== "ALL" && etapaFluxo(g) !== filtroEtapa) return false;
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
      {/* Fluxo de Producao */}
      <div>
        <p className="text-xs font-medium text-gray-400 mb-2">Fluxo de Producao</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ContadorFluxo
            label="Em conferencia"
            valor={contagensFluxo.conferencia}
            cor="text-slate-700"
            bg="bg-slate-50 border-slate-200"
            activeBg="bg-slate-700"
            dot="bg-slate-400"
            isActive={filtroEtapa === "conferencia"}
            onClick={() => setFiltroEtapa(filtroEtapa === "conferencia" ? "ALL" : "conferencia")}
          />
          <ContadorFluxo
            label="Em producao"
            valor={contagensFluxo.producao}
            cor="text-amber-600"
            bg="bg-amber-50 border-amber-200"
            activeBg="bg-amber-500"
            dot="bg-amber-400"
            isActive={filtroEtapa === "producao"}
            onClick={() => setFiltroEtapa(filtroEtapa === "producao" ? "ALL" : "producao")}
          />
          <ContadorFluxo
            label="Em expedicao"
            valor={contagensFluxo.expedicao}
            cor="text-indigo-600"
            bg="bg-indigo-50 border-indigo-200"
            activeBg="bg-indigo-600"
            dot="bg-indigo-400"
            isActive={filtroEtapa === "expedicao"}
            onClick={() => setFiltroEtapa(filtroEtapa === "expedicao" ? "ALL" : "expedicao")}
          />
          <ContadorFluxo
            label="Finalizados"
            valor={contagensFluxo.finalizado}
            cor="text-emerald-600"
            bg="bg-emerald-50 border-emerald-200"
            activeBg="bg-emerald-600"
            dot="bg-emerald-400"
            isActive={filtroEtapa === "finalizado"}
            onClick={() => setFiltroEtapa(filtroEtapa === "finalizado" ? "ALL" : "finalizado")}
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Linha 1: busca + situacao + em risco + contagem */}
        <div className="flex flex-wrap gap-2 items-center px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar cliente ou receita..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-800 placeholder-gray-400 w-52 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {SITUACOES.map((s) => (
              <button
                key={s.value}
                onClick={() => setFiltroSit(s.value)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-medium
                  ${filtroSit === s.value
                    ? "bg-zinc-800 text-white border-zinc-800"
                    : "border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50"
                  }`}
              >
                {s.label}
              </button>
            ))}

            {totalEmRisco > 0 && (
              <button
                onClick={() => setFiltroAlerta(!filtroAlerta)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-medium flex items-center gap-1.5
                  ${filtroAlerta
                    ? "bg-orange-500 text-white border-orange-500"
                    : "border-orange-200 text-orange-600 hover:border-orange-400 hover:bg-orange-50"
                  }`}
              >
                <Warning weight="fill" className="w-3 h-3" />
                Em risco ({totalEmRisco})
              </button>
            )}
          </div>

          <span className={`ml-auto text-xs font-semibold px-3 py-1.5 rounded-full ${
            filtroFilial === "AMERICO" ? "bg-violet-100 text-violet-700" :
            filtroFilial === "MOEMA"   ? "bg-teal-100 text-teal-700" :
                                         "bg-zinc-800 text-white"
          }`}>
            {totalFiltrado} receita{totalFiltrado !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Linha 2: expedicao + filial */}
        <div className="flex flex-wrap gap-3 items-center px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium shrink-0">Expedicao</span>
            <div className="flex gap-1.5 flex-wrap">
              {MOTOBOYS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setFiltroMotoboy(m.value)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors font-medium
                    ${filtroMotoboy === m.value
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {filiais.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-300 select-none">|</span>
              <span className="text-xs text-gray-400 font-medium shrink-0">Filial</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setFiltroFilial("ALL")}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors font-medium
                    ${filtroFilial === "ALL"
                      ? "bg-zinc-800 text-white border-zinc-800"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                >
                  Todas
                </button>
                {filiais.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFiltroFilial(f)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors font-medium
                      ${filtroFilial === f
                        ? (FILIAL_ACTIVE[f] ?? "bg-zinc-800 text-white border-zinc-800")
                        : "border-gray-200 text-gray-500 hover:bg-gray-50"
                      }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Secoes por dia e turno */}
      {dias.map((dia) => {
        const turnosFiltrados = dia.turnos
          .map((t) => ({ ...t, receitas: filtrar(t.receitas) }))
          .filter((t) => t.receitas.length > 0);

        if (turnosFiltrados.length === 0) return null;

        return (
          <div key={dia.data}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                dia.isHoje
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}>
                {dia.isHoje ? "Hoje" : formatarData(dia.data)}
              </div>
              {dia.isHoje && (
                <span className="text-gray-400 text-sm">{formatarData(dia.data)}</span>
              )}
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="space-y-4">
              {turnosFiltrados.map((turnoGrp) => (
                <div key={turnoGrp.turno}>
                  <TurnoCabecalho turno={turnoGrp.turno} total={turnoGrp.receitas.length} />
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-2">
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

const TURNO_ICON: Record<Turno, React.ReactNode> = {
  entrega:    <Motorcycle className="w-6 h-6" />,
  azul:       <Package className="w-6 h-6" />,
  sedex:      <Envelope className="w-6 h-6" />,
  retirada:   <Storefront className="w-6 h-6" />,
  semhorario: <Hourglass className="w-6 h-6" />,
};

function TurnoCabecalho({ turno, total }: { turno: Turno; total: number }) {
  return (
    <div className="flex items-center gap-3 mb-1">
      <span className="flex items-center gap-2 text-base font-semibold text-gray-700">
        <span className="text-gray-500">{TURNO_ICON[turno]}</span>
        {turnoTitulo(turno)}
      </span>
      <span className="text-xs text-gray-400 font-normal">· {total} receita{total !== 1 ? "s" : ""}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

function ContadorFluxo({ label, valor, cor, bg, activeBg, dot, isActive, onClick }: {
  label: string; valor: number; cor: string; bg: string; activeBg: string; dot: string; isActive: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`border rounded-xl px-4 py-3 shadow-sm text-left w-full transition-all cursor-pointer select-none
        ${isActive ? `${activeBg} border-transparent` : `${bg} hover:brightness-95`}`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? "bg-white/70" : dot}`} />
        <p className={`text-xs font-medium ${isActive ? "text-white/80" : "text-gray-500"}`}>{label}</p>
      </div>
      <p className={`text-2xl font-bold ${isActive ? "text-white" : cor}`}>{valor}</p>
    </button>
  );
}

function ReceitaCard({ grupo }: { grupo: ReceitaGroup }) {
  const [aberto, setAberto] = useState(false);
  const filialCls = FILIAL_CLASSES[grupo.empNome] ?? "bg-gray-100 text-gray-600";
  const isCritica = grupo.alertas.some((a) => a.tipo === "critica");
  const alerta = badgePrioridade(grupo);

  return (
    <div className={`rounded-xl border shadow-sm overflow-hidden ${situacaoCardBorder(grupo.situacao)} ${isCritica ? "ring-2 ring-red-500 ring-offset-1 animate-pulse" : ""}`}>
      <div className="flex">
        <div className={`w-1 shrink-0 ${situacaoLeftBar(grupo.situacao)}`} />
        <div className="flex-1 min-w-0">

          {/* Cabecalho */}
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] text-gray-400 font-mono">#{grupo.recId}</p>
                <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{grupo.cliente}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${situacaoBadgeClasses(grupo.situacao)}`}>
                  {situacaoLabel(grupo.situacao)}
                </span>
                {alerta ? (
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${alerta.cls}`}>
                    {alerta.label}
                  </span>
                ) : grupo.semInicio ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                    Sem inicio
                  </span>
                ) : null}
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
              <span className={`px-1.5 py-0.5 rounded font-medium text-xs ${filialCls}`}>
                {grupo.empNome || "-"}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3 h-3 text-gray-400" />
                {grupo.vendedor || "-"}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-gray-400" />
                {turnoLabel(grupo.horaPrev)}
              </span>
              {grupo.motoboys.map((m) => (
                <span key={m} className="px-1.5 py-0.5 rounded font-medium text-xs bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {motoboyLabel(m)}
                </span>
              ))}
              <span className="text-gray-700 font-semibold ml-auto">
                R$ {grupo.totalValor.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>

          {/* Progresso */}
          <div className="px-4 pb-3 space-y-2">
            {grupo.formulas.map((f) => (
              <FormulaProgresso key={`${f.recId}-${f.recSeq}`} formula={f} />
            ))}
          </div>

          {/* Responsaveis */}
          {grupo.formulas.some((f) => f.usrConf || f.usrLab || f.usrBal) && (
            <button
              onClick={() => setAberto(!aberto)}
              className="w-full text-xs text-gray-400 hover:text-gray-600 py-2 border-t border-gray-100 transition-colors bg-gray-50/60 hover:bg-gray-100/60 flex items-center justify-center gap-1"
            >
              {aberto ? <><CaretUp className="w-3 h-3" /> Ocultar detalhes</> : <><CaretDown className="w-3 h-3" /> Ver responsaveis</>}
            </button>
          )}

          {aberto && (
            <div className="border-t border-gray-100 px-4 py-3 space-y-2 bg-gray-50/60">
              {grupo.formulas.map((f) => (
                <div key={`det-${f.recId}-${f.recSeq}`} className="text-xs text-gray-500 space-y-0.5">
                  <p className="text-gray-400 font-medium">
                    Formula {f.recSeq + 1} · R$ {isNaN(f.valor) ? "-" : f.valor.toFixed(2).replace(".", ",")}
                  </p>
                  {f.usrConf && <p>Conf: <span className="text-gray-700">{f.usrConf}</span> {f.confHora}</p>}
                  {f.usrLab  && <p>Lab: <span className="text-gray-700">{f.usrLab}</span> {f.laborHora}</p>}
                  {f.usrBal  && <p>Balcao: <span className="text-gray-700">{f.usrBal}</span> {f.balcaoHora}</p>}
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
      <p className="text-xs text-gray-400 mb-1">Formula {formula.recSeq + 1}</p>
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
      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
        {etapa === "pronto" ? (
          <><Check className="w-3 h-3 text-green-500" weight="bold" /> {motoboyLabel(formula.localArmz) ? `${motoboyLabel(formula.localArmz)}` : "No balcao"}</>
        ) : etapa === "balcao"  ? "Aguardando balcao"
          : etapa === "lab"     ? "Em laboratorio"
          : etapa === "conf"    ? "Aguardando conferencia"
          :                       "Aguardando inicio"}
      </p>
    </div>
  );
}
