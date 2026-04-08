# ML From Scratch — Interactive Machine Learning Visualizations

<p align="center">
  <img src="https://img.shields.io/badge/ML-From_Scratch-6366f1?style=for-the-badge" alt="ML From Scratch" />
  <img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-06b6d4?style=for-the-badge&logo=tailwindcss" alt="TailwindCSS 4" />
  <img src="https://img.shields.io/badge/Zero-Dependencies-10b981?style=for-the-badge" alt="Zero ML Dependencies" />
</p>

<p align="center">
  <strong>Every algorithm implemented from scratch in JavaScript. No TensorFlow. No PyTorch. Just math.</strong>
</p>

<p align="center">
  Click, draw, and watch machine learning algorithms learn in real-time with interactive canvas visualizations.
</p>

---

## Demos

### 1. Linear Regression — Gradient Descent
Draw data points on the canvas and watch gradient descent optimize `y = mx + b` in real-time.

- **Algorithm:** Batch gradient descent minimizing Mean Squared Error
- **Visualizations:** Animated regression line, error lines, loss curve, R² metric
- **Interactive:** Click to add points, adjust learning rate, watch convergence

### 2. Neural Network — Binary Classifier
A fully-connected feedforward neural network trained with backpropagation for 2D classification.

- **Algorithm:** Forward pass → Binary Cross-Entropy Loss → Backpropagation → Weight Update
- **Architecture:** Configurable hidden layers with sigmoid activation, Xavier initialization
- **Visualizations:** Real-time decision boundary heatmap, loss/accuracy curves
- **Preset datasets:** Circles, Spiral (non-linear), XOR
- **Interactive:** Click to place class A/B points, adjust learning rate and layer size

### 3. K-Means Clustering — Unsupervised Learning
Step-by-step K-Means with K-Means++ initialization and Voronoi region visualization.

- **Algorithm:** K-Means++ init → Assign to nearest centroid → Recompute means → Repeat
- **Visualizations:** Animated centroids, Voronoi regions, assignment lines, inertia curve
- **Interactive:** Click to add points, adjust K (2-8), step through or auto-run

### 4. Anomaly Detection — Ensemble Statistical Methods
Three statistical methods vote to detect anomalies in synthetic time series data.

- **Methods:** Z-Score, Moving Average deviation, IQR (Interquartile Range)
- **Ensemble:** Configurable voting threshold — 1, 2, or all 3 methods must agree
- **Metrics:** Precision, Recall, F1 Score against injected ground-truth anomalies
- **Visualizations:** Time series plot, moving average overlay, anomaly heatmap, method breakdown

---

## Architecture

```
ml-showcase/
├── src/
│   ├── ml/                          # Pure ML algorithms — zero dependencies
│   │   ├── linearRegression.js      # Gradient descent, MSE, R²
│   │   ├── neuralNetwork.js         # Feedforward NN, backprop, BCE loss
│   │   ├── kmeans.js                # K-Means++, inertia, convergence
│   │   └── anomalyDetection.js      # Z-Score, Moving Avg, IQR ensemble
│   ├── pages/                       # Interactive visualization pages
│   │   ├── LinearRegressionPage.jsx
│   │   ├── NeuralNetworkPage.jsx
│   │   ├── KMeansPage.jsx
│   │   └── AnomalyDetectionPage.jsx
│   ├── App.jsx                      # Navigation and layout
│   ├── main.jsx                     # Entry point
│   └── index.css                    # TailwindCSS v4 theme
├── package.json
├── vite.config.js
└── README.md
```

**Key design principle:** ML logic is completely separated from UI. Each algorithm in `src/ml/` is a standalone, documented, importable module with no React or DOM dependencies. They can be unit tested, used in Node.js, or ported to any framework.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **ML Algorithms** | Pure JavaScript (no libraries) |
| **Visualization** | HTML5 Canvas API |
| **UI Framework** | React 19 |
| **Styling** | TailwindCSS v4 |
| **Icons** | Lucide React |
| **Build** | Vite 7 |
| **Deployment** | GitHub Pages |

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/smalls275/ml-showcase.git
cd ml-showcase

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

---

## What This Demonstrates

- **ML fundamentals from first principles** — gradient descent, backpropagation, clustering, statistical anomaly detection
- **Clean separation of concerns** — algorithm logic decoupled from visualization
- **Interactive data visualization** — real-time Canvas rendering with smooth animations
- **Modern React patterns** — hooks, refs, useCallback for performance, responsive design
- **Production-quality code** — JSDoc comments, configurable hyperparameters, error handling

---

## Author

**Edward Murray IV** — Machine Learning Engineer & Full-Stack Developer

- 15+ years building data-driven systems for the U.S. Intelligence Community
- Self-taught developer with production Python/ML experience at NGA
- Army Ranger veteran (75th Ranger Regiment)

---

## License

MIT
