import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { RoleType } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Correo', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = String(credentials.email).trim().toLowerCase()
        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        })

        if (!user || !user.password) return null

        const isValidPassword = await bcrypt.compare(
          String(credentials.password),
          user.password
        )

        if (!isValidPassword) return null

        const userRoles = user.roles.map((ur) => ur.role.name)

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: userRoles,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.roles = user.roles
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        if (typeof token.id === 'string') session.user.id = token.id
        session.user.roles = Array.isArray(token.roles)
          ? token.roles.filter(
              (role): role is RoleType =>
                typeof role === 'string' &&
                Object.values(RoleType).some((knownRole) => knownRole === role)
            )
          : []
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
})