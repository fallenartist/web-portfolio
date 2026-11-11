import { NextResponse, type NextRequest } from 'next/server'
import { isLocale, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE } from '@/lib/locale'

export function proxy(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get('lang')
  if (!isLocale(locale) || !['GET', 'HEAD'].includes(request.method)) return NextResponse.next()

  const url = request.nextUrl.clone()
  url.searchParams.delete('lang')
  const response = NextResponse.redirect(url, 307)
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: 'lax',
    httpOnly: true,
    secure: request.nextUrl.protocol === 'https:',
  })
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}

export const config = {
  matcher: ['/((?!admin(?:/|$)|api(?:/|$)|_next(?:/|$)|.*\\.[^/]+$).*)'],
}
