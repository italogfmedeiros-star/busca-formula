"use client";

export type View = "dashboard" | "indicadores" | "upload";

interface Props {
  view: View;
  onChange: (v: View) => void;
  fileName: string | null;
}

const MENU: { id: View; label: string; icon: React.ReactNode }[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M3 7h18M3 12h18M3 17h18" />
      </svg>
    ),
  },
  {
    id: "indicadores",
    label: "Indicadores",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: "upload",
    label: "Upload",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
  },
];

export default function Sidebar({ view, onChange, fileName }: Props) {
  return (
    <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <p className="text-lg font-bold text-gray-900 tracking-tight">Busca Fórmula</p>
        <p className="text-xs text-gray-400 mt-0.5">Controle de Produção</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {MENU.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left
              ${view === item.id
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
          >
            <span className={view === item.id ? "text-blue-600" : "text-gray-400"}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Arquivo carregado */}
      {fileName && (
        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-1">Arquivo ativo</p>
          <p className="text-xs text-gray-600 truncate font-medium">{fileName}</p>
        </div>
      )}
    </aside>
  );
}
