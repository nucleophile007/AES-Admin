// src/lib/authOptions.ts
import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { allowedEmails as allowedFromEnv } from "./adminConfig"

const fallbackAllowed = ["dkdps3212@gmail.com", "acharya.folsom@getMaxListeners.com"]
export const allowedEmails = allowedFromEnv.length ? allowedFromEnv : fallbackAllowed

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async signIn({ user }) {
      return allowedEmails.includes((user.email || "").toLowerCase())
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email
        token.role = allowedEmails.includes((user.email || "").toLowerCase()) ? "admin" : "user"
      }
      return token
    },
    async session({ session, token }) {
      if (token.email && session.user) {
        session.user.email = token.email as string
        session.user.role = token.role as string
      }
      return session
    },
  },
}
