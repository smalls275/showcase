/**
 * Neural Network — Implemented from scratch with backpropagation
 * 
 * A fully-connected feedforward neural network for 2D binary classification.
 * Supports configurable hidden layers, sigmoid activation, and
 * binary cross-entropy loss.
 * 
 * No TensorFlow. No PyTorch. Just math and JavaScript.
 */

export class NeuralNetwork {
  /**
   * @param {number[]} layerSizes - e.g. [2, 8, 8, 1] for 2 inputs, two hidden layers of 8, 1 output
   * @param {number} learningRate
   */
  constructor(layerSizes = [2, 8, 8, 1], learningRate = 0.5) {
    this.layerSizes = layerSizes;
    this.learningRate = learningRate;
    this.weights = [];
    this.biases = [];
    this.history = [];
    this.epoch = 0;

    // Xavier initialization
    for (let i = 0; i < layerSizes.length - 1; i++) {
      const fanIn = layerSizes[i];
      const fanOut = layerSizes[i + 1];
      const scale = Math.sqrt(2 / (fanIn + fanOut));

      this.weights.push(
        Array.from({ length: fanOut }, () =>
          Array.from({ length: fanIn }, () => (Math.random() * 2 - 1) * scale)
        )
      );
      this.biases.push(Array.from({ length: fanOut }, () => 0));
    }
  }

  // Activation functions
  static sigmoid(x) {
    return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
  }

  static sigmoidDerivative(output) {
    return output * (1 - output);
  }

  /**
   * Forward pass — compute activations for all layers
   */
  forward(input) {
    const activations = [input];
    let current = input;

    for (let l = 0; l < this.weights.length; l++) {
      const next = [];
      for (let j = 0; j < this.weights[l].length; j++) {
        let sum = this.biases[l][j];
        for (let k = 0; k < current.length; k++) {
          sum += this.weights[l][j][k] * current[k];
        }
        next.push(NeuralNetwork.sigmoid(sum));
      }
      current = next;
      activations.push(current);
    }

    return activations;
  }

  /**
   * Predict class probability for a single input [x, y]
   */
  predict(input) {
    const activations = this.forward(input);
    return activations[activations.length - 1][0];
  }

  /**
   * Backpropagation — compute gradients and update weights
   */
  backward(activations, target) {
    const numLayers = this.weights.length;
    const deltas = new Array(numLayers);

    // Output layer delta (binary cross-entropy derivative with sigmoid)
    const output = activations[numLayers][0];
    deltas[numLayers - 1] = [output - target];

    // Hidden layer deltas
    for (let l = numLayers - 2; l >= 0; l--) {
      deltas[l] = [];
      for (let j = 0; j < this.weights[l].length; j++) {
        let error = 0;
        for (let k = 0; k < this.weights[l + 1].length; k++) {
          error += deltas[l + 1][k] * this.weights[l + 1][k][j];
        }
        deltas[l].push(error * NeuralNetwork.sigmoidDerivative(activations[l + 1][j]));
      }
    }

    // Update weights and biases
    for (let l = 0; l < numLayers; l++) {
      for (let j = 0; j < this.weights[l].length; j++) {
        for (let k = 0; k < this.weights[l][j].length; k++) {
          this.weights[l][j][k] -= this.learningRate * deltas[l][j] * activations[l][k];
        }
        this.biases[l][j] -= this.learningRate * deltas[l][j];
      }
    }
  }

  /**
   * Train on a batch of labeled data for one epoch
   * @param {Array<{input: number[], label: number}>} data
   */
  trainEpoch(data) {
    let totalLoss = 0;
    let correct = 0;

    // Shuffle data
    const shuffled = [...data].sort(() => Math.random() - 0.5);

    for (const sample of shuffled) {
      const activations = this.forward(sample.input);
      const output = activations[activations.length - 1][0];

      // Binary cross-entropy loss
      const eps = 1e-7;
      const loss = -(sample.label * Math.log(output + eps) + (1 - sample.label) * Math.log(1 - output + eps));
      totalLoss += loss;

      if ((output >= 0.5 && sample.label === 1) || (output < 0.5 && sample.label === 0)) {
        correct++;
      }

      this.backward(activations, sample.label);
    }

    this.epoch++;
    const avgLoss = totalLoss / data.length;
    const accuracy = correct / data.length;
    this.history.push({ epoch: this.epoch, loss: avgLoss, accuracy });

    return { loss: avgLoss, accuracy, epoch: this.epoch };
  }

  /**
   * Generate a decision boundary grid for visualization
   * Returns a 2D array of predictions [0..1] over the canvas space
   */
  decisionBoundary(resolution = 50, xRange = [0, 1], yRange = [0, 1]) {
    const grid = [];
    for (let i = 0; i < resolution; i++) {
      const row = [];
      const y = yRange[0] + (i / (resolution - 1)) * (yRange[1] - yRange[0]);
      for (let j = 0; j < resolution; j++) {
        const x = xRange[0] + (j / (resolution - 1)) * (xRange[1] - xRange[0]);
        row.push(this.predict([x, y]));
      }
      grid.push(row);
    }
    return grid;
  }

  reset() {
    const layerSizes = this.layerSizes;
    for (let i = 0; i < layerSizes.length - 1; i++) {
      const fanIn = layerSizes[i];
      const fanOut = layerSizes[i + 1];
      const scale = Math.sqrt(2 / (fanIn + fanOut));
      this.weights[i] = Array.from({ length: fanOut }, () =>
        Array.from({ length: fanIn }, () => (Math.random() * 2 - 1) * scale)
      );
      this.biases[i] = Array.from({ length: fanOut }, () => 0);
    }
    this.history = [];
    this.epoch = 0;
  }
}
