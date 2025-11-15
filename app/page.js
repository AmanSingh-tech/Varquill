"use client"
import ChatBox from '../components/ChatBox'
import JudgePanel from '../components/JudgePanel'
import UploadBox from '../components/UploadBox'
import { useState } from 'react'

export default function Page(){
  const [caseId, setCaseId] = useState(null)

  return (
    <div className="container">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center">
          <span className="text-5xl mr-3">⚖️</span>
          Varquill
        </h1>
        <p className="text-gray-400 text-lg">AI-Powered Mock Trial System</p>
        <div className="mt-4 flex items-center justify-center gap-4">
          <div className="text-xs bg-blue-900/30 px-3 py-1 rounded-full border border-blue-700">
            <span className="text-blue-300">Powered by Google Gemini</span>
          </div>
          {caseId && (
            <div className="text-xs bg-green-900/30 px-3 py-1 rounded-full border border-green-700 flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              <span className="text-green-300">Case Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="order-2 md:order-1">
          <ChatBox side="Lawyer A" caseId={caseId} setCaseId={setCaseId} />
        </div>
        <div className="order-1 md:order-2">
          <JudgePanel caseId={caseId} />
        </div>
        <div className="order-3 md:order-3">
          <ChatBox side="Lawyer B" caseId={caseId} setCaseId={setCaseId} />
        </div>
      </div>

      {/* Upload Section */}
      <div className="mt-6">
        <UploadBox setCaseId={setCaseId} />
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-gray-500 text-xs pb-4">
        <p>© 2025 Varquill • AI Judge System for Educational Purposes</p>
      </div>
    </div>
  )
}
