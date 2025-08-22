// src/lib/authOptions.ts
import GoogleProvider from "next-auth/providers/google"
import { allowedEmails as allowedFromEnv } from "./adminConfig"

const fallbackAllowed = ["dkdps3212@gmail.com", "acharya.folsom@getMaxListeners.com"]
export const allowedEmails = allowedFromEnv.length ? allowedFromEnv : fallbackAllowed

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt' as const,
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async signIn({ user }: any) {
      return allowedEmails.includes((user.email || "").toLowerCase())
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async redirect({ url, baseUrl }: any) {
      // After sign in, redirect to home page (which will handle admin checking)
      if (url.startsWith("/")) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user }: any) {
      if (user) {
        token.email = user.email
        token.role = allowedEmails.includes((user.email || "").toLowerCase()) ? "admin" : "user"
      }
      return token
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      if (token.email && session.user) {
        session.user.email = token.email as string
        session.user.role = token.role as string
      }
      return session
    },
  },
}
