'use server'

import { buscarCatalogo } from './queries'

/** Carrega uma página do catálogo (usada pelo scroll infinito no cliente). */
export async function carregarHistorias(filtros: { busca?: string; tagId?: string; pagina?: number }) {
  const { projetos, totalPaginas } = await buscarCatalogo(filtros)
  return { projetos, totalPaginas }
}
