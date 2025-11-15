"use client"
import { useState } from 'react'

export default function JudgePanel({ caseId }){
  const [loading, setLoading] = useState(false)
  const [verdict, setVerdict] = useState(null)
  const [error, setError] = useState(null)

  async function requestVerdict(){
    if(!caseId){ 
      setError('Please upload a case first before requesting a verdict')
      return 
    }
    
    setLoading(true)
    setError(null)
    setVerdict(null)
    
    try {
      const res = await fetch('/api/verdict', { 
        method: 'POST', 
        headers: {'Content-Type':'application/json'}, 
        body: JSON.stringify({ caseId }) 
      })
      
      if(!res.ok) {
        throw new Error('Failed to get verdict. Please try again.')
      }
      
      const j = await res.json()
      setLoading(false)
      
      if(j.error) {
        setError('Unable to generate verdict at this time. Please try again.')
      } else {
        setVerdict(j)
      }
    } catch(err) {
      setLoading(false)
      setError('Unable to connect to the AI judge. Please check your connection and try again.')
    }
  }

  return (
    <div className="panel">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-blue-300">⚖️ AI Judge</h3>
        {caseId && (
          <span className="text-xs bg-blue-900/50 px-2 py-1 rounded text-blue-300">
            Case Active
          </span>
        )}
      </div>
      
      <button 
        className={`btn w-full text-lg py-3 ${loading ? 'opacity-75 cursor-wait' : ''}`}
        onClick={requestVerdict}
        disabled={loading || !caseId}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            Analyzing Case...
          </span>
        ) : '🔍 Request Verdict'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-900/30 border border-red-700 rounded-lg">
          <div className="flex items-start">
            <span className="text-2xl mr-3">⚠️</span>
            <div>
              <p className="text-red-200 font-semibold">Unable to Process Request</p>
              <p className="text-red-300 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {verdict && (
        <div className="mt-4 space-y-4">
          <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 p-5 rounded-lg border border-blue-700/50">
            <h4 className="font-bold text-blue-300 mb-3 flex items-center text-lg">
              <span className="text-2xl mr-2">📋</span>
              Final Verdict
            </h4>
            <p className="text-white text-lg leading-relaxed">{verdict.verdict}</p>
          </div>
          
          {verdict.reasoning && (
            <div className="bg-gray-800/50 p-5 rounded-lg border border-gray-600">
              <h4 className="font-bold text-yellow-300 mb-3 flex items-center">
                <span className="text-xl mr-2">💡</span>
                Reasoning
              </h4>
              <p className="text-gray-200 leading-relaxed">{verdict.reasoning}</p>
            </div>
          )}
          
          {verdict.confidence !== undefined && verdict.confidence !== null && (
            <div className="bg-gray-800/50 p-5 rounded-lg border border-gray-600">
              <h4 className="font-bold text-green-300 mb-3 flex items-center">
                <span className="text-xl mr-2">📊</span>
                Confidence Level
              </h4>
              <div className="space-y-2">
                <div className="bg-gray-700 rounded-full h-8 overflow-hidden shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-green-600 to-green-400 h-full flex items-center justify-end px-3 transition-all duration-1000 ease-out"
                    style={{ width: `${verdict.confidence}%` }}
                  >
                    <span className="text-white font-bold text-sm drop-shadow">
                      {verdict.confidence}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 text-center">
                  {verdict.confidence >= 80 ? 'High Confidence' : 
                   verdict.confidence >= 60 ? 'Moderate Confidence' : 
                   verdict.confidence >= 40 ? 'Low Confidence' : 
                   'Very Low Confidence'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {!caseId && !error && (
        <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-600">
          <p className="text-sm text-gray-300 text-center">
            <span className="text-xl mb-2 block">ℹ️</span>
            Upload a case below to begin the trial process
          </p>
        </div>
      )}
    </div>
  )
}
