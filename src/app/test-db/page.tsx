"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function TestDatabasePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function testConnection() {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/test-db");
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Database Connection Test</h1>
      
      <Button 
        onClick={testConnection} 
        disabled={loading} 
        className="mb-4"
      >
        {loading ? "Testing..." : "Test Database Connection"}
      </Button>
      
      {error && (
        <div className="p-4 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h2 className="font-bold">Error</h2>
          <p>{error}</p>
        </div>
      )}
      
      {result && (
        <div className={`p-4 mb-4 border rounded ${result.status === "success" ? "bg-green-100 border-green-400 text-green-700" : "bg-red-100 border-red-400 text-red-700"}`}>
          <h2 className="font-bold">Connection Status: {result.status}</h2>
          <p><strong>Database:</strong> {result.database}</p>
          <p><strong>Message:</strong> {result.message || "Connection successful"}</p>
          
          {result.stats && (
            <div className="mt-4">
              <h3 className="font-semibold">Database Stats:</h3>
              <ul className="list-disc pl-4">
                <li>Students: {result.stats.students}</li>
                <li>Teachers: {result.stats.teachers}</li>
                <li>Session Approvals: {result.stats.sessions}</li>
              </ul>
            </div>
          )}
          
          {result.timestamp && (
            <p className="mt-2 text-sm text-gray-500">
              Last checked: {new Date(result.timestamp).toLocaleString()}
            </p>
          )}
          
          {result.error && (
            <div className="mt-2">
              <h3 className="font-semibold">Error Details:</h3>
              <pre className="bg-gray-100 p-2 rounded overflow-x-auto">
                {result.error}
              </pre>
            </div>
          )}
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Next Steps</h2>
        <ul className="list-disc pl-4">
          <li>If connection fails, check your <code>.env</code> file DATABASE_URL and DIRECT_URL</li>
          <li>Ensure URL encoding is correct (@ should be encoded as %40 in passwords)</li>
          <li>Check if database is accessible from your current network</li>
          <li>Verify Prisma schema matches actual database schema</li>
          <li>Run <code>npx prisma db pull</code> to sync schema with database</li>
        </ul>
      </div>
    </div>
  );
}