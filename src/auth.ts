import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { allowedEmails } from "./lib/adminConfig"

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    session: {
        strategy: "jwt" as const,
    },
    pages: {
        signIn: "/auth/signin",
    },
    callbacks: {
        async signIn({ user }: any) {
            const userEmail = (user.email || "").toLowerCase()
            const isAllowed = allowedEmails.includes(userEmail)
            console.log("🔑 SignIn Attempt:", { userEmail, isAllowed, allowedEmails })
            return isAllowed
        },
        async redirect({ url, baseUrl }: any) {
            if (url.startsWith("/")) return `${baseUrl}${url}`
            else if (new URL(url).origin === baseUrl) return url
            return baseUrl
        },
        async jwt({ token, user }: any) {
            if (user) {
                token.email = user.email
                token.role = allowedEmails.includes((user.email || "").toLowerCase()) ? "admin" : "user"
                console.log("🎫 JWT Created:", { email: token.email, role: token.role })
            }
            return token
        },
        async session({ session, token }: any) {
            if (token.email && session.user) {
                session.user.email = token.email as string
                session.user.role = token.role as string
            }
            return session
        },
    },
})
