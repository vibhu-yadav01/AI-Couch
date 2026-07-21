import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Path,
  Rect,
  Circle,
  Text as SvgText,
  Line,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { Colors } from '../utils/colors';

interface Dataset {
  data: number[];
}

interface ChartData {
  labels: string[];
  datasets: Dataset[];
}

interface CustomSVGChartProps {
  type: 'line' | 'bar';
  data: ChartData;
  width: number;
  height: number;
  chartConfig?: any;
  bezier?: boolean;
  yAxisSuffix?: string;
  yAxisLabel?: string;
  style?: any;
}

export default function CustomSVGChart({
  type,
  data,
  width,
  height,
  chartConfig,
  bezier = false,
  yAxisSuffix = '',
  yAxisLabel = '',
  style,
}: CustomSVGChartProps) {
  const values = data.datasets?.[0]?.data || [];
  const labels = data.labels || [];

  if (values.length === 0) {
    return (
      <View style={[styles.container, { width, height }, style]}>
        <Text style={styles.noDataText}>No chart data available</Text>
      </View>
    );
  }

  // Resolve base chart colors from chartConfig if provided
  const lineColor = chartConfig?.color ? chartConfig.color(1) : Colors.primary;
  const gradientColorStart = chartConfig?.color ? chartConfig.color(0.25) : `${Colors.primary}40`;
  const labelColor = chartConfig?.labelColor ? chartConfig.labelColor(0.6) : 'rgba(240, 240, 255, 0.6)';

  // Margin layout
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Compute scale boundaries
  const maxDataVal = Math.max(...values, 0);
  const isPercent = yAxisSuffix === '%' || maxDataVal > 100;
  const maxVal = isPercent ? 100 : Math.max(maxDataVal, 5);
  const minVal = 0;

  // Coordinate helpers
  const getX = (index: number) => {
    if (values.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (values.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    const clampedVal = Math.max(minVal, Math.min(maxVal, val));
    const range = maxVal - minVal;
    const fraction = range === 0 ? 0.5 : (clampedVal - minVal) / range;
    return height - paddingBottom - fraction * chartHeight;
  };

  // Generate grid markers
  const gridDivisions = 4;
  const gridLines = Array.from({ length: gridDivisions + 1 }, (_, i) => {
    const fraction = i / gridDivisions;
    const yVal = minVal + fraction * (maxVal - minVal);
    const yPos = getY(yVal);
    return {
      yPos,
      label: `${yAxisLabel}${Math.round(yVal)}${yAxisSuffix}`,
    };
  });

  // Generate path string for Line Chart
  let linePath = '';
  let areaPath = '';
  if (type === 'line' && values.length >= 2) {
    linePath = values.reduce((acc, val, idx) => {
      const x = getX(idx);
      const y = getY(val);
      return acc + (idx === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
    }, '');

    // Close path under the line for the gradient fill
    const startX = getX(0);
    const endX = getX(values.length - 1);
    const baselineY = height - paddingBottom;
    areaPath = `${linePath} L ${endX} ${baselineY} L ${startX} ${baselineY} Z`;
  }

  // Draw Bar Chart elements
  const renderBars = () => {
    if (type !== 'bar') return null;
    const numBars = values.length;
    const outerWidth = chartWidth / numBars;
    const barWidth = outerWidth * 0.45; // 45% width of partition
    const baselineY = height - paddingBottom;

    return values.map((val, idx) => {
      const centerPos = paddingLeft + idx * outerWidth + outerWidth / 2;
      const barX = centerPos - barWidth / 2;
      const barY = getY(val);
      const barHeight = baselineY - barY;

      return (
        <Rect
          key={`bar-${idx}`}
          x={barX}
          y={barY}
          width={barWidth}
          height={Math.max(barHeight, 2)} // ensure at least a visible sliver
          fill={lineColor}
          rx={4}
          ry={4}
        />
      );
    });
  };

  return (
    <View style={[styles.container, { width, height }, style]}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="chartFillGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={lineColor} stopOpacity={0.35} />
            <Stop offset="100%" stopColor={lineColor} stopOpacity={0.0} />
          </LinearGradient>
        </Defs>

        {/* Horizontal Grid lines & Y axis labels */}
        {gridLines.map((line, idx) => (
          <React.Fragment key={`grid-${idx}`}>
            <Line
              x1={paddingLeft}
              y1={line.yPos}
              x2={width - paddingRight}
              y2={line.yPos}
              stroke="rgba(240, 240, 255, 0.08)"
              strokeDasharray="4 4"
            />
            <SvgText
              x={paddingLeft - 8}
              y={line.yPos + 3}
              fill={labelColor}
              fontSize="10"
              fontWeight="600"
              textAnchor="end"
            >
              {line.label}
            </SvgText>
          </React.Fragment>
        ))}

        {/* X axis labels */}
        {labels.map((lbl, idx) => {
          let xPos = 0;
          if (type === 'line') {
            xPos = getX(idx);
          } else {
            const outerWidth = chartWidth / values.length;
            xPos = paddingLeft + idx * outerWidth + outerWidth / 2;
          }

          return (
            <SvgText
              key={`lbl-${idx}`}
              x={xPos}
              y={height - 10}
              fill={labelColor}
              fontSize="9"
              fontWeight="600"
              textAnchor="middle"
            >
              {lbl}
            </SvgText>
          );
        })}

        {/* Line Chart Paths & Dots */}
        {type === 'line' && (
          <>
            {areaPath !== '' && (
              <Path d={areaPath} fill="url(#chartFillGradient)" />
            )}
            {linePath !== '' && (
              <Path
                d={linePath}
                fill="none"
                stroke={lineColor}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {values.map((val, idx) => (
              <Circle
                key={`dot-${idx}`}
                cx={getX(idx)}
                cy={getY(val)}
                r={4}
                fill={Colors.surface}
                stroke={lineColor}
                strokeWidth={2}
              />
            ))}
          </>
        )}

        {/* Bar Chart rendering */}
        {type === 'bar' && renderBars()}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  noDataText: {
    color: Colors.textMuted || '#666',
    fontSize: 14,
    fontWeight: '500',
  },
});
