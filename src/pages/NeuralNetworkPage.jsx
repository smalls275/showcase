import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, RotateCcw, Plus } from 'lucide-react'
import { NeuralNetwork } from '../ml/neuralNetwork.js'

const CANVAS_W = 500
const CANVAS_H = 500
const RESOLUTION = 60

export default function NeuralNetworkPage() {
  const canvasRef = useRef(null)
  const lossCanvasRef = useRef(null)
  const modelRef = useRef(new NeuralNetwork([2, 8, 8, 1], 0.5))
  const animRef = useRef(null)

  const [data, setData] = useState([])
  const [running, setRunning] = useState(false)
  const [stats, setStats] = useState({ loss: 0, accuracy: 0, epoch: 0 })
  const [brushLabel, setBrushLabel] = useState(1)
  const [hiddenSize, setHiddenSize] = useState(8)
  const [learnRate, setLearnRate] = useState(0.5)
  const [dataset, setDataset] = useState('custom')

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const model = modelRef.current

    // Draw decision boundary
    if (data.length > 0 && stats.epoch > 0) {
      const grid = model.decisionBoundary(RESOLUTION, [0, 1], [0, 1])
      const cellW = CANVAS_W / RESOLUTION
      const cellH = CANVAS_H / RESOLUTION

      for (let i = 0; i < RESOLUTION; i++) {
        for (let j = 0; j < RESOLUTION; j++) {
          const prob = grid[i][j]
          const r = Math.round(99 + prob * 56)
          const g = Math.round(102 + (1 - prob) * 80)
          const b = Math.round(241 - prob * 100)
          const a = 0.35
          ctx.fillStyle = `rgba(${prob > 0.5 ? '99,102,241' : '244,63,94'}, ${a})`
          ctx.fillRect(j * cellW, i * cellH, cellW + 1, cellH + 1)
        }
      }

      // Decision boundary contour line (prob = 0.5)
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = 1.5
      for (let i = 0; i < RESOLUTION - 1; i++) {
        for (let j = 0; j < RESOLUTION - 1; j++) {
          if ((grid[i][j] >= 0.5) !== (grid[i][j + 1] >= 0.5) ||
              (grid[i][j] >= 0.5) !== (grid[i + 1][j] >= 0.5)) {
            ctx.beginPath()
            ctx.arc((j + 0.5) * cellW, (i + 0.5) * cellH, 1, 0, Math.PI * 2)
            ctx.stroke()
          }
        }
      }
    } else {
      ctx.fillStyle = '#1e293b'
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

      // Grid
      ctx.strokeStyle = '#334155'
      ctx.lineWidth = 0.5
      for (let i = 0; i <= 10; i++) {
        const x = (i / 10) * CANVAS_W
        const y = (i / 10) * CANVAS_H
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke()
      }
    }

    // Data points
    for (const d of data) {
      const cx = d.input[0] * CANVAS_W
      const cy = (1 - d.input[1]) * CANVAS_H
      ctx.beginPath()
      ctx.arc(cx, cy, 7, 0, Math.PI * 2)
      ctx.fillStyle = d.label === 1 ? '#6366f1' : '#f43f5e'
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // Instructions
    if (data.length === 0) {
      ctx.fillStyle = '#94a3b8'
      ctx.font = '14px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Click to add Class A (blue) or Class B (red) points', CANVAS_W / 2, CANVAS_H / 2 - 10)
      ctx.fillText('Toggle classes with the buttons on the right', CANVAS_W / 2, CANVAS_H / 2 + 14)
    }
  }, [data, stats])

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

    const maxLoss = Math.max(...history.map(h => h.loss), 0.01)
    const maxEpoch = history[history.length - 1].epoch

    // Loss
    ctx.beginPath()
    ctx.strokeStyle = '#f43f5e'
    ctx.lineWidth = 1.5
    history.forEach((h, i) => {
      const x = (h.epoch / maxEpoch) * (W - 20) + 10
      const y = H - 5 - (h.loss / maxLoss) * (H - 15)
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // Accuracy
    ctx.beginPath()
    ctx.strokeStyle = '#10b981'
    ctx.lineWidth = 1.5
    history.forEach((h, i) => {
      const x = (h.epoch / maxEpoch) * (W - 20) + 10
      const y = H - 5 - h.accuracy * (H - 15)
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    })
    ctx.stroke()

    ctx.fillStyle = '#f43f5e'; ctx.font = '9px Inter'; ctx.textAlign = 'left'
    ctx.fillText('Loss', 12, 12)
    ctx.fillStyle = '#10b981'
    ctx.fillText('Accuracy', 42, 12)
  }, [])

  useEffect(() => { draw(); drawLoss() }, [draw, drawLoss, stats])

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = 1 - (e.clientY - rect.top) / rect.height
    if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
      setData(prev => [...prev, { input: [x, y], label: brushLabel }])
    }
  }

  const trainStep = useCallback(() => {
    if (data.length < 2) return
    const model = modelRef.current
    const result = model.trainEpoch(data)
    setStats({ loss: result.loss, accuracy: result.accuracy, epoch: result.epoch })
  }, [data])

  useEffect(() => {
    if (running && data.length >= 2) {
      const tick = () => {
        trainStep()
        animRef.current = requestAnimationFrame(tick)
      }
      animRef.current = requestAnimationFrame(tick)
    }
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [running, trainStep, data])

  const handleReset = () => {
    setRunning(false)
    modelRef.current = new NeuralNetwork([2, hiddenSize, hiddenSize, 1], learnRate)
    setStats({ loss: 0, accuracy: 0, epoch: 0 })
  }

  const handleClear = () => {
    setRunning(false)
    setData([])
    modelRef.current = new NeuralNetwork([2, hiddenSize, hiddenSize, 1], learnRate)
    setStats({ loss: 0, accuracy: 0, epoch: 0 })
  }

  const generateDataset = (type) => {
    setRunning(false)
    setDataset(type)
    let points = []

    if (type === 'circles') {
      for (let i = 0; i < 100; i++) {
        const angle = Math.random() * Math.PI * 2
        const r1 = 0.1 + Math.random() * 0.12
        const r2 = 0.3 + Math.random() * 0.12
        points.push({ input: [0.5 + Math.cos(angle) * r1, 0.5 + Math.sin(angle) * r1], label: 0 })
        points.push({ input: [0.5 + Math.cos(angle) * r2, 0.5 + Math.sin(angle) * r2], label: 1 })
      }
    } else if (type === 'spiral') {
      for (let i = 0; i < 100; i++) {
        const t = (i / 100) * 3 * Math.PI
        const r = t / (3 * Math.PI) * 0.4
        const noise = () => (Math.random() - 0.5) * 0.04
        points.push({ input: [0.5 + r * Math.cos(t) + noise(), 0.5 + r * Math.sin(t) + noise()], label: 0 })
        points.push({ input: [0.5 - r * Math.cos(t) + noise(), 0.5 - r * Math.sin(t) + noise()], label: 1 })
      }
    } else if (type === 'xor') {
      for (let i = 0; i < 50; i++) {
        points.push({ input: [0.15 + Math.random() * 0.3, 0.55 + Math.random() * 0.3], label: 1 })
        points.push({ input: [0.55 + Math.random() * 0.3, 0.55 + Math.random() * 0.3], label: 0 })
        points.push({ input: [0.15 + Math.random() * 0.3, 0.15 + Math.random() * 0.3], label: 0 })
        points.push({ input: [0.55 + Math.random() * 0.3, 0.15 + Math.random() * 0.3], label: 1 })
      }
    }

    setData(points)
    modelRef.current = new NeuralNetwork([2, hiddenSize, hiddenSize, 1], learnRate)
    setStats({ loss: 0, accuracy: 0, epoch: 0 })
  }

  useEffect(() => {
    modelRef.current.learningRate = learnRate
  }, [learnRate])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Neural Network Classifier</h1>
        <p className="text-slate-400">
          A feedforward neural network with <code className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded text-sm">sigmoid activation</code> and
          backpropagation, trained via binary cross-entropy loss. Watch the decision boundary evolve.
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
            <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">
              <span className="text-rose-400">Loss</span> / <span className="text-emerald-400">Accuracy</span>
            </p>
            <canvas
              ref={lossCanvasRef}
              width={CANVAS_W}
              height={80}
              className="w-full rounded-lg border border-slate-700"
              style={{ maxWidth: CANVAS_W }}
            />
          </div>
        </div>

        <div className="space-y-4">
          {/* Train / Pause */}
          <div className="flex gap-2">
            <button
              onClick={() => setRunning(!running)}
              disabled={data.length < 2}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
            >
              {running ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Train</>}
            </button>
            <button onClick={handleReset} className="px-3 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Class selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setBrushLabel(1)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${brushLabel === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'}`}
            >
              Class A (Blue)
            </button>
            <button
              onClick={() => setBrushLabel(0)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${brushLabel === 0 ? 'bg-rose-600 text-white' : 'bg-slate-700 text-slate-400'}`}
            >
              Class B (Red)
            </button>
          </div>

          {/* Preset datasets */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">Preset Datasets</p>
            <div className="grid grid-cols-3 gap-2">
              {['circles', 'spiral', 'xor'].map(ds => (
                <button key={ds} onClick={() => generateDataset(ds)}
                  className={`py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${dataset === ds ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-700 text-slate-400 border border-transparent'}`}
                >{ds}</button>
              ))}
            </div>
            <button onClick={handleClear} className="w-full mt-2 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 text-xs transition-colors">
              Clear All
            </button>
          </div>

          {/* Hyperparameters */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 space-y-3">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Hyperparameters</p>
            <div>
              <label className="text-[10px] text-slate-500 uppercase">Learning Rate</label>
              <div className="flex items-center gap-2">
                <input type="range" min="0.01" max="2" step="0.01" value={learnRate}
                  onChange={(e) => setLearnRate(Number(e.target.value))}
                  className="flex-1 accent-indigo-500" />
                <span className="text-xs text-indigo-400 font-mono w-10 text-right">{learnRate.toFixed(2)}</span>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase">Hidden Layer Size</label>
              <div className="flex items-center gap-2">
                <input type="range" min="2" max="16" step="1" value={hiddenSize}
                  onChange={(e) => setHiddenSize(Number(e.target.value))}
                  className="flex-1 accent-indigo-500" />
                <span className="text-xs text-indigo-400 font-mono w-10 text-right">{hiddenSize}</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 italic">Architecture: [2, {hiddenSize}, {hiddenSize}, 1]</p>
          </div>

          {/* Stats */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-3">Training Metrics</p>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Epoch" value={stats.epoch} />
              <Stat label="Points" value={data.length} />
              <Stat label="Loss (BCE)" value={stats.loss.toFixed(4)} color="text-rose-400" />
              <Stat label="Accuracy" value={`${(stats.accuracy * 100).toFixed(1)}%`} color="text-emerald-400" />
            </div>
          </div>

          {/* Algorithm */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <h3 className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">How It Works</h3>
            <ul className="text-xs text-slate-400 space-y-1.5">
              <li><span className="text-indigo-400 font-medium">1.</span> Forward pass through layers with sigmoid</li>
              <li><span className="text-indigo-400 font-medium">2.</span> Compute binary cross-entropy loss</li>
              <li><span className="text-indigo-400 font-medium">3.</span> Backpropagate error gradients</li>
              <li><span className="text-indigo-400 font-medium">4.</span> Update weights: W -= lr * dL/dW</li>
            </ul>
            <p className="text-xs text-slate-500 mt-2 italic">
              Colors show decision boundary. Try the spiral dataset!
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
