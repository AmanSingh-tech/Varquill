"use client"
import { useState } from 'react'

export default function ChatBox({ side='Lawyer A', caseId, setCaseId }){
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  async function submit(){
    if(!caseId){ 
      setError('Please upload a case before submitting arguments')
      return 
    }
    if(!text.trim()) {
      setError('Please enter an argument before submitting')
      return
    }
    
    setLoading(true)
    setError(null)
    setSuccess(false)
    
    try {
      const res = await fetch('/api/argument', { 
        method: 'POST', 
        headers: {'Content-Type':'application/json'}, 
        body: JSON.stringify({ caseId, side, text }) 
      })
      
      if(!res.ok) {
        throw new Error('Submission failed')
      }
      
      const j = await res.json()
      setLoading(false)
      
      if(j.error) {
        setError('Unable to submit argument. Please try again.')
      } else {
        setSuccess(true)
        setText('')
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch(err) {
      setLoading(false)
      setError('Unable to submit argument. Please check your connection.')
    }
  }

  const isLawyerA = side === 'Lawyer A'

  return (
    <div className="panel">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold flex items-center">
          <span className="text-2xl mr-2">{isLawyerA ? '👨‍⚖️' : '👩‍⚖️'}</span>
          <span className={isLawyerA ? 'text-blue-300' : 'text-purple-300'}>
            {side}
          </span>
        </h3>
        {caseId && (
          <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">
            Ready
          </span>
        )}
      </div>

      <textarea 
        className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors" 
        rows="6"
        value={text} 
        onChange={(e)=>{
          setText(e.target.value)
          setError(null)
        }} 
        placeholder={`Present your argument for ${side}...\n\nExample: "Your Honor, the contract clearly states..."`}
        disabled={loading || !caseId}
      />
      
      <div className="mt-3 space-y-2">
        <button 
          className={`btn w-full py-2.5 ${loading ? 'opacity-75 cursor-wait' : ''} ${success ? 'bg-green-600 hover:bg-green-600' : ''}`}
          onClick={submit}
          disabled={loading || !caseId}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Submitting...
            </span>
          ) : success ? (
            <span className="flex items-center justify-center">
              <span className="mr-2">✅</span>
              Argument Submitted!
            </span>
          ) : (
            '📤 Submit Argument'
          )}
        </button>

        {error && (
          <div className="p-3 bg-red-900/30 border border-red-700 rounded text-red-200 text-sm">
            <span className="mr-2">⚠️</span>{error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-900/30 border border-green-700 rounded text-green-200 text-sm">
            <span className="mr-2">✅</span>
            Your argument has been recorded. The judge will re-evaluate the case.
          </div>
        )}
      </div>

      {!caseId && (
        <div className="mt-3 p-3 bg-gray-800/50 rounded-lg border border-gray-600">
          <p className="text-xs text-gray-300 text-center">
            <span className="block mb-1">ℹ️</span>
            Upload a case first to begin presenting arguments
          </p>
        </div>
      )}
    </div>
  )
}
