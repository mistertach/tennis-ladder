import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    try {
        const user = await prisma.user.findFirst({ where: { role: 'PLAYER' } })
        console.log("Updating user", user.id)
        await prisma.user.update({
            where: { id: user.id },
            data: { profileImage: "https://example.com/test.png" }
        })
        console.log("Success")
    } catch (e) {
        console.error("PRISMA ERROR:", e)
    } finally {
        await prisma.$disconnect()
    }
}
main()
