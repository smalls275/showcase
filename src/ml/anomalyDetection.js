/**
 * Anomaly Detection — Implemented from scratch
 * 
 * Uses multiple statistical methods to detect anomalies in time series data:
 * 1. Z-Score: flags points more than N standard deviations from the mean
 * 2. Moving Average: flags points deviating from local trend
 * 3. IQR (Interquartile Range): flags statistical outliers
 * 
 * Combined ensemble scoring for robust detection.
 */

export class AnomalyDetector {
  constructor(config = {}) {
    this.zThreshold = config.zThreshold || 2.5;
    this.windowSize = config.windowSize || 10;
    this.iqrMultiplier = config.iqrMultiplier || 1.5;
    this.sensitivity = config.sensitivity || 0.5; // 0-1, how many methods must agree
  }

  /**
   * Compute mean of an array
   */
  static mean(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  /**
   * Compute standard deviation
   */
  static std(arr) {
    if (arr.length < 2) return 0;
    const m = AnomalyDetector.mean(arr);
    const variance = arr.reduce((sum, x) => sum + (x - m) ** 2, 0) / (arr.length - 1);
    return Math.sqrt(variance);
  }

  /**
   * Z-Score anomaly detection
   * Flags points where |z| > threshold
   */
  zScoreDetect(values) {
    const m = AnomalyDetector.mean(values);
    const s = AnomalyDetector.std(values);
    if (s === 0) return values.map(() => ({ isAnomaly: false, zScore: 0 }));

    return values.map(v => {
      const z = Math.abs((v - m) / s);
      return { isAnomaly: z > this.zThreshold, zScore: z };
    });
  }

  /**
   * Moving Average anomaly detection
   * Flags points deviating significantly from local moving average
   */
  movingAverageDetect(values) {
    const results = [];
    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - this.windowSize);
      const end = Math.min(values.length, i + this.windowSize + 1);
      const window = values.slice(start, end);
      const ma = AnomalyDetector.mean(window);
      const mStd = AnomalyDetector.std(window);
      const deviation = mStd > 0 ? Math.abs(values[i] - ma) / mStd : 0;
      results.push({
        isAnomaly: deviation > this.zThreshold,
        movingAvg: ma,
        deviation
      });
    }
    return results;
  }

  /**
   * IQR-based anomaly detection
   * Flags points outside [Q1 - k*IQR, Q3 + k*IQR]
   */
  iqrDetect(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lower = q1 - this.iqrMultiplier * iqr;
    const upper = q3 + this.iqrMultiplier * iqr;

    return values.map(v => ({
      isAnomaly: v < lower || v > upper,
      lower,
      upper,
      iqr
    }));
  }

  /**
   * Ensemble detection — combines all three methods
   * Returns anomaly scores and flags for each point
   */
  detect(values) {
    const zResults = this.zScoreDetect(values);
    const maResults = this.movingAverageDetect(values);
    const iqrResults = this.iqrDetect(values);

    return values.map((value, i) => {
      const votes = [
        zResults[i].isAnomaly ? 1 : 0,
        maResults[i].isAnomaly ? 1 : 0,
        iqrResults[i].isAnomaly ? 1 : 0,
      ];
      const score = votes.reduce((a, b) => a + b, 0) / 3;

      return {
        value,
        index: i,
        isAnomaly: score >= this.sensitivity,
        score,
        zScore: zResults[i].zScore,
        movingAvg: maResults[i].movingAvg,
        deviation: maResults[i].deviation,
        methods: {
          zScore: zResults[i].isAnomaly,
          movingAvg: maResults[i].isAnomaly,
          iqr: iqrResults[i].isAnomaly,
        }
      };
    });
  }
}

/**
 * Generate synthetic time series data with optional anomaly injection
 */
export function generateTimeSeries(length = 200, anomalyRate = 0.05) {
  const data = [];
  let trend = 50;
  const seasonalPeriod = 30;

  for (let i = 0; i < length; i++) {
    // Trend component (slight upward drift)
    trend += (Math.random() - 0.48) * 0.3;

    // Seasonal component
    const seasonal = Math.sin((i / seasonalPeriod) * 2 * Math.PI) * 8;

    // Noise
    const noise = (Math.random() - 0.5) * 6;

    let value = trend + seasonal + noise;

    // Inject anomalies
    const isInjected = Math.random() < anomalyRate;
    if (isInjected) {
      value += (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 20);
    }

    data.push({
      index: i,
      value: Math.round(value * 100) / 100,
      injected: isInjected
    });
  }

  return data;
}
