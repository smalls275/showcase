/**
 * K-Means Clustering — Implemented from scratch
 * 
 * Classic unsupervised learning algorithm. Iteratively assigns points
 * to the nearest centroid, then recomputes centroids as cluster means.
 * Uses K-Means++ initialization for better convergence.
 */

export class KMeans {
  /**
   * @param {number} k - Number of clusters
   */
  constructor(k = 3) {
    this.k = k;
    this.centroids = [];
    this.assignments = [];
    this.history = [];
    this.iteration = 0;
    this.converged = false;
  }

  /**
   * Euclidean distance between two points
   */
  static distance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  /**
   * K-Means++ initialization — picks initial centroids spread far apart
   */
  initializeCentroids(points) {
    if (points.length === 0) return;

    const centroids = [];

    // Pick first centroid randomly
    const first = points[Math.floor(Math.random() * points.length)];
    centroids.push({ x: first.x, y: first.y });

    // Pick remaining centroids proportional to squared distance
    for (let i = 1; i < this.k; i++) {
      const distances = points.map(p => {
        const minDist = Math.min(...centroids.map(c => KMeans.distance(p, c)));
        return minDist * minDist;
      });

      const totalDist = distances.reduce((a, b) => a + b, 0);
      let r = Math.random() * totalDist;
      let idx = 0;
      while (r > 0 && idx < distances.length - 1) {
        r -= distances[idx];
        if (r > 0) idx++;
      }

      centroids.push({ x: points[idx].x, y: points[idx].y });
    }

    this.centroids = centroids;
    this.assignments = new Array(points.length).fill(-1);
    this.converged = false;
    this.iteration = 0;
    this.history = [];
  }

  /**
   * Perform one iteration of the K-Means algorithm
   * Returns true if assignments changed (not yet converged)
   */
  step(points) {
    if (points.length === 0 || this.centroids.length === 0) return false;

    // Assignment step: assign each point to nearest centroid
    const newAssignments = points.map(p => {
      let minDist = Infinity;
      let minIdx = 0;
      this.centroids.forEach((c, i) => {
        const d = KMeans.distance(p, c);
        if (d < minDist) {
          minDist = d;
          minIdx = i;
        }
      });
      return minIdx;
    });

    // Check convergence
    const changed = newAssignments.some((a, i) => a !== this.assignments[i]);
    this.assignments = newAssignments;

    // Update step: recompute centroids as mean of assigned points
    const newCentroids = Array.from({ length: this.k }, () => ({ x: 0, y: 0, count: 0 }));

    points.forEach((p, i) => {
      const cluster = this.assignments[i];
      newCentroids[cluster].x += p.x;
      newCentroids[cluster].y += p.y;
      newCentroids[cluster].count++;
    });

    this.centroids = newCentroids.map((c, i) => {
      if (c.count === 0) return this.centroids[i]; // keep old centroid if empty
      return { x: c.x / c.count, y: c.y / c.count };
    });

    this.iteration++;
    this.converged = !changed;

    // Compute inertia (sum of squared distances to centroids)
    const inertia = points.reduce((sum, p, i) => {
      return sum + KMeans.distance(p, this.centroids[this.assignments[i]]) ** 2;
    }, 0);

    this.history.push({ iteration: this.iteration, inertia, converged: this.converged });

    return changed;
  }

  /**
   * Run to convergence (with max iterations safety)
   */
  fit(points, maxIter = 100) {
    this.initializeCentroids(points);
    for (let i = 0; i < maxIter; i++) {
      if (!this.step(points)) break;
    }
    return this.assignments;
  }

  reset(k) {
    if (k !== undefined) this.k = k;
    this.centroids = [];
    this.assignments = [];
    this.history = [];
    this.iteration = 0;
    this.converged = false;
  }
}

/**
 * Cluster color palette
 */
export const CLUSTER_COLORS = [
  '#6366f1', // indigo
  '#f43f5e', // rose
  '#10b981', // emerald
  '#f59e0b', // amber
  '#06b6d4', // cyan
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
];
