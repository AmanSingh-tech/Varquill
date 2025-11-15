"use client"
import { useState } from 'react'

export default function UploadBox({ setCaseId }){
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  async function upload(e){
    e.preventDefault()
    if(!text.trim()) { 
      setError('Please enter case details before uploading')
      return 
    }
    
    setLoading(true)
    setError(null)
    setSuccess(false)
    
    try {
      const res = await fetch('/api/upload', { 
        method: 'POST', 
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ text }) 
      })
      
      if(!res.ok) {
        throw new Error('Upload failed')
      }
      
      const j = await res.json()
      setLoading(false)
      
      if(j.case_id){ 
        setCaseId(j.case_id)
        setSuccess(true)
        setText('')
        setTimeout(() => setSuccess(false), 5000)
      } else {
        setError('Unable to create case. Please try again.')
      }
    } catch(err) {
      setLoading(false)
      setError('Unable to upload case. Please check your connection and try again.')
    }
  }

  return (
    <div className="panel">
      <div className="mb-4">
        <h4 className="text-xl font-bold text-blue-300 flex items-center">
          <span className="text-2xl mr-2">📁</span>
          Upload Case
        </h4>
        <p className="text-sm text-gray-400 mt-2">
          Enter the case details with arguments from both lawyers
        </p>
      </div>

      <form onSubmit={upload} className="space-y-3">
        <div className="bg-gray-800/50 p-3 rounded border border-gray-600">
          <p className="text-xs text-gray-400 mb-2 font-semibold">FORMAT EXAMPLE:</p>
          <code className="text-xs text-green-400 block whitespace-pre-wrap">
{`CASE: Contract Dispute

LAWYER A: Client entered valid contract.
Seeking damages of $30,000.

---

LAWYER B: Contract was breached by client.
Defendant owes nothing.`}
          </code>
        </div>

        <textarea 
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setError(null)
          }}
          className="w-full p-4 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors font-mono text-sm"
          rows="10"
          placeholder="CASE: [Case Title]&#10;&#10;LAWYER A: [Arguments for plaintiff/prosecution]&#10;&#10;---&#10;&#10;LAWYER B: [Arguments for defendant/defense]"
          disabled={loading}
        />

        {error && (
          <div className="p-3 bg-red-900/30 border border-red-700 rounded text-red-200 text-sm">
            <span className="mr-2">⚠️</span>{error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-900/30 border border-green-700 rounded">
            <p className="text-green-200 font-semibold flex items-center">
              <span className="mr-2 text-xl">✅</span>
              Case Created Successfully!
            </p>
            <p className="text-green-300 text-sm mt-1">
              You can now request a verdict from the AI Judge above, or submit additional arguments.
            </p>
          </div>
        )}

        <button 
          className={`btn w-full py-3 text-lg ${loading ? 'opacity-75 cursor-wait' : ''}`}
          type="submit" 
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Creating Case...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <span className="mr-2">📤</span>
              Upload Case
            </span>
          )}
        </button>
      </form>
    </div>
  )
}
