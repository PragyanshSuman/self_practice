import { ComprehensiveTracingAnalytics, TouchPoint } from '@models/AnalyticsTypes';
import { Point } from '@models/TracingData';

/**
 * Service for generating visualization data for charts and graphs
 */

export interface ChartDataPoint {
  x: number | string;
  y: number;
  label?: string;
}

export interface LineChartData {
  datasets: Array<{
    data: ChartDataPoint[];
    color: string;
    label: string;
  }>;
  labels: string[];
}

export interface HeatmapData {
  grid: number[][];
  maxValue: number;
  minValue: number;
}

export interface BarChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    color: string;
    label: string;
  }>;
}

export class VisualizationService {
  private static instance: VisualizationService;

  private constructor() {}

  static getInstance(): VisualizationService {
    if (!VisualizationService.instance) {
      VisualizationService.instance = new VisualizationService();
    }
    return VisualizationService.instance;
  }

  /**
   * Generate velocity over time chart data
   */
  generateVelocityChart(analytics: ComprehensiveTracingAnalytics): LineChartData {
    const velocities = analytics.velocity_kinematics.instantaneous_velocity;
    const timestamps = analytics.raw_touch_data.touch_coordinates_array.map(
      (_, i) => i / analytics.raw_touch_data.sampling_rate
    );

    return {
      datasets: [
        {
          data: velocities.map((v, i) => ({
            x: timestamps[i] || i,
            y: v,
          })),
          color: '#2196F3',
          label: 'Velocity (px/s)',
        },
      ],
      labels: timestamps.map(t => t.toFixed(1)),
    };
  }

  /**
   * Generate accuracy heatmap
   */
  generateAccuracyHeatmap(
    touchPoints: TouchPoint[],
    gridSize: number = 20
  ): HeatmapData {
    if (touchPoints.length === 0) {
      return { grid: [], maxValue: 0, minValue: 0 };
    }

    // Find bounds
    const xs = touchPoints.map(p => p.x);
    const ys = touchPoints.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const cellWidth = (maxX - minX) / gridSize;
    const cellHeight = (maxY - minY) / gridSize;

    // Initialize grid
    const grid: number[][] = Array(gridSize)
      .fill(0)
      .map(() => Array(gridSize).fill(0));

    // Populate grid
    touchPoints.forEach(point => {
      const col = Math.min(
        Math.floor((point.x - minX) / cellWidth),
        gridSize - 1
      );
      const row = Math.min(
        Math.floor((point.y - minY) / cellHeight),
        gridSize - 1
      );
      grid[row][col]++;
    });

    const flatGrid = grid.flat();
    const maxValue = Math.max(...flatGrid);
    const minValue = Math.min(...flatGrid);

    return { grid, maxValue, minValue };
  }

  /**
   * Generate progress over sessions chart
   */
  generateProgressChart(sessions: ComprehensiveTracingAnalytics[]): LineChartData {
    const sorted = [...sessions].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return {
      datasets: [
        {
          data: sorted.map((s, i) => ({
            x: i + 1,
            y: s.spatial_accuracy_deviation.accuracy_score,
          })),
          color: '#4CAF50',
          label: 'Accuracy',
        },
        {
          data: sorted.map((s, i) => ({
            x: i + 1,
            y: s.velocity_kinematics.fluency_ratio * 100,
          })),
          color: '#2196F3',
          label: 'Fluency',
        },
      ],
      labels: sorted.map((_, i) => `S${i + 1}`),
    };
  }

  /**
   * Generate stroke comparison chart
   */
  generateStrokeComparisonChart(analytics: ComprehensiveTracingAnalytics): BarChartData {
    const strokes = analytics.stroke_count_sequencing.strokes;

    return {
      labels: strokes.map((_, i) => `Stroke ${i + 1}`),
      datasets: [
        {
          data: strokes.map(s => s.duration),
          color: '#FF9800',
          label: 'Duration (s)',
        },
        {
          data: strokes.map(s => s.deviation_from_ideal),
          color: '#F44336',
          label: 'Deviation (px)',
        },
      ],
    };
  }

  /**
   * Generate risk assessment radar chart data
   */
  generateRiskRadarChart(analytics: ComprehensiveTracingAnalytics): {
    labels: string[];
    data: number[];
  } => {
    return {
      labels: [
        'Dyslexia',
        'Dysgraphia',
        'Reversal',
        'Attention',
        'Processing Speed',
        'Working Memory',
      ],
      data: [
        analytics.automated_risk_assessment.dyslexia_risk_score,
        analytics.automated_risk_assessment.dysgraphia_risk_score,
        analytics.automated_risk_assessment.reversal_risk_score,
        analytics.automated_risk_assessment.attention_deficit_risk_score,
        analytics.automated_risk_assessment.processing_speed_deficit_score,
        analytics.automated_risk_assessment.working_memory_deficit_score,
      ],
    };
  }

