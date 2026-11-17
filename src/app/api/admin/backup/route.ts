import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { checkAdminAuth } from '@/lib/adminAuth'

export const runtime = 'nodejs'

const pgDumpCommand = [
  process.env.PG_DUMP_PATH,
  '/opt/homebrew/opt/postgresql@17/bin/pg_dump',
  '/usr/local/opt/postgresql@17/bin/pg_dump',
  'pg_dump',
].find((candidate) => candidate && (candidate === 'pg_dump' || existsSync(candidate))) || 'pg_dump'

const connectionEnvironment = (connectionString: string): Record<string, string> => {
  const url = new URL(connectionString)
  const environment: Record<string, string> = {
    PGHOST: url.hostname,
    PGPORT: url.port || '5432',
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
    PGDATABASE: url.pathname.replace(/^\//, '') || 'postgres',
  }
  if (url.protocol === 'postgresql:' || url.protocol === 'postgres:') environment.PGSSLMODE = 'require'
  return environment
}

export async function GET() {
  const authResult = await checkAdminAuth()
  if (!authResult.success) {
    return Response.json({ error: authResult.error }, { status: authResult.statusCode || 403 })
  }

  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL
  if (!connectionString) {
    return Response.json({ error: 'Database backup is not configured.' }, { status: 503 })
  }

  let environment: Record<string, string>
  try {
    environment = connectionEnvironment(connectionString)
  } catch {
    return Response.json({ error: 'Database backup configuration is invalid.' }, { status: 503 })
  }

  const dump = spawn(pgDumpCommand, [
    '--format=plain',
    '--no-owner',
    '--no-privileges',
    '--clean',
    '--if-exists',
  ], {
    env: { ...process.env, ...environment } as NodeJS.ProcessEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      dump.stdout.on('data', (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)))
      dump.stderr.on('data', (chunk: Buffer) => {
        console.error('Database backup failed:', chunk.toString().trim())
      })
      dump.on('error', (error) => {
        console.error('Could not start database backup:', error)
        controller.error(new Error('Could not start database backup.'))
      })
      dump.on('close', (code) => {
        if (code === 0) {
          controller.close()
        } else {
          controller.error(new Error('Database backup failed.'))
        }
      })
    },
    cancel() {
      dump.kill()
    },
  })

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  return new Response(stream, {
    headers: {
      'Content-Type': 'application/sql; charset=utf-8',
      'Content-Disposition': `attachment; filename="aes-admin-backup-${timestamp}.sql"`,
      'Cache-Control': 'no-store',
    },
  })
}
