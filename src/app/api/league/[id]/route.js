import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/prisma"

export async function DELETE(req, { params }) {
    const session = await getServerSession(authOptions)

    if (session?.user?.role !== 'ADMIN') {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const { id } = await params

    if (!id) {
        return new NextResponse('League ID required', { status: 400 })
    }

    try {
        await prisma.league.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting league:", error)
        return new NextResponse(error.message, { status: 500 })
    }
}
