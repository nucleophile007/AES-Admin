"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function AdminDiagnosticsPage() {
  const [loading, setLoading] = useState(false);
  const [dbResult, setDbResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function testDatabase() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/test-db");
      const data = await response.json();
      setDbResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-yellow-300 text-blue-900 text-xs font-bold">
                  DB
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin System Diagnostics</h1>
                <p className="text-sm text-gray-700">
                  Test database connectivity and environment configuration
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Database card */}
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
            <h2 className="text-xl font-semibold mb-4">Database Connection</h2>

            <Button
              onClick={testDatabase}
              disabled={loading}
              className="mb-4 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? "Testing..." : "Test Database Connection"}
            </Button>

            {dbResult && (
              <div
                className={`p-4 mb-4 border rounded ${
                  dbResult.status === "success"
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <h3 className="font-medium">Status: {dbResult.status}</h3>
                <p>
                  <strong>Database:</strong> {dbResult.database}
                </p>

                {dbResult.stats && (
                  <div className="mt-2">
                    <h4 className="font-medium">Database Stats:</h4>
                    <ul className="list-disc pl-5 mt-1">
                      <li>Students: {dbResult.stats.students}</li>
                      <li>Teachers: {dbResult.stats.teachers}</li>
                      <li>Webinar Registrations: {dbResult.stats.webinars}</li>
                    </ul>
                  </div>
                )}

                {dbResult.error && (
                  <div className="mt-2 p-2 bg-red-100 rounded text-red-800">
                    <h4 className="font-medium">Error:</h4>
                    <p className="font-mono text-sm">{dbResult.error}</p>
                  </div>
                )}

                <p className="mt-2 text-xs text-gray-500">
                  Last checked:{" "}
                  {dbResult.timestamp
                    ? new Date(dbResult.timestamp).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded">
                <h3 className="font-medium text-red-800">Error</h3>
                <p>{error}</p>
              </div>
            )}

            <div className="mt-4 bg-yellow-50 p-4 rounded border border-yellow-200">
              <h3 className="font-medium mb-2">Database Configuration Tips</h3>
              <ul className="list-disc pl-5 text-sm">
                <li className="mb-1">
                  For Supabase with pgBouncer, use connection pooling parameters
                </li>
                <li className="mb-1">
                  Encode special characters in passwords (@ as %40)
                </li>
                <li className="mb-1">
                  Always use both DATABASE_URL and DIRECT_URL
                </li>
                <li className="mb-1">
                  Run{" "}
                  <code className="bg-gray-100 px-1 rounded">npm run db:test</code>{" "}
                  to test connections from CLI
                </li>
              </ul>
            </div>
          </div>

          {/* Environment card */}
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
            <h2 className="text-xl font-semibold mb-4">Environment Information</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">Node.js Environment</h3>
                <p className="text-sm bg-gray-50 p-2 rounded">
                  {process.env.NODE_ENV || "Not available"}
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-1">Authentication Provider</h3>
                <p className="text-sm bg-gray-50 p-2 rounded">NextAuth.js</p>
              </div>

              <div>
                <h3 className="font-medium mb-1">Database Provider</h3>
                <p className="text-sm bg-gray-50 p-2 rounded">
                  PostgreSQL via Prisma ORM
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-1">Database Access</h3>
                <p className="text-sm bg-gray-50 p-2 rounded">
                  {dbResult?.database || "Not connected"}
                </p>
              </div>
            </div>
          </div>

          {/* System health card */}
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6 md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">System Health</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className={`p-4 rounded border ${
                  dbResult?.status === "success"
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <h3 className="font-medium">Database</h3>
                <p
                  className={`text-lg font-bold ${
                    dbResult?.status === "success"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {dbResult?.status === "success" ? "Connected" : "Disconnected"}
                </p>
              </div>

              <div className="p-4 rounded bg-blue-50 border border-blue-200">
                <h3 className="font-medium">API Status</h3>
                <p className="text-lg font-bold text-green-600">Online</p>
              </div>

              <div className="p-4 rounded bg-yellow-50 border border-yellow-200">
                <h3 className="font-medium">Authentication</h3>
                <p className="text-lg font-bold text-green-600">Active</p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-medium mb-2">Troubleshooting Steps</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  Verify that{" "}
                  <code className="bg-gray-100 px-1 rounded">.env</code> file
                  contains correct database connection strings
                </li>
                <li>
                  Check that DATABASE_URL includes{" "}
                  <code className="bg-gray-100 px-1 rounded">
                    ?pgbouncer=true&connection_limit=1
                  </code>{" "}
                  for Supabase
                </li>
                <li>
                  Ensure DIRECT_URL is configured for database migrations and
                  introspection
                </li>
                <li>
                  Verify that the database schema matches the Prisma schema
                </li>
                <li>
                  Run{" "}
                  <code className="bg-gray-100 px-1 rounded">
                    npx prisma db pull
                  </code>{" "}
                  to synchronize the schema from database
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}