"use client";

import { useState } from "react";
import {
  type ReceitaGroup,
  type Situacao,
  situacaoLabel,
  turnoLabel,
  etapaAtual,
} from "@/lib/parser";

interface Props {
  grupos: ReceitaGroup[];
}

const SITUACOES: { value: Situacao | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "CF", label: "Conforme" },
  { value: "AT", label: "Atraso" },
  { value: "BA", label: "Balcão c/Atraso" },
  { value: "PO", label: "Ocorrência" },
];

function situacaoBadgeClasses(s: Situacao): string {
  return {
    CF: "bg-green-100 text-green-700 border-green-200",
    AT: "bg-red-600 text-white border-red-600",
    BA: "bg-blue-100 text-blue-700 border-blue-200",
    PO: "bg-yellow-100 text-yellow-700 border-yellow-200",
    "?": "bg-gray-100 text-gray-500 border-gray-200",
  }[s];
}

function situacaoCardClasses(s: Situacao): string {
  return {
    CF: "border-green-200 bg-white",
    AT: "border-red-400 bg-red-50",
    BA: "border-blue-200 bg-white",
    PO: "border-yellow-200 bg-white",
    "?": "border-gray-200 bg-white",
  }[s];
}

function situacaoLeftBar(s: Situacao): string {
  return {
    CF: "bg-green-400",
    AT: "bg-red-500",
    BA: "bg-blue-400",
    PO: "bg-yellow-400",
    "?": "bg-gray-300",
  }[s];
}

export default function Esteira({ grupos }: Props) {
  const [filtroSit, setFiltroSit] = useState<Situacao | "ALL">("ALL");
  const [filtroFilial, setFiltroFilial] = useState("ALL");
  const [busca, setBusca] = useState("");

  const filiais = Array.from(new Set(grupos.map((g) => g.empNome))).sort();

  const filtrados = grupos.filter((g) => {
    if (filtroSit !== "ALL" && g.situacao !== filtroSit) return false;
    if (filtroFilial !== "ALL" && g.empNome !== filtroFilial) return false;
    if (busca) {
      const q = busca.toLowerCase();
      if (!g.cliente.toLowerCase().includes(q) && !g.recId.includes(q)) return false;
    }
    return true;
  });

  const contagens = {
    CF: grupos.filter((g) => g.situacao === "CF").length,
    AT: grupos.filter((g) => g.situacao === "AT").length,
    BA: grupos.filter((g) => g.situacao === "BA").length,
    PO: grupos.filter((g) => g.situacao === "PO").length,
  };

  return (
    <div className="space-y-4">
      {/* Sumário */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Contador label="Conforme"       valor={contagens.CF} cor="text-green-600"  bg="bg-green-50  border-green-200" />
        <Contador label="Atraso"         valor={contagens.AT} cor="text-orange-600" bg="bg-orange-50 border-orange-200" />
        <Contador label="Balcão c/Atraso" valor={contagens.BA} cor="text-blue-600"  bg="bg-blue-50   border-blue-200" />
        <Contador label="Ocorrência"     valor={contagens.PO} cor="text-yellow-600" bg="bg-yellow-50 border-yellow-200" />
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
        </div>
        {filiais.length > 1 && (
          <select
            value={filtroFilial}
            onChange={(e) => setFiltroFilial(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-400 bg-white"
          >
            <option value="ALL">Todas as filiais</option>
            {filiais.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        )}
        <span className="text-gray-400 text-sm ml-auto">
          {filtrados.length} receita{filtrados.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtrados.map((g) => (
          <ReceitaCard key={g.recId} grupo={g} />
        ))}
      </div>

      {filtrados.length === 0 && (
        <p className="text-center text-gray-400 py-12 text-sm">Nenhuma receita encontrada.</p>
      )}
    </div>
  );
}

function Contador({ label, valor, cor, bg }: { label: string; valor: number; cor: string; bg: string }) {
  return (
    <div className={`border rounded-xl px-4 py-3 shadow-sm ${bg}`}>
      <p className="text-gray-500 text-xs font-medium">{label}</p>
      <p className={`text-2xl font-bold ${cor}`}>{valor}</p>
    </div>
  );
}

function ReceitaCard({ grupo }: { grupo: ReceitaGroup }) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className={`rounded-xl border shadow-sm overflow-hidden ${situacaoCardClasses(grupo.situacao)}`}>
      {/* Barra lateral colorida */}
      <div className="flex">
        <div className={`w-1 shrink-0 ${situacaoLeftBar(grupo.situacao)}`} />
        <div className="flex-1 min-w-0">
          {/* Cabeçalho */}
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-gray-400 font-mono">#{grupo.recId}</p>
                <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{grupo.cliente}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full border shrink-0 font-medium ${situacaoBadgeClasses(grupo.situacao)}`}>
                {situacaoLabel(grupo.situacao)}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
              <span>📍 {grupo.empNome || "—"}</span>
              <span>👤 {grupo.vendedor || "—"}</span>
              <span>🕐 {turnoLabel(grupo.horaPrev)} · {grupo.dtaPrev}</span>
              <span className="text-gray-700 font-semibold">
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

          {/* Expandir responsáveis */}
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
                  done || etapa === "pronto"
                    ? "bg-green-400"
                    : active
                    ? "bg-blue-400"
                    : "bg-gray-200"
                }`}
              />
              {i === ETAPA_ORDER.length - 1 && (
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    etapa === "pronto" ? "bg-green-400" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 mt-0.5">
        {etapa === "pronto"
          ? "✓ No balcão"
          : etapa === "balcao"
          ? "Aguardando balcão"
          : etapa === "lab"
          ? "Em laboratório"
          : etapa === "conf"
          ? "Aguardando conferência"
          : "Aguardando início"}
      </p>
    </div>
  );
}
