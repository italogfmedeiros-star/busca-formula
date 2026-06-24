import { NextResponse } from "next/server";
import { getCache } from "@/lib/watcher";
import {
  groupReceitas,
  groupPorDia,
  calcularIndicadores,
  hojeCSV,
} from "@/lib/parser";

export async function GET() {
  const cache = getCache();

  if (!cache) {
    return NextResponse.json({ status: "empty" }, { status: 404 });
  }

  const hoje = hojeCSV();
  const grupos = groupReceitas(cache.receitas, hoje);
  const dias = groupPorDia(grupos, hoje);
  const indicadores = calcularIndicadores(grupos);

  return NextResponse.json({
    status: "ok",
    fileName: cache.fileName,
    exportedAt: cache.exportedAt.toISOString(),
    totalReceitas: cache.receitas.length,
    dias,
    indicadores,
  });
}
