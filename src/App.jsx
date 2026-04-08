import { useState } from 'react'
import { Brain, TrendingUp, Network, Boxes, AlertTriangle, Github, Linkedin, ChevronRight, Sparkles } from 'lucide-react'
import LinearRegressionPage from './pages/LinearRegressionPage.jsx'
import NeuralNetworkPage from './pages/NeuralNetworkPage.jsx'
import KMeansPage from './pages/KMeansPage.jsx'
import AnomalyDetectionPage from './pages/AnomalyDetectionPage.jsx'

const DEMOS = [
  { id: 'home', label: 'Home', icon: Brain },
  { id: 'regression', label: 'Linear Regression', icon: TrendingUp },
  { id: 'neural', label: 'Neural Network', icon: Network },
  { id: 'kmeans', label: 'K-Means Clustering', icon: Boxes },
  { id: 'anomaly', label: 'Anomaly Detection', icon: AlertTriangle },
]

function Hero({ onNavigate }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            Every algorithm implemented from scratch in JavaScript
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              ML From Scratch
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Interactive machine learning visualizations. No TensorFlow. No PyTorch.
            Just <span className="text-white font-semibold">math and JavaScript</span>.
            Click, draw, and watch algorithms learn in real-time.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {DEMOS.slice(1).map(demo => (
              <button
                key={demo.id}
                onClick={() => onNavigate(demo.id)}
                className="group relative flex flex-col items-center gap-3 p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-indigo-500/50 hover:bg-slate-800 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                  <demo.icon className="w-6 h-6 text-indigo-400" />
                </div>
                <span className="font-medium text-slate-200">{demo.label}</span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* What's Inside */}
      <div className="border-t border-slate-800 bg-slate-900/50">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-center mb-12 text-slate-200">What Makes This Different</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">&#x1D453;</span>
              </div>
              <h3 className="font-semibold text-white mb-2">Pure Mathematics</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Gradient descent, backpropagation, distance metrics — all implemented line by line. No black boxes.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">&#x25CE;</span>
              </div>
              <h3 className="font-semibold text-white mb-2">Interactive Canvas</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Draw data points. Adjust hyperparameters. Watch models train in real-time with step-by-step animation.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">&#x2261;</span>
              </div>
              <h3 className="font-semibold text-white mb-2">Clean Architecture</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Separation of ML logic from UI. Each algorithm is a standalone, documented, testable module.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-8 text-center text-sm text-slate-500">
        <p>
          Built by <span className="text-slate-300 font-medium">Edward Murray IV</span> — Machine Learning Engineer & Full-Stack Developer
        </p>
        <div className="flex items-center justify-center gap-4 mt-3">
          <a href="https://github.com/smalls275" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors inline-flex items-center gap-1.5">
            <Github className="w-4 h-4" /> GitHub
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors inline-flex items-center gap-1.5">
            <Linkedin className="w-4 h-4" /> LinkedIn
          </a>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState('home')

  const renderPage = () => {
    switch (page) {
      case 'regression': return <LinearRegressionPage />
      case 'neural': return <NeuralNetworkPage />
      case 'kmeans': return <KMeansPage />
      case 'anomaly': return <AnomalyDetectionPage />
      default: return <Hero onNavigate={setPage} />
    }
  }

  return (
    <div className="min-h-screen">
      {/* Nav bar */}
      <nav className="sticky top-0 z-50 bg-[#0f172a]/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-1">
          <button
            onClick={() => setPage('home')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors mr-4"
          >
            <Brain className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-sm tracking-wide text-slate-200">ML From Scratch</span>
          </button>

          <div className="hidden md:flex items-center gap-1">
            {DEMOS.slice(1).map(demo => (
              <button
                key={demo.id}
                onClick={() => setPage(demo.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  page === demo.id
                    ? 'bg-indigo-500/15 text-indigo-400 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <demo.icon className="w-4 h-4" />
                {demo.label}
              </button>
            ))}
          </div>

          {/* Mobile dropdown */}
          <div className="md:hidden ml-auto">
            <select
              value={page}
              onChange={(e) => setPage(e.target.value)}
              className="bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-1.5 border border-slate-700"
            >
              {DEMOS.map(d => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>
      </nav>

      {/* Page content */}
      {renderPage()}
    </div>
  )
}
