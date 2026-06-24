"use client";

import { useState } from "react";
import { type Indicadores } from "@/lib/parser";

interface Props {
  dados: Indicadores;
}

const FILIAL_CLASSES: Record<string, string> = {
  AMERICO: "bg-violet-100 text-violet-700",
  MOEMA:   "bg-teal-100   text-teal-700",
};

function formatarHoras(h: number | null): string {
  if (h === null) return "—";
  if (h < 1) return `${Math.round(h * 60)}min`;
  return `${h.toFixed(1)}h`;
}

export default function PainelIndicadores({ dados }: Props) {
  const [aberto, setAberto] = useState(true);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Cabeçalho */}
      <button
        onClick={() => setAberto(!aberto)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-700">Indicadores de Produção</span>
        <span className="text-gray-400 text-xs">{aberto ? "Ocultar ▲" : "Expandir ▼"}</span>
      </button>

      {aberto && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-5">

          {/* Linha 1 — métricas rápidas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricaCard
              label="Taxa de Atraso"
              valor={`${dados.taxaAtraso.toFixed(1)}%`}
              cor={dados.taxaAtraso > 30 ? "text-red-600" : dados.taxaAtraso > 15 ? "text-orange-500" : "text-green-600"}
              sub={`${Math.round((dados.taxaAtraso / 100) * dados.totalReceitas)} de ${dados.totalReceitas} receitas`}
            />
            <MetricaCard
              label="Gargalo Atual"
              valor={dados.gargalo?.etapa ?? "Nenhum"}
              cor={dados.gargalo ? "text-orange-600" : "text-green-600"}
              sub={dados.gargalo ? `${dados.gargalo.quantidade} fórmulas paradas` : "Fluxo normal"}
            />
            <MetricaCard
              label="Conf → Lab"
              valor={formatarHoras(dados.tempoMedioConfLab)}
              cor="text-blue-600"
              sub="tempo médio"
            />
            <MetricaCard
              label="Lab → Balcão"
              valor={formatarHoras(dados.tempoMedioLabBalcao)}
              cor="text-blue-600"
              sub="tempo médio"
            />
          </div>

          {/* Linha 2 — por filial e por vendedor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Por filial */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Volume por Filial</p>
              <div className="space-y-2">
                {dados.porFilial.map((f) => (
                  <div key={f.nome} className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium w-20 text-center shrink-0 ${FILIAL_CLASSES[f.nome] ?? "bg-gray-100 text-gray-600"}`}>
                      {f.nome}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 bg-violet-400 rounded-full"
                        style={{ width: `${(f.total / dados.totalReceitas) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 w-6 text-right">{f.total}</span>
                    {f.atraso > 0 && (
                      <span className="text-xs text-red-500">({f.atraso} AT)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Por vendedor */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Volume por Vendedor</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {dados.porVendedor.map((v) => (
                  <div key={v.nome} className="flex items-center gap-2">
                    <span className="text-xs text-gray-700 w-28 truncate shrink-0">{v.nome}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 bg-blue-400 rounded-full"
                        style={{ width: `${(v.total / dados.porVendedor[0].total) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 w-5 text-right shrink-0">{v.total}</span>
                    {v.atraso > 0 && (
                      <span className="text-xs text-red-500 shrink-0">({v.atraso})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricaCard({ label, valor, cor, sub }: {
  label: string;
  valor: string;
  cor: string;
  sub: string;
}) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className={`text-xl font-bold leading-tight mt-0.5 ${cor}`}>{valor}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}
