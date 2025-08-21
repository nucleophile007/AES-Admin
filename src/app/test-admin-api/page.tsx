'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'

interface TestResult {
  status: number
  data: unknown
  success: boolean
}

export default function AdminAPITestPage() {
  const { data: session, status } = useSession()
  const [results, setResults] = useState<Record<string, TestResult>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  const testAPI = async (endpoint: string, method: 'GET' | 'POST' | 'PATCH' = 'GET', body?: unknown) => {
    setLoading(prev => ({ ...prev, [endpoint]: true }))
    
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined
      })
      
      const data = await response.json()
      setResults(prev => ({
        ...prev,
        [endpoint]: {
          status: response.status,
          data,
          success: response.ok
        }
      }))
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [endpoint]: {
          status: 500,
          data: { error: error instanceof Error ? error.message : 'Unknown error' },
          success: false
        }
      }))
    } finally {
      setLoading(prev => ({ ...prev, [endpoint]: false }))
    }
  }

  if (status === "loading") return <div className="p-6">Loading...</div>
  if (status === "unauthenticated") return <div className="p-6">Please sign in first</div>

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin API Test Panel</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Session Information</h2>
          <div className="bg-gray-100 p-4 rounded">
            <pre className="text-sm">{JSON.stringify(session, null, 2)}</pre>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => testAPI('/api/admin/webinar-registrations')}
            disabled={loading['/api/admin/webinar-registrations']}
            className="bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading['/api/admin/webinar-registrations'] ? 'Testing...' : 'Test Webinar Registrations'}
          </button>

          <button
            onClick={() => testAPI('/api/admin/availability')}
            disabled={loading['/api/admin/availability']}
            className="bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading['/api/admin/availability'] ? 'Testing...' : 'Test Availability'}
          </button>

          <button
            onClick={() => testAPI('/api/admin/availability', 'POST', { 
              date: '2025-01-20', 
              times: ['10:00 AM', '2:00 PM'],
              program: 'Mathematics Tutoring'
            })}
            disabled={loading['/api/admin/availability']}
            className="bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {loading['/api/admin/availability'] ? 'Testing...' : 'Test Availability POST'}
          </button>

          <button
            onClick={() => testAPI('/api/admin/registration/1/approve', 'POST')}
            disabled={loading['/api/admin/registration/1/approve']}
            className="bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            {loading['/api/admin/registration/1/approve'] ? 'Testing...' : 'Test Approve Registration (POST)'}
          </button>

          <button
            onClick={() => testAPI('/api/admin/registration/1', 'PATCH', { approved: true })}
            disabled={loading['/api/admin/registration/1']}
            className="bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading['/api/admin/registration/1'] ? 'Testing...' : 'Test Update Registration (PATCH)'}
          </button>
        </div>

        <div className="space-y-4">
          {Object.entries(results).map(([endpoint, result]: [string, TestResult]) => (
            <div key={endpoint} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{endpoint}</h3>
                <span className={`px-3 py-1 rounded text-sm font-medium ${
                  result.success 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {result.status}
                </span>
              </div>
              <div className="bg-gray-100 p-4 rounded overflow-auto">
                <pre className="text-sm">{JSON.stringify(result.data, null, 2)}</pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
