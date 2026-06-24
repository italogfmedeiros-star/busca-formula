import fs from "fs";
import path from "path";
import { parseCSV, type Receita } from "./parser";

export interface CacheEntry {
  fileName: string;
  exportedAt: Date;
  receitas: Receita[];
}

let cache: CacheEntry | null = null;

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
  if (cache && exportedAt <= cache.exportedAt) return;

  try {
    const text = fs.readFileSync(filePath, "latin1");
    const receitas = parseCSV(text);
    cache = { fileName, exportedAt, receitas };
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

  // Inicia monitoramento contínuo
  import("chokidar").then(({ default: chokidar }) => {
    const padrao = path.join(pasta, "Controle Interno_*.csv");
    const watcher = chokidar.watch(padrao, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 1000, pollInterval: 200 },
    });

    watcher.on("add", (filePath: string) => processarArquivo(filePath));
    watcher.on("change", (filePath: string) => processarArquivo(filePath));

    console.log(`[watcher] Monitorando: ${padrao}`);
  });
}

export function getCache(): CacheEntry | null {
  return cache;
}
