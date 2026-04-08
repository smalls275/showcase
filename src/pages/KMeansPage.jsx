import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, SkipForward, RotateCcw, Plus } from 'lucide-react'
import { KMeans, CLUSTER_COLORS } from '../ml/kmeans.js'

const CANVAS_W = 500
const CANVAS_H = 500

export default function KMeansPage() {
  const canvasRef = useRef(null)
  const inertiaCanvasRef = useRef(null)
  const modelRef = useRef(new KMeans(3))
  const animRef = useRef(null)

  const [points, setPoints] = useState([])
  const [k, setK] = useState(3)
  const [running, setRunning] = useState(false)
  const [stats, setStats] = useState({ iteration: 0, inertia: 0, converged: false })

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const model = modelRef.current

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    // Grid
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= 10; i++) {
      const v = (i / 10) * CANVAS_W
      ctx.beginPath(); ctx.moveTo(v, 0); ctx.lineTo(v, CANVAS_H); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, v); ctx.lineTo(CANVAS_W, v); ctx.stroke()
    }

    // Voronoi regions (simple approach: color background by nearest centroid)
    if (model.centroids.length > 0 && model.iteration > 0) {
      const imageData = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H)
      const data = imageData.data
      for (let py = 0; py < CANVAS_H; py += 4) {
        for (let px = 0; px < CANVAS_W; px += 4) {
          const x = px / CANVAS_W
          const y = 1 - py / CANVAS_H
          let minDist = Infinity, minIdx = 0
          model.centroids.forEach((c, i) => {
            const d = (x - c.x) ** 2 + (y - c.y) ** 2
            if (d < minDist) { minDist = d; minIdx = i }
          })
          const color = hexToRgb(CLUSTER_COLORS[minIdx % CLUSTER_COLORS.length])
          for (let dy = 0; dy < 4 && py + dy < CANVAS_H; dy++) {
            for (let dx = 0; dx < 4 && px + dx < CANVAS_W; dx++) {
              const idx = ((py + dy) * CANVAS_W + (px + dx)) * 4
              data[idx] = color.r; data[idx + 1] = color.g; data[idx + 2] = color.b; data[idx + 3] = 30
            }
          }
        }
      }
      ctx.putImageData(imageData, 0, 0)
    }

    // Lines from points to centroids
    if (model.centroids.length > 0 && model.assignments.length > 0) {
      ctx.lineWidth = 0.5
      points.forEach((p, i) => {
        const cluster = model.assignments[i]
        if (cluster === undefined || cluster < 0) return
        const c = model.centroids[cluster]
        if (!c) return
        ctx.strokeStyle = CLUSTER_COLORS[cluster % CLUSTER_COLORS.length] + '40'
        ctx.beginPath()
        ctx.moveTo(p.x * CANVAS_W, (1 - p.y) * CANVAS_H)
        ctx.lineTo(c.x * CANVAS_W, (1 - c.y) * CANVAS_H)
        ctx.stroke()
      })
    }

    // Data points
    points.forEach((p, i) => {
      const cx = p.x * CANVAS_W
      const cy = (1 - p.y) * CANVAS_H
      const cluster = model.assignments[i]
      const color = cluster !== undefined && cluster >= 0 ? CLUSTER_COLORS[cluster % CLUSTER_COLORS.length] : '#94a3b8'

      ctx.beginPath()
      ctx.arc(cx, cy, 5, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1
      ctx.stroke()
    })

    // Centroids
    model.centroids.forEach((c, i) => {
      const cx = c.x * CANVAS_W
      const cy = (1 - c.y) * CANVAS_H
      const color = CLUSTER_COLORS[i % CLUSTER_COLORS.length]

      // Outer glow
      ctx.beginPath()
      ctx.arc(cx, cy, 16, 0, Math.PI * 2)
      ctx.fillStyle = color + '30'
      ctx.fill()

      // Diamond shape
      ctx.beginPath()
      ctx.moveTo(cx, cy - 10)
      ctx.lineTo(cx + 8, cy)
      ctx.lineTo(cx, cy + 10)
      ctx.lineTo(cx - 8, cy)
      ctx.closePath()
      ctx.fillStyle = color
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()
    })

    // Instructions
    if (points.length === 0) {
      ctx.fillStyle = '#94a3b8'
      ctx.font = '14px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Click to add data points, then run K-Means', CANVAS_W / 2, CANVAS_H / 2)
    }
  }, [points, stats])

  const drawInertia = useCallback(() => {
    const canvas = inertiaCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const history = modelRef.current.history
    const W = canvas.width, H = canvas.height

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, 0, W, H)

    if (history.length < 2) return

    const maxInertia = Math.max(...history.map(h => h.inertia), 0.01)
    const maxIter = history[history.length - 1].iteration

    ctx.beginPath()
    ctx.strokeStyle = '#f59e0b'
    ctx.lineWidth = 2
    history.forEach((h, i) => {
      const x = (h.iteration / maxIter) * (W - 20) + 10
      const y = H - 5 - (h.inertia / maxInertia) * (H - 15)
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    })
    ctx.stroke()

    ctx.fillStyle = '#f59e0b'; ctx.font = '9px Inter'; ctx.textAlign = 'left'
    ctx.fillText(`Inertia: ${history[history.length - 1]?.inertia.toFixed(4)}`, 12, 12)
  }, [])

  useEffect(() => { draw(); drawInertia() }, [draw, drawInertia, stats])

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = 1 - (e.clientY - rect.top) / rect.height
    if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
      setPoints(prev => [...prev, { x, y }])
    }
  }

  const stepOnce = useCallback(() => {
    if (points.length < k) return
    const model = modelRef.current
    if (model.centroids.length === 0) {
      model.reset(k)
      model.initializeCentroids(points)
    }
    model.step(points)
    const last = model.history[model.history.length - 1]
    setStats({ iteration: model.iteration, inertia: last?.inertia || 0, converged: model.converged })
  }, [points, k])

  useEffect(() => {
    if (running && points.length >= k && !modelRef.current.converged) {
      const tick = () => {
        stepOnce()
        if (modelRef.current.converged) { setRunning(false); return }
        animRef.current = setTimeout(() => { animRef.current = requestAnimationFrame(tick) }, 400)
      }
      animRef.current = requestAnimationFrame(tick)
    }
    return () => {
      if (animRef.current) { cancelAnimationFrame(animRef.current); clearTimeout(animRef.current) }
    }
  }, [running, stepOnce, points, k])

  const handleStart = () => {
    if (modelRef.current.converged) {
      modelRef.current.reset(k)
      modelRef.current.initializeCentroids(points)
      setStats({ iteration: 0, inertia: 0, converged: false })
    }
    setRunning(true)
  }

  const handleReset = () => {
    setRunning(false)
    modelRef.current.reset(k)
    setStats({ iteration: 0, inertia: 0, converged: false })
  }

  const handleClear = () => {
    setRunning(false)
    setPoints([])
    modelRef.current.reset(k)
    setStats({ iteration: 0, inertia: 0, converged: false })
  }

  const generateBlobs = () => {
    setRunning(false)
    const pts = []
    const centers = Array.from({ length: k }, () => ({
      x: 0.15 + Math.random() * 0.7,
      y: 0.15 + Math.random() * 0.7
    }))
    for (const center of centers) {
      for (let i = 0; i < 30; i++) {
        pts.push({
          x: Math.max(0, Math.min(1, center.x + (Math.random() - 0.5) * 0.2)),
          y: Math.max(0, Math.min(1, center.y + (Math.random() - 0.5) * 0.2))
        })
      }
    }
    setPoints(pts)
    modelRef.current.reset(k)
    setStats({ iteration: 0, inertia: 0, converged: false })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">K-Means Clustering</h1>
        <p className="text-slate-400">
          Unsupervised learning with <code className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded text-sm">K-Means++</code> initialization.
          Points are assigned to the nearest centroid, then centroids recompute as cluster means. Watch it converge step-by-step.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div>
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            onClick={handleCanvasClick}
            className="w-full rounded-xl border border-slate-700 cursor-crosshair"
            style={{ maxWidth: CANVAS_W, aspectRatio: '1' }}
          />
          <div className="mt-4">
            <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">Inertia (Within-Cluster Sum of Squares)</p>
            <canvas ref={inertiaCanvasRef} width={CANVAS_W} height={80}
              className="w-full rounded-lg border border-slate-700" style={{ maxWidth: CANVAS_W }} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <button onClick={handleStart} disabled={points.length < k}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors">
              {running ? <><Pause className="w-4 h-4" /> Running...</> : <><Play className="w-4 h-4" /> Run</>}
            </button>
            <button onClick={stepOnce} disabled={points.length < k || running}
              className="px-3 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-300 transition-colors" title="Single step">
              <SkipForward className="w-4 h-4" />
            </button>
            <button onClick={handleReset} className="px-3 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2">
            <button onClick={generateBlobs}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-colors">
              <Plus className="w-4 h-4" /> Generate Blobs
            </button>
            <button onClick={handleClear}
              className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-colors">
              Clear
            </button>
          </div>

          {/* K slider */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <label className="text-xs text-slate-400 font-medium uppercase tracking-wider">Number of Clusters (K)</label>
            <div className="flex items-center gap-3 mt-2">
              <input type="range" min="2" max="8" step="1" value={k}
                onChange={(e) => { setK(Number(e.target.value)); handleReset() }}
                className="flex-1 accent-indigo-500" />
              <span className="text-sm text-indigo-400 font-mono w-6 text-right">{k}</span>
            </div>
            <div className="flex gap-1 mt-2">
              {Array.from({ length: k }, (_, i) => (
                <div key={i} className="w-4 h-4 rounded-full" style={{ background: CLUSTER_COLORS[i] }} />
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-3">Metrics</p>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Iteration" value={stats.iteration} />
              <Stat label="Points" value={points.length} />
              <Stat label="Inertia" value={stats.inertia.toFixed(4)} color="text-amber-400" />
              <Stat label="Status" value={stats.converged ? 'Converged' : stats.iteration > 0 ? 'Training...' : 'Ready'}
                color={stats.converged ? 'text-emerald-400' : 'text-slate-400'} />
            </div>
          </div>

          {stats.converged && (
            <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20 text-center">
              <p className="text-emerald-400 font-medium text-sm">Converged in {stats.iteration} iterations!</p>
              <p className="text-emerald-300/60 text-xs mt-1">Assignments are stable. Click Run to reinitialize.</p>
            </div>
          )}

          {/* Algorithm */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <h3 className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">How It Works</h3>
            <ul className="text-xs text-slate-400 space-y-1.5">
              <li><span className="text-indigo-400 font-medium">1.</span> Initialize K centroids (K-Means++)</li>
              <li><span className="text-indigo-400 font-medium">2.</span> Assign each point to nearest centroid</li>
              <li><span className="text-indigo-400 font-medium">3.</span> Recompute centroids as cluster means</li>
              <li><span className="text-indigo-400 font-medium">4.</span> Repeat until assignments stabilize</li>
            </ul>
            <p className="text-xs text-slate-500 mt-2 italic">
              Diamonds are centroids. Lines show point assignments.
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

function Pause({ className }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 0, g: 0, b: 0 }
}
