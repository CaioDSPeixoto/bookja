// Service worker do Bookja — cache offline mínimo, sem dependências.
// Estratégia:
//  - Assets estáticos hasheados (/_next/static, imagens, fontes): cache-first.
//  - Navegações (documentos HTML): network-first com fallback ao cache/offline.
//  - Nunca cacheia POST, outra origem (ex.: Supabase), /api ou /auth.
// Ao mudar a lógica, incrementar a versão para invalidar caches antigos.

const VERSAO = 'v1'
const CACHE_PAGINAS = `bookja-paginas-${VERSAO}`
const CACHE_ASSETS = `bookja-assets-${VERSAO}`
const SHELL_OFFLINE = '/pt-BR'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_PAGINAS).then((cache) => cache.add(SHELL_OFFLINE)).catch(() => undefined),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const chaves = await caches.keys()
      await Promise.all(
        chaves
          .filter((chave) => chave !== CACHE_PAGINAS && chave !== CACHE_ASSETS)
          .map((chave) => caches.delete(chave)),
      )
      await self.clients.claim()
    })(),
  )
})

function ehAssetEstatico(url) {
  return (
    url.pathname.startsWith('/_next/static') ||
    /\.(?:js|css|woff2?|png|jpe?g|svg|webp|gif|ico)$/.test(url.pathname)
  )
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cacheado = await cache.match(request)
  if (cacheado) return cacheado
  const resposta = await fetch(request)
  if (resposta && resposta.ok) cache.put(request, resposta.clone())
  return resposta
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  try {
    const resposta = await fetch(request)
    if (resposta && resposta.ok) cache.put(request, resposta.clone())
    return resposta
  } catch {
    const cacheado = await cache.match(request)
    if (cacheado) return cacheado
    const shell = await cache.match(SHELL_OFFLINE)
    if (shell) return shell
    return new Response('Você está offline.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // Só mesma origem; nunca cachear Supabase/API/auth nem o próprio SW.
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/auth')) return
  if (url.pathname === '/sw.js') return

  if (ehAssetEstatico(url)) {
    event.respondWith(cacheFirst(request, CACHE_ASSETS))
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, CACHE_PAGINAS))
  }
})
