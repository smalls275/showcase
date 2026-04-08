import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, RotateCcw, Zap } from 'lucide-react'
import { AnomalyDetector, generateTimeSeries } from '../ml/anomalyDetection.js'

const CANVAS_W = 700
const CANVAS_H = 350
const PADDING = { top: 20, right: 20, bottom: 30, left: 50 }

export default function AnomalyDetectionPage() {
  const canvasRef = useRef(null)
  const detectorRef = useRef(new AnomalyDetector())

  const [timeSeries, setTimeSeries] = useState([])
  const [results, setResults] = useState([])
  const [anomalyRate, setAnomalyRate] = useState(0.05)
  const [zThreshold, setZThreshold] = useState(2.5)
  const [sensitivity, setSensitivity] = useState(0.34)
  const [stats, setStats] = useState({ total: 0, detected: 0, injected: 0, precision: 0, recall: 0 })

  const generate = useCallback(() => {
    const data = generateTimeSeries(200, anomalyRate)
    setTimeSeries(data)
    return data
  }, [anomalyRate])

  const detect = useCallback((data) => {
    const detector = new AnomalyDetector({ zThreshold, sensitivity, windowSize: 10, iqrMultiplier: 1.5 })
    detectorRef.current = detector
    const values = data.map(d => d.value)
    const res = detector.detect(values)
    setResults(res)

    // Compute precision/recall
    const detected = res.filter(r => r.isAnomaly).length
    const injected = data.filter(d => d.injected).length
    let truePositives = 0
    res.forEach((r, i) => {
      if (r.isAnomaly && data[i].injected) truePositives++
    })
    const precision = detected > 0 ? truePositives / detected : 0
    const recall = injected > 0 ? truePositives / injected : 0

    setStats({ total: data.length, detected, injected, precision, recall })
    return res
  }, [zThreshold, sensitivity])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    if (timeSeries.length === 0) {
      ctx.fillStyle = '#94a3b8'
      ctx.font = '14px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Click "Generate Data" to create a time series with anomalies', CANVAS_W / 2, CANVAS_H / 2)
      return
    }

    const values = timeSeries.map(d => d.value)
    const minVal = Math.min(...values) - 5
    const maxVal = Math.max(...values) + 5
    const plotW = CANVAS_W - PADDING.left - PADDING.right
    const plotH = CANVAS_H - PADDING.top - PADDING.bottom

    const toX = (i) => PADDING.left + (i / (timeSeries.length - 1)) * plotW
    const toY = (v) => PADDING.top + plotH - ((v - minVal) / (maxVal - minVal)) * plotH

    // Grid lines
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= 5; i++) {
      const y = PADDING.top + (i / 5) * plotH
      ctx.beginPath(); ctx.moveTo(PADDING.left, y); ctx.lineTo(CANVAS_W - PADDING.right, y); ctx.stroke()
      const val = maxVal - (i / 5) * (maxVal - minVal)
      ctx.fillStyle = '#64748b'; ctx.font = '9px Inter'; ctx.textAlign = 'right'
      ctx.fillText(val.toFixed(0), PADDING.left - 6, y + 3)
    }

    // Moving average line
    if (results.length > 0) {
      ctx.beginPath()
      ctx.strokeStyle = '#6366f180'
      ctx.lineWidth = 2
      results.forEach((r, i) => {
        const x = toX(i), y = toY(r.movingAvg)
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      })
      ctx.stroke()
    }

    // Time series line
    ctx.beginPath()
    ctx.strokeStyle = '#38bdf8'
    ctx.lineWidth = 1.5
    timeSeries.forEach((d, i) => {
      const x = toX(i), y = toY(d.value)
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // Highlight anomalies (detected)
    results.forEach((r, i) => {
      if (!r.isAnomaly) return
      const x = toX(i), y = toY(r.value)

      // Glow
      ctx.beginPath()
      ctx.arc(x, y, 12, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(244, 63, 94, 0.15)'
      ctx.fill()

      // Dot
      ctx.beginPath()
      ctx.arc(x, y, 5, 0, Math.PI * 2)
      ctx.fillStyle = '#f43f5e'
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1.5
      ctx.stroke()
    })

    // Highlight injected but NOT detected (false negatives) — orange
    timeSeries.forEach((d, i) => {
      if (!d.injected) return
      const detected = results[i]?.isAnomaly
      if (detected) return
      const x = toX(i), y = toY(d.value)
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fillStyle = '#f59e0b'
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1
      ctx.stroke()
    })

    // Legend
    ctx.font = '10px Inter'
    ctx.textAlign = 'left'
    const legendY = CANVAS_H - 8
    ctx.fillStyle = '#38bdf8'; ctx.fillRect(PADDING.left, legendY - 6, 12, 3); ctx.fillText('Signal', PADDING.left + 16, legendY)
    ctx.fillStyle = '#6366f180'; ctx.fillRect(PADDING.left + 70, legendY - 6, 12, 3); ctx.fillText('Moving Avg', PADDING.left + 86, legendY)
    ctx.fillStyle = '#f43f5e'; ctx.beginPath(); ctx.arc(PADDING.left + 160, legendY - 4, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillText('Detected', PADDING.left + 168, legendY)
    ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(PADDING.left + 230, legendY - 4, 3, 0, Math.PI * 2); ctx.fill(); ctx.fillText('Missed', PADDING.left + 237, legendY)
  }, [timeSeries, results])

  useEffect(() => { draw() }, [draw])

  const handleGenerate = () => {
    const data = generate()
    detect(data)
  }

  const handleRedetect = () => {
    if (timeSeries.length > 0) detect(timeSeries)
  }

  useEffect(() => {
    if (timeSeries.length > 0) detect(timeSeries)
  }, [zThreshold, sensitivity, detect, timeSeries])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Anomaly Detection</h1>
        <p className="text-slate-400">
          Ensemble anomaly detection combining <code className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded text-sm">Z-Score</code>,
          <code className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded text-sm ml-1">Moving Average</code>, and
          <code className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded text-sm ml-1">IQR</code> methods.
          Anomalies are injected randomly, then the detector finds them.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div>
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="w-full rounded-xl border border-slate-700"
            style={{ maxWidth: CANVAS_W }}
          />

          {/* Per-point detail bar */}
          {results.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">Anomaly Score Heatmap</p>
              <div className="flex rounded-lg overflow-hidden border border-slate-700" style={{ maxWidth: CANVAS_W }}>
                {results.map((r, i) => (
                  <div
                    key={i}
                    className="flex-1 h-6"
                    style={{
                      background: r.isAnomaly
                        ? `rgba(244, 63, 94, ${0.3 + r.score * 0.7})`
                        : `rgba(56, 189, 248, ${0.05 + r.zScore / 10})`,
                      minWidth: '1px'
                    }}
                    title={`Point ${i}: score=${r.score.toFixed(2)}, z=${r.zScore.toFixed(2)}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Generate */}
          <button onClick={handleGenerate}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors">
            <Zap className="w-4 h-4" /> Generate Data & Detect
          </button>

          {/* Parameters */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 space-y-3">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Parameters</p>

            <div>
              <label className="text-[10px] text-slate-500 uppercase">Anomaly Injection Rate</label>
              <div className="flex items-center gap-2">
                <input type="range" min="0" max="0.2" step="0.01" value={anomalyRate}
                  onChange={(e) => setAnomalyRate(Number(e.target.value))}
                  className="flex-1 accent-rose-500" />
                <span className="text-xs text-rose-400 font-mono w-10 text-right">{(anomalyRate * 100).toFixed(0)}%</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 uppercase">Z-Score Threshold</label>
              <div className="flex items-center gap-2">
                <input type="range" min="1" max="4" step="0.1" value={zThreshold}
                  onChange={(e) => setZThreshold(Number(e.target.value))}
                  className="flex-1 accent-indigo-500" />
                <span className="text-xs text-indigo-400 font-mono w-10 text-right">{zThreshold.toFixed(1)}</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 uppercase">Sensitivity (method agreement)</label>
              <div className="flex items-center gap-2">
                <input type="range" min="0.1" max="1" step="0.01" value={sensitivity}
                  onChange={(e) => setSensitivity(Number(e.target.value))}
                  className="flex-1 accent-indigo-500" />
                <span className="text-xs text-indigo-400 font-mono w-10 text-right">{sensitivity.toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-slate-600 mt-0.5">
                {sensitivity <= 0.34 ? 'Any 1 method flags' : sensitivity <= 0.67 ? '2+ methods must agree' : 'All 3 methods must agree'}
              </p>
            </div>
          </div>

          {/* Detection results */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-3">Detection Results</p>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Data Points" value={stats.total} />
              <Stat label="Anomalies Detected" value={stats.detected} color="text-rose-400" />
              <Stat label="Anomalies Injected" value={stats.injected} color="text-amber-400" />
              <Stat label="Precision" value={`${(stats.precision * 100).toFixed(1)}%`} color="text-emerald-400" />
              <Stat label="Recall" value={`${(stats.recall * 100).toFixed(1)}%`} color="text-cyan-400" />
              <Stat label="F1 Score" value={
                stats.precision + stats.recall > 0
                  ? `${((2 * stats.precision * stats.recall) / (stats.precision + stats.recall) * 100).toFixed(1)}%`
                  : '0.0%'
              } color="text-purple-400" />
            </div>
          </div>

          {/* Method breakdown */}
          {results.length > 0 && (
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">Method Breakdown</p>
              <div className="space-y-1.5 text-xs">
                <MethodBar label="Z-Score" count={results.filter(r => r.methods.zScore).length} total={results.length} color="bg-indigo-500" />
                <MethodBar label="Moving Avg" count={results.filter(r => r.methods.movingAvg).length} total={results.length} color="bg-purple-500" />
                <MethodBar label="IQR" count={results.filter(r => r.methods.iqr).length} total={results.length} color="bg-cyan-500" />
              </div>
            </div>
          )}

          {/* Algorithm */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <h3 className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">How It Works</h3>
            <ul className="text-xs text-slate-400 space-y-1.5">
              <li><span className="text-indigo-400 font-medium">Z-Score:</span> Flag |z| &gt; threshold from global mean</li>
              <li><span className="text-purple-400 font-medium">Moving Avg:</span> Flag deviation from local window mean</li>
              <li><span className="text-cyan-400 font-medium">IQR:</span> Flag points outside [Q1 - 1.5*IQR, Q3 + 1.5*IQR]</li>
              <li><span className="text-rose-400 font-medium">Ensemble:</span> Vote — flag if enough methods agree</li>
            </ul>
            <p className="text-xs text-slate-500 mt-2 italic">
              Red = detected, orange = injected but missed. Tune sensitivity and threshold to improve.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, color = 'text-white' }) {
  return (
    <div>
      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-mono font-semibold ${color}`}>{value}</p>
    </div>
  )
}

function MethodBar({ label, count, total, color }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-400 w-20 text-right">{label}</span>
      <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-slate-500 w-8">{count}</span>
    </div>
  )
}
