import { handlers } from "@/auth"

// Fallback for build time when env vars might not be available
export const GET = handlers?.GET || (() => new Response('Not configured', { status: 500 }))
export const POST = handlers?.POST || (() => new Response('Not configured', { status: 500 }))
