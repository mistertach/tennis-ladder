import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"

export default async function AdminLayout({ children }) {
    const session = await getServerSession(authOptions)

    if (session?.user?.role !== 'ADMIN') {
        redirect('/dashboard')
    }

    return (
        <section>
            {children}
        </section>
    )
}
