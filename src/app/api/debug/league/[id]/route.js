
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request, { params }) {
    const { id } = await params
    const league = await prisma.league.findUnique({
        where: { id },
    })
    return NextResponse.json(league)
}
