"use client";

import { Flask, SquaresFour, ChartBar, Upload } from "@phosphor-icons/react";

export type View = "dashboard" | "indicadores" | "upload";

interface Props {
  view: View;
  onChange: (v: View) => void;
  fileName: string | null;
}

const MENU: { id: View; label: string; Icon: React.ElementType }[] = [
  { id: "dashboard",   label: "Dashboard",   Icon: SquaresFour },
  { id: "indicadores", label: "Indicadores", Icon: ChartBar },
  { id: "upload",      label: "Upload",      Icon: Upload },
];

export default function Sidebar({ view, onChange, fileName }: Props) {
  return (
    <aside className="w-56 shrink-0 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      {/* Wordmark */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <Flask weight="fill" className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">Busca Fórmula</p>
            <p className="text-[11px] text-gray-400 leading-tight">Controle de Produção</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {MENU.map(({ id, label, Icon }) => {
          const active = view === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left
                ${active
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
            >
              <Icon weight={active ? "fill" : "regular"} className="w-4 h-4 shrink-0" />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Arquivo ativo */}
      {fileName && (
        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-1">Arquivo ativo</p>
          <p className="text-xs text-gray-600 truncate font-medium">{fileName}</p>
        </div>
      )}
    </aside>
  );
}
