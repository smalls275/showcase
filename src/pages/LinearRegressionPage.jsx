import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, RotateCcw, Plus } from 'lucide-react'
import { LinearRegression } from '../ml/linearRegression.js'

const CANVAS_W = 600
const CANVAS_H = 400
const PADDING = 40

function toCanvas(x, y) {
  return [PADDING + x * (CANVAS_W - 2 * PADDING), CANVAS_H - PADDING - y * (CANVAS_H - 2 * PADDING)]
}
function fromCanvas(cx, cy) {
  return [(cx - PADDING) / (CANVAS_W - 2 * PADDING), (CANVAS_H - PADDING - cy) / (CANVAS_H - 2 * PADDING)]
}

export default function LinearRegressionPage() {
  const canvasRef = useRef(null)
  const lossCanvasRef = useRef(null)
  const modelRef = useRef(new LinearRegression(0.1))
  const animRef = useRef(null)

  const [points, setPoints] = useState([])
  const [running, setRunning] = useState(false)
  const [stats, setStats] = useState({ m: 0, b: 0, loss: 0, r2: 0, epoch: 0 })
  const [lr, setLr] = useState(0.1)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const model = modelRef.current

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

    // Background
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    // Grid
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= 10; i++) {
      const [gx, gy] = toCanvas(i / 10, 0)
      ctx.beginPath(); ctx.moveTo(gx, PADDING); ctx.lineTo(gx, CANVAS_H - PADDING); ctx.stroke()
      const [, gy2] = toCanvas(0, i / 10)
      ctx.beginPath(); ctx.moveTo(PADDING, gy2); ctx.lineTo(CANVAS_W - PADDING, gy2); ctx.stroke()
    }

    // Axes
    ctx.strokeStyle = '#64748b'
    ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(PADDING, PADDING); ctx.lineTo(PADDING, CANVAS_H - PADDING); ctx.lineTo(CANVAS_W - PADDING, CANVAS_H - PADDING); ctx.stroke()

    // Regression line
    if (points.length > 0) {
      const x0 = 0, x1 = 1
      const y0 = model.predict(x0), y1 = model.predict(x1)
      const [cx0, cy0] = toCanvas(x0, Math.max(0, Math.min(1, y0)))
      const [cx1, cy1] = toCanvas(x1, Math.max(0, Math.min(1, y1)))

      ctx.strokeStyle = '#6366f1'
      ctx.lineWidth = 2.5
      ctx.shadowColor = '#6366f1'
      ctx.shadowBlur = 8
      ctx.beginPath(); ctx.moveTo(cx0, cy0); ctx.lineTo(cx1, cy1); ctx.stroke()
      ctx.shadowBlur = 0

      // Error lines
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.3)'
      ctx.lineWidth = 1
      for (const p of points) {
        const [px, py] = toCanvas(p.x, p.y)
        const predY = model.predict(p.x)
        const [, predPy] = toCanvas(p.x, Math.max(0, Math.min(1, predY)))
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, predPy); ctx.stroke()
      }
    }

    // Data points
    for (const p of points) {
      const [cx, cy] = toCanvas(p.x, p.y)
      ctx.beginPath()
      ctx.arc(cx, cy, 6, 0, Math.PI * 2)
      ctx.fillStyle = '#38bdf8'
      ctx.fill()
      ctx.strokeStyle = '#0ea5e9'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }

    // Instruction text
    if (points.length === 0) {
      ctx.fillStyle = '#94a3b8'
      ctx.font = '14px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Click anywhere to add data points', CANVAS_W / 2, CANVAS_H / 2)
    }
  }, [points])

  const drawLoss = useCallback(() => {
    const canvas = lossCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const history = modelRef.current.history
    const W = canvas.width, H = canvas.height

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, 0, W, H)

    if (history.length < 2) return

    const maxLoss = Math.max(...history.map(h => h.loss), 0.001)
    const maxEpoch = history[history.length - 1].epoch

    // Loss curve
    ctx.beginPath()
    ctx.strokeStyle = '#f43f5e'
    ctx.lineWidth = 2
    history.forEach((h, i) => {
      const x = (h.epoch / maxEpoch) * (W - 20) + 10
      const y = H - 10 - (h.loss / maxLoss) * (H - 20)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // Label
    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px Inter, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`Loss: ${history[history.length - 1]?.loss.toFixed(6) || ''}`, 10, 14)
  }, [])

  useEffect(() => { draw(); drawLoss() }, [draw, drawLoss, stats])

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = CANVAS_W / rect.width
    const scaleY = CANVAS_H / rect.height
    const cx = (e.clientX - rect.left) * scaleX
    const cy = (e.clientY - rect.top) * scaleY
    const [x, y] = fromCanvas(cx, cy)
    if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
      setPoints(prev => [...prev, { x, y }])
    }
  }

  const trainStep = useCallback(() => {
    if (points.length < 2) return
    const model = modelRef.current
    model.train(points, 5) // 5 steps per frame for speed
    const loss = model.computeLoss(points)
    const r2 = model.rSquared(points)
    setStats({ m: model.m, b: model.b, loss, r2, epoch: model.epoch })
  }, [points])

  useEffect(() => {
    if (running && points.length >= 2) {
      const tick = () => {
        trainStep()
        animRef.current = requestAnimationFrame(tick)
      }
      animRef.current = requestAnimationFrame(tick)
    }
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [running, trainStep, points])

  const handleReset = () => {
    setRunning(false)
    modelRef.current = new LinearRegression(lr)
    setStats({ m: 0, b: 0, loss: 0, r2: 0, epoch: 0 })
  }

  const handleClear = () => {
    setRunning(false)
    setPoints([])
    modelRef.current = new LinearRegression(lr)
    setStats({ m: 0, b: 0, loss: 0, r2: 0, epoch: 0 })
  }

  const addSampleData = () => {
    const sample = Array.from({ length: 30 }, () => {
      const x = Math.random()
      const y = 0.6 * x + 0.15 + (Math.random() - 0.5) * 0.25
      return { x, y: Math.max(0, Math.min(1, y)) }
    })
    setPoints(sample)
  }

  useEffect(() => { modelRef.current.learningRate = lr }, [lr])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Linear Regression</h1>
        <p className="text-slate-400">
          Gradient descent optimizing <code className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded text-sm">y = mx + b</code> to
          minimize Mean Squared Error. Click the canvas to add data points, then hit Train.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Main canvas */}
        <div>
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            onClick={handleCanvasClick}
            className="w-full rounded-xl border border-slate-700 cursor-crosshair"
            style={{ maxWidth: CANVAS_W }}
          />

          {/* Loss chart */}
          <div className="mt-4">
            <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">Loss Curve (MSE)</p>
            <canvas
              ref={lossCanvasRef}
              width={CANVAS_W}
              height={100}
              className="w-full rounded-lg border border-slate-700"
              style={{ maxWidth: CANVAS_W }}
            />
          </div>
        </div>

        {/* Controls panel */}
        <div className="space-y-4">
          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setRunning(!running)}
              disabled={points.length < 2}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
            >
              {running ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Train</>}
            </button>
            <button onClick={handleReset} className="px-3 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2">
            <button onClick={addSampleData} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-colors">
              <Plus className="w-4 h-4" /> Sample Data
            </button>
            <button onClick={handleClear} className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-colors">
              Clear
            </button>
          </div>

          {/* Learning Rate */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <label className="text-xs text-slate-400 font-medium uppercase tracking-wider">Learning Rate</label>
            <div className="flex items-center gap-3 mt-2">
              <input
                type="range" min="0.001" max="1" step="0.001"
                value={lr} onChange={(e) => setLr(Number(e.target.value))}
                className="flex-1 accent-indigo-500"
              />
              <span className="text-sm text-indigo-400 font-mono w-14 text-right">{lr.toFixed(3)}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 space-y-3">
            <h3 className="text-xs text-slate-400 font-medium uppercase tracking-wider">Model Parameters</h3>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Slope (m)" value={stats.m.toFixed(4)} />
              <Stat label="Intercept (b)" value={stats.b.toFixed(4)} />
              <Stat label="MSE Loss" value={stats.loss.toFixed(6)} color="text-rose-400" />
              <Stat label="R-squared" value={stats.r2.toFixed(4)} color="text-emerald-400" />
              <Stat label="Epoch" value={stats.epoch} />
              <Stat label="Points" value={points.length} />
            </div>
          </div>

          {/* Equation */}
          {points.length > 0 && (
            <div className="bg-indigo-500/10 rounded-xl p-4 border border-indigo-500/20 text-center">
              <p className="text-xs text-indigo-300 mb-1">Current Model</p>
              <p className="text-lg font-mono text-white">
                y = {stats.m.toFixed(3)}x {stats.b >= 0 ? '+' : ''} {stats.b.toFixed(3)}
              </p>
            </div>
          )}

          {/* Algorithm explanation */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <h3 className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">How It Works</h3>
            <ul className="text-xs text-slate-400 space-y-1.5">
              <li><span className="text-indigo-400 font-medium">1.</span> Compute prediction error for each point</li>
              <li><span className="text-indigo-400 font-medium">2.</span> Calculate gradients dL/dm and dL/db</li>
              <li><span className="text-indigo-400 font-medium">3.</span> Update: m -= lr * gradient</li>
              <li><span className="text-indigo-400 font-medium">4.</span> Repeat until loss converges</li>
            </ul>
            <p className="text-xs text-slate-500 mt-2 italic">
              Red lines show prediction errors. Blue line is the current fit.
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
