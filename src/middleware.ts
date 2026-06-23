import createIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale, localePrefix } from './i18n/config';
import { atualizarSessao } from './lib/supabase/middleware';
import { type NextRequest } from 'next/server';

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix
});

export async function middleware(request: NextRequest) {
  // Atualiza sessão do Supabase (refresh token)
  await atualizarSessao(request);

  // Aplica roteamento de idioma
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
