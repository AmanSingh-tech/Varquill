"use client"
export default function ProgressBar({ progress=0 }){
  const pct = Math.round(Math.min(100, Math.max(0, progress*100)))
  
  return (
    <div className="panel">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-300 flex items-center">
          <span className="mr-2">📈</span>
          Case Progress
        </h4>
        <span className="text-xs text-gray-400">{pct}%</span>
      </div>
      <div className="bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
        <div 
          className="bg-gradient-to-r from-blue-600 to-purple-600 h-full transition-all duration-500 ease-out"
          style={{width: `${pct}%`}} 
        />
      </div>
      <p className="text-xs text-gray-400 mt-2 text-center">
        {pct === 0 ? 'Upload a case to begin' : 
         pct < 30 ? 'Initial arguments' : 
         pct < 70 ? 'Case under review' : 
         pct < 100 ? 'Final deliberations' : 
         'Case complete'}
      </p>
    </div>
  )
}
