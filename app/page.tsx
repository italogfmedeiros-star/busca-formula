"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar, { type View } from "@/components/Sidebar";
import UploadArea from "@/components/UploadArea";
import Esteira from "@/components/Esteira";
import PainelIndicadores from "@/components/Indicadores";
import {
  parseCSV,
  groupReceitas,
  groupPorDia,
  calcularIndicadores,
  hojeCSV,
  type DiaGroup,
  type Indicadores,
} from "@/lib/parser";

const POLL_INTERVAL_MS = 30_000;

function formatarExportacao(iso: string): string {
  const d = new Date(iso);
  const dd   = String(d.getDate()).padStart(2, "0");
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh   = String(d.getHours()).padStart(2, "0");
  const min  = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} às ${hh}:${min}`;
}

export default function Home() {
  const [view, setView] = useState<View>("upload");
  const [dias, setDias] = useState<DiaGroup[]>([]);
  const [indicadores, setIndicadores] = useState<Indicadores | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [exportedAt, setExportedAt] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [autoAtivo, setAutoAtivo] = useState(false);

  const carregarDaAPI = useCallback(async (exportedAtAtual?: string) => {
    try {
      const res = await fetch("/api/receitas");
      if (!res.ok) return;
      const data = await res.json();

      // Só atualiza se for um relatório mais novo
      if (exportedAtAtual && data.exportedAt <= exportedAtAtual) return;

      setDias(data.dias);
      setIndicadores(data.indicadores);
      setTotal(data.totalReceitas);
      setFileName(data.fileName);
      setExportedAt(data.exportedAt);
      setAutoAtivo(true);
      setView((v) => v === "upload" ? "dashboard" : v);
    } catch {
      // API indisponível (ex: Vercel sem watcher) — ignora silenciosamente
    }
  }, []);

  // Tenta carregar da API ao iniciar
  useEffect(() => {
    carregarDaAPI();
  }, [carregarDaAPI]);

  // Polling a cada 30s quando o watcher está ativo
  useEffect(() => {
    if (!autoAtivo) return;
    const id = setInterval(() => {
      setExportedAt((atual) => {
        carregarDaAPI(atual ?? undefined);
        return atual;
      });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [autoAtivo, carregarDaAPI]);

  function handleFile(file: File) {
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const receitas = parseCSV(text);
        const grupos = groupReceitas(receitas);
        setDias(groupPorDia(grupos, hojeCSV()));
        setIndicadores(calcularIndicadores(grupos));
        setTotal(receitas.length);
        setFileName(file.name);
        setExportedAt(null);
        setView("dashboard");
      } catch {
        setError("Erro ao processar o arquivo. Verifique se é um CSV exportado pelo ERP.");
      }
    };
    reader.readAsText(file, "latin1");
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar view={view} onChange={setView} fileName={fileName} />

      <main className="flex-1 overflow-y-auto">
        {/* View: Upload */}
        {view === "upload" && (
          <div className="max-w-2xl mx-auto px-8 py-10 space-y-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Upload de Relatório</h1>
              <p className="text-sm text-gray-500 mt-1">
                Importe o relatório de Controle Interno exportado pelo ERP.
              </p>
            </div>

            <UploadArea onFile={handleFile} />

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {fileName && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>
                  <strong>{fileName}</strong> carregado com sucesso —{" "}
                  <button
                    className="underline font-medium"
                    onClick={() => setView("dashboard")}
                  >
                    ver dashboard
                  </button>
                </span>
              </div>
            )}

            <div className="bg-gray-100 rounded-xl px-5 py-4 text-xs text-gray-500 space-y-1">
              <p className="font-medium text-gray-600">Formatos aceitos</p>
              <p>.csv exportado pelo ERP (separador <code className="bg-gray-200 px-1 rounded">;</code>, encoding latin1)</p>
            </div>
          </div>
        )}

        {/* View: Dashboard */}
        {view === "dashboard" && (
          <div className="px-6 py-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
                {fileName && (
                  <p className="text-sm text-gray-400 mt-0.5">
                    {total} fórmulas
                    {exportedAt
                      ? <span className="ml-2 text-green-600">· Exportado em {formatarExportacao(exportedAt)}</span>
                      : <span className="ml-1 text-gray-400">· {fileName}</span>
                    }
                  </p>
                )}
              </div>
            </div>

            {dias.length > 0
              ? <Esteira dias={dias} />
              : <EmptyState onUpload={() => setView("upload")} />
            }
          </div>
        )}

        {/* View: Indicadores */}
        {view === "indicadores" && (
          <div className="px-6 py-6 space-y-5">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Indicadores</h1>
              {fileName && (
                <p className="text-sm text-gray-400 mt-0.5">{fileName} · {total} fórmulas</p>
              )}
            </div>

            {exportedAt && (
              <p className="text-sm text-gray-400">
                Exportado em {formatarExportacao(exportedAt)}
              </p>
            )}
            {indicadores
              ? <PainelIndicadores dados={indicadores} />
              : <EmptyState onUpload={() => setView("upload")} />
            }
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p className="text-gray-500 text-sm font-medium">Nenhum relatório carregado</p>
      <p className="text-gray-400 text-xs mt-1 mb-4">Importe um CSV do ERP para visualizar os dados</p>
      <button
        onClick={onUpload}
        className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Ir para Upload
      </button>
    </div>
  );
}
