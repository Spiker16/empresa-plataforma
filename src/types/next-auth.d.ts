import type { RoleType } from '@prisma/client'
import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface User {
    roles: RoleType[]
  }

  interface Session {
    user: {
      id: string
      roles: RoleType[]
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    roles?: RoleType[]
  }
}
