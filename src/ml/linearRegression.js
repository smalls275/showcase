/**
 * Linear Regression — Implemented from scratch using Gradient Descent
 * 
 * No libraries. Pure math. The way you learn it.
 * 
 * The model learns y = mx + b by minimizing Mean Squared Error (MSE)
 * using batch gradient descent with configurable learning rate.
 */

export class LinearRegression {
  constructor(learningRate = 0.001) {
    this.m = Math.random() * 0.5 - 0.25; // slope (weight)
    this.b = Math.random() * 0.5 - 0.25; // intercept (bias)
    this.learningRate = learningRate;
    this.history = []; // loss history for visualization
    this.epoch = 0;
  }

  /**
   * Predict y for a given x using current parameters
   */
  predict(x) {
    return this.m * x + this.b;
  }

  /**
   * Compute Mean Squared Error over the dataset
   */
  computeLoss(points) {
    if (points.length === 0) return 0;
    const sumSquaredError = points.reduce((sum, p) => {
      const error = this.predict(p.x) - p.y;
      return sum + error * error;
    }, 0);
    return sumSquaredError / points.length;
  }

  /**
   * Perform one step of batch gradient descent
   * 
   * Gradients:
   *   dL/dm = (2/n) * sum( (mx + b - y) * x )
   *   dL/db = (2/n) * sum( mx + b - y )
   */
  step(points) {
    if (points.length === 0) return;

    const n = points.length;
    let gradM = 0;
    let gradB = 0;

    for (const p of points) {
      const error = this.predict(p.x) - p.y;
      gradM += error * p.x;
      gradB += error;
    }

    gradM = (2 / n) * gradM;
    gradB = (2 / n) * gradB;

    // Update parameters
    this.m -= this.learningRate * gradM;
    this.b -= this.learningRate * gradB;

    // Record loss
    const loss = this.computeLoss(points);
    this.epoch++;
    this.history.push({ epoch: this.epoch, loss });

    return { m: this.m, b: this.b, loss, epoch: this.epoch };
  }

  /**
   * Train for N epochs, returning intermediate states for animation
   */
  train(points, epochs = 1) {
    const states = [];
    for (let i = 0; i < epochs; i++) {
      states.push(this.step(points));
    }
    return states;
  }

  /**
   * Compute R-squared (coefficient of determination)
   */
  rSquared(points) {
    if (points.length < 2) return 0;
    const meanY = points.reduce((s, p) => s + p.y, 0) / points.length;
    const ssRes = points.reduce((s, p) => s + (p.y - this.predict(p.x)) ** 2, 0);
    const ssTot = points.reduce((s, p) => s + (p.y - meanY) ** 2, 0);
    if (ssTot === 0) return 1;
    return 1 - ssRes / ssTot;
  }

  reset() {
    this.m = Math.random() * 0.5 - 0.25;
    this.b = Math.random() * 0.5 - 0.25;
    this.history = [];
    this.epoch = 0;
  }
}
