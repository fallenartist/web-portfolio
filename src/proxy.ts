import { NextResponse, type NextRequest } from 'next/server'
import { isLocale, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE } from '@/lib/locale'
import { hasPreviewAccess } from '@/lib/preview-access'

export function proxy(request: NextRequest) {
  const previewPassword = process.env.PREVIEW_PASSWORD
  const finish = (response: NextResponse) => {
    if (previewPassword) {
      response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
      response.headers.set('Cache-Control', 'private, no-store')
    }
    return response
  }
  if (
    previewPassword &&
    !hasPreviewAccess(
      request.headers.get('authorization'),
      process.env.PREVIEW_USERNAME || 'preview',
      previewPassword,
    )
  ) {
    return finish(
      new NextResponse('Preview access requires authentication.', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Lenart preview", charset="UTF-8"' },
      }),
    )
  }
  // Preview authentication covers every route; language switching only covers pages.
  if (/^\/(?:admin|api|_next)(?:\/|$)|\.[^/]+$/.test(request.nextUrl.pathname)) {
    return finish(NextResponse.next())
  }
  const locale = request.nextUrl.searchParams.get('lang')
  if (!isLocale(locale) || !['GET', 'HEAD'].includes(request.method))
    return finish(NextResponse.next())

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
  return finish(response)
}

export const config = {
  matcher: ['/:path*'],
}
