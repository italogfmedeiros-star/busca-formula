import fs from "fs";
import path from "path";
import { parseCSV, type Receita } from "./parser";

export interface CacheEntry {
  fileName: string;
  exportedAt: Date;
  receitas: Receita[];
}

// globalThis garante que o cache é compartilhado entre instrumentation.ts e API routes
// mesmo que o Next.js carregue o módulo em instâncias separadas
declare global {
  // eslint-disable-next-line no-var
  var _watcherCache: CacheEntry | null;
}
globalThis._watcherCache ??= null;

// Extrai data/hora do nome: "Controle Interno_DDMMYYYYHHMMSS"
export function parsearNomeArquivo(nome: string): Date | null {
  const match = nome.match(/Controle Interno_(\d{2})(\d{2})(\d{4})(\d{2})(\d{2})(\d{2})/);
  if (!match) return null;
  const [, dd, mm, yyyy, hh, min, ss] = match;
  return new Date(
    parseInt(yyyy),
    parseInt(mm) - 1,
    parseInt(dd),
    parseInt(hh),
    parseInt(min),
    parseInt(ss)
  );
}

function processarArquivo(filePath: string) {
  const fileName = path.basename(filePath);
  const exportedAt = parsearNomeArquivo(fileName);
  if (!exportedAt) return;

  // Ignora se já temos um arquivo mais recente em cache
  if (globalThis._watcherCache && exportedAt <= globalThis._watcherCache.exportedAt) return;

  try {
    const text = fs.readFileSync(filePath, "latin1");
    const receitas = parseCSV(text);
    globalThis._watcherCache = { fileName, exportedAt, receitas };
    console.log(`[watcher] Novo relatório carregado: ${fileName} (${receitas.length} fórmulas)`);
  } catch (err) {
    console.error(`[watcher] Erro ao processar ${fileName}:`, err);
  }
}

export function initWatcher() {
  const pasta = process.env.PASTA_RELATORIOS;
  if (!pasta) {
    console.log("[watcher] PASTA_RELATORIOS não configurada — monitoramento desativado.");
    return;
  }

  // Processa arquivos já existentes na pasta
  try {
    const arquivos = fs.readdirSync(pasta)
      .filter((f) => /^Controle Interno_\d{14}\.csv$/i.test(f))
      .map((f) => ({ f, data: parsearNomeArquivo(f) }))
      .filter((x): x is { f: string; data: Date } => x.data !== null)
      .sort((a, b) => b.data.getTime() - a.data.getTime());

    if (arquivos.length > 0) {
      processarArquivo(path.join(pasta, arquivos[0].f));
    }
  } catch (err) {
    console.error("[watcher] Erro ao ler pasta inicial:", err);
  }

  // Verifica pasta a cada 15s procurando arquivo mais recente
  const padrao = path.join(pasta, "Controle Interno_*.csv");
  console.log(`[watcher] Monitorando: ${padrao}`);

  setInterval(() => {
    try {
      const arquivos = fs.readdirSync(pasta)
        .filter((f) => /^Controle Interno_\d{14}\.csv$/i.test(f))
        .map((f) => ({ f, data: parsearNomeArquivo(f) }))
        .filter((x): x is { f: string; data: Date } => x.data !== null)
        .sort((a, b) => b.data.getTime() - a.data.getTime());

      if (arquivos.length > 0) {
        processarArquivo(path.join(pasta, arquivos[0].f));
      }
    } catch (err) {
      console.error("[watcher] Erro ao verificar pasta:", err);
    }
  }, 15_000);
}

export function getCache(): CacheEntry | null {
  return globalThis._watcherCache;
}
