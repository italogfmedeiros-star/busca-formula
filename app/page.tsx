"use client";

import { useState } from "react";
import UploadArea from "@/components/UploadArea";
import Esteira from "@/components/Esteira";
import { parseCSV, groupReceitas, type ReceitaGroup } from "@/lib/parser";

export default function Home() {
  const [grupos, setGrupos] = useState<ReceitaGroup[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File) {
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const receitas = parseCSV(text);
        setGrupos(groupReceitas(receitas));
        setTotal(receitas.length);
        setFileName(file.name);
      } catch {
        setError("Erro ao processar o arquivo. Verifique se é um CSV exportado pelo ERP.");
      }
    };
    reader.readAsText(file, "latin1");
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 shadow-sm">
        <span className="text-xl font-bold tracking-tight text-gray-900">Busca Fórmula</span>
        {fileName && (
          <span className="text-sm text-gray-500 ml-2">
            — {fileName} ·{" "}
            <span className="text-blue-600 font-medium">{total} fórmulas</span>
          </span>
        )}
      </header>

      <div className="px-6 py-6 space-y-6 max-w-screen-2xl mx-auto">
        <UploadArea onFile={handleFile} />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {grupos.length > 0 && <Esteira grupos={grupos} />}
      </div>
    </main>
  );
}
