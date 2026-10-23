import { auth } from '@/lib/auth'
import { ADMIN_ROLES, hasAnyRole } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import { Bricolage_Grotesque, Instrument_Sans } from 'next/font/google'
import Sidebar from '@/components/admin/Sidebar'
import Header from '@/components/admin/Header'

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--f-display',
  display: 'swap',
})

const body = Instrument_Sans({
  subsets: ['latin'],
  variable: '--f-body',
  display: 'swap',
})

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (!(await hasAnyRole(ADMIN_ROLES))) {
    redirect('/')
  }

  const userRoles = session.user.roles ?? []

  return (
    <div
      className={`${display.variable} ${body.variable} crm flex min-h-screen flex-col lg:flex-row`}
    >
      {/* Sidebar Navigation */}
      <Sidebar userRoles={userRoles} />

      {/* Main Content Area */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          userName={session.user.name}
          userEmail={session.user.email}
        />
        <main className="crm-main min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}