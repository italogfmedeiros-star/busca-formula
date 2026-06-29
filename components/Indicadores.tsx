"use client";

import { TrendDown, FunnelSimple, ArrowRight, ChartBar } from "@phosphor-icons/react";
import { type Indicadores } from "@/lib/parser";

interface Props {
  dados: Indicadores;
}

const FILIAL_CLASSES: Record<string, string> = {
  AMERICO: "bg-violet-100 text-violet-700",
  MOEMA:   "bg-teal-100 text-teal-700",
};

const FILIAL_BAR: Record<string, string> = {
  AMERICO: "bg-violet-400",
  MOEMA:   "bg-teal-400",
};

function formatarHoras(h: number | null): string {
  if (h === null) return "-";
  if (h < 1) return `${Math.round(h * 60)}min`;
  return `${h.toFixed(1)}h`;
}

export default function PainelIndicadores({ dados }: Props) {
  return (
    <div className="space-y-6 max-w-4xl">

      {/* Metricas rapidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricaCard
          label="Taxa de Atraso"
          valor={`${dados.taxaAtraso.toFixed(1)}%`}
          cor={dados.taxaAtraso > 30 ? "text-red-600" : dados.taxaAtraso > 15 ? "text-orange-500" : "text-green-600"}
          sub={`${Math.round((dados.taxaAtraso / 100) * dados.totalReceitas)} de ${dados.totalReceitas} receitas`}
          Icon={TrendDown}
        />
        <MetricaCard
          label="Gargalo Atual"
          valor={dados.gargalo?.etapa ?? "Nenhum"}
          cor={dados.gargalo ? "text-orange-600" : "text-green-600"}
          sub={dados.gargalo ? `${dados.gargalo.quantidade} formulas paradas` : "Fluxo normal"}
          Icon={FunnelSimple}
        />
        <MetricaCard
          label="Conf a Lab"
          valor={formatarHoras(dados.tempoMedioConfLab)}
          cor="text-blue-600"
          sub="tempo medio"
          Icon={ArrowRight}
        />
        <MetricaCard
          label="Lab a Balcao"
          valor={formatarHoras(dados.tempoMedioLabBalcao)}
          cor="text-blue-600"
          sub="tempo medio"
          Icon={ArrowRight}
        />
      </div>

      {/* Volume por filial e por vendedor */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* Por filial */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ChartBar className="w-4 h-4 text-gray-400" />
            <p className="text-xs font-medium text-gray-500">Volume por Filial</p>
          </div>
          <div className="space-y-3">
            {dados.porFilial.map((f) => (
              <div key={f.nome} className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded font-medium w-20 text-center shrink-0 ${FILIAL_CLASSES[f.nome] ?? "bg-gray-100 text-gray-600"}`}>
                  {f.nome}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all ${FILIAL_BAR[f.nome] ?? "bg-gray-400"}`}
                    style={{ width: `${(f.total / dados.totalReceitas) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700 w-6 text-right shrink-0">{f.total}</span>
                {f.atraso > 0 && (
                  <span className="text-xs text-red-500 shrink-0">{f.atraso} AT</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Por vendedor */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ChartBar className="w-4 h-4 text-gray-400" />
            <p className="text-xs font-medium text-gray-500">Volume por Vendedor</p>
          </div>
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {dados.porVendedor.map((v) => (
              <div key={v.nome} className="flex items-center gap-3">
                <span className="text-xs text-gray-700 w-28 truncate shrink-0">{v.nome}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 bg-blue-400 rounded-full transition-all"
                    style={{ width: `${(v.total / dados.porVendedor[0].total) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700 w-5 text-right shrink-0">{v.total}</span>
                {v.atraso > 0 && (
                  <span className="text-xs text-red-500 shrink-0">{v.atraso}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricaCard({ label, valor, cor, sub, Icon }: {
  label: string;
  valor: string;
  cor: string;
  sub: string;
  Icon: React.ElementType;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-4 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <Icon className="w-3.5 h-3.5 text-gray-300" />
      </div>
      <p className={`text-2xl font-bold leading-tight ${cor}`}>{valor}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}
