declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string  // <-- our custom property
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
  }
}
