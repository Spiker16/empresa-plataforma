import { PrismaClient, RoleType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando carga de datos iniciales (Seed)...')

  // 1. Crear Roles del sistema
  const roles: RoleType[] = [
    'SUPER_ADMIN',
    'ADMIN_VEHICULOS',
    'ASESOR_COMERCIAL',
  ]

  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    })
  }
  console.log('Roles del sistema creados/verificados.')

  // 2. Crear Usuario Super Admin inicial
  const adminEmail = 'admin@empresa.com'
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('Admin123456*', 10)

    const superAdminRole = await prisma.role.findUnique({
      where: { name: 'SUPER_ADMIN' },
    })

    if (superAdminRole) {
      await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: 'Super Administrador',
          phone: '+573000000000',
          roles: {
            create: {
              roleId: superAdminRole.id,
            },
          },
        },
      })
      console.log(` Usuario Super Admin creado: ${adminEmail} / Admin123456*`)
    }
  } else {
    console.log(' El usuario Super Admin ya existe.')
  }

  console.log('✨ Carga inicial completada exitosamente.')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })