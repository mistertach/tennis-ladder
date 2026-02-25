const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { email: true, name: true } });
    console.log(admins);
    process.exit(0);
}
run();
