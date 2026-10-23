import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnAdmin = req.nextUrl.pathname.startsWith('/admin')
  const roles = req.auth?.user?.roles ?? []

  if (isOnAdmin && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  if (isOnAdmin && !roles.some((role) => role !== 'CLIENTE')) {
    return NextResponse.redirect(new URL('/', req.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/admin/:path*'],
}