  /**
   * Generate letter mastery pie chart
   */
  generateLetterMasteryChart(sessions: ComprehensiveTracingAnalytics[]): {
    labels: string[];
    data: number[];
    colors: string[];
  } => {
    // Group by letter
    const letterGroups: Record<string, number[]> = {};
    sessions.forEach(s => {
      if (!letterGroups[s.letter]) {
        letterGroups[s.letter] = [];
      }
      letterGroups[s.letter].push(s.spatial_accuracy_deviation.accuracy_score);
    });

    // Calculate average accuracy per letter
    const letterData = Object.entries(letterGroups).map(([letter, scores]) => ({
      letter,
      avgAccuracy: scores.reduce((a, b) => a + b, 0) / scores.length,
    }));

    // Categorize
    const mastered = letterData.filter(l => l.avgAccuracy >= 85).length;
    const learning = letterData.filter(l => l.avgAccuracy >= 60 && l.avgAccuracy < 85).length;
    const struggling = letterData.filter(l => l.avgAccuracy < 60).length;

    return {
      labels: ['Mastered', 'Learning', 'Struggling'],
      data: [mastered, learning, struggling],
      colors: ['#4CAF50', '#FF9800', '#F44336'],
    };
  }

  /**
   * Generate performance metrics comparison
   */
  generateMetricsComparison(
    current: ComprehensiveTracingAnalytics,
    previous?: ComprehensiveTracingAnalytics
  ): {
    metrics: Array<{
      name: string;
      current: number;
      previous?: number;
      change?: number;
      unit: string;
    }>;
  } => {
    const metrics = [
      {
        name: 'Accuracy',
        current: current.spatial_accuracy_deviation.accuracy_score,
        previous: previous?.spatial_accuracy_deviation.accuracy_score,
        unit: '%',
      },
      {
        name: 'Velocity',
        current: current.velocity_kinematics.average_velocity,
        previous: previous?.velocity_kinematics.average_velocity,
        unit: 'px/s',
      },
      {
        name: 'Fluency',
        current: current.velocity_kinematics.fluency_ratio * 100,
        previous: previous ? previous.velocity_kinematics.fluency_ratio * 100 : undefined,
        unit: '%',
      },
      {
        name: 'Duration',
        current: current.time_based_performance.total_session_duration,
        previous: previous?.time_based_performance.total_session_duration,
        unit: 's',
      },
    ];

    return {
      metrics: metrics.map(m => ({
        ...m,
        change: m.previous ? ((m.current - m.previous) / m.previous) * 100 : undefined,
      })),
    };
  }

  /**
   * Generate path visualization data
   */
  generatePathVisualization(analytics: ComprehensiveTracingAnalytics): {
    userPath: Point[];
    deviations: Array<{ point: Point; deviation: number }>;
    offTrackSegments: Array<{ start: number; end: number }>;
  } => {
    const userPath = analytics.raw_touch_data.touch_coordinates_array.map(p => ({
      x: p.x,
      y: p.y,
    }));

    // Calculate deviations (simplified - would need ideal path)
    const deviations = userPath.map((point, i) => ({
      point,
      deviation: Math.random() * 50, // Placeholder
    }));

    const offTrackSegments = analytics.spatial_accuracy_deviation.off_track_events.map(
      (event, i) => ({
        start: i * 10, // Placeholder
        end: i * 10 + event.duration,
      })
    );

    return {
      userPath,
      deviations,
      offTrackSegments,
    };
  }

  /**
   * Generate session timeline
   */
  generateSessionTimeline(sessions: ComprehensiveTracingAnalytics[]): {
    timeline: Array<{
      date: string;
      letter: string;
      accuracy: number;
      riskLevel: string;
    }>;
  } => {
    const sorted = [...sessions].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return {
      timeline: sorted.map(s => ({
        date: new Date(s.timestamp).toLocaleDateString(),
        letter: s.letter,
        accuracy: s.spatial_accuracy_deviation.accuracy_score,
        riskLevel: s.automated_risk_assessment.overall_risk_level,
      })),
    };
  }

  /**
   * Export visualization as SVG data
   */
  generateSVGPath(points: Point[]): string {
    if (points.length === 0) return '';

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }

    return path;
  }
}

export default VisualizationService.getInstance();
