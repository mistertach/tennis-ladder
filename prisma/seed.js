const { PrismaClient } = require('@prisma/client')
const { hash } = require('bcryptjs')
const { Pool } = require('pg')
const { PrismaPg } = require('@prisma/adapter-pg')

async function main() {
    // Setup Adapter
    const connectionString = process.env.DATABASE_URL
    const pool = new Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    const prisma = new PrismaClient({ adapter })

    try {
        const password = await hash('admin123', 12)

        const admin = await prisma.user.upsert({
            where: { email: 'admin@admin.com' },
            update: {},
            create: {
                email: 'admin@admin.com',
                name: 'Admin User',
                password,
                role: 'ADMIN'
            }
        })

        console.log({ admin })

        // dummy players
        const playerPassword = await hash('password123', 12)
        const players = ['Roger', 'Rafa', 'Novak', 'Andy']
        for (const p of players) {
            await prisma.user.upsert({
                where: { email: `${p.toLowerCase()}@test.com` },
                update: {},
                create: {
                    email: `${p.toLowerCase()}@test.com`,
                    name: p,
                    password: playerPassword,
                    role: 'PLAYER'
                }
            })
        }
    } catch (e) {
        console.error(e)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
        await pool.end()
    }
}

main()
