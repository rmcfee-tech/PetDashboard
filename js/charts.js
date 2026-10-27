// charts.js
// Minimal canvas-based chart primitives. No Chart.js, no D3 — just enough
// to draw the weight trend, expense breakdown, and training progress
// charts called for in the spec. Each function takes a <canvas> element and
// draws directly; callers are responsible for setting canvas width/height
// (in CSS pixels) before calling, for crisp rendering on high-DPI screens.

function prepCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || canvas.width;
  const height = rect.height || canvas.height;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  return { ctx, width, height };
}

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Simple line chart, e.g. weight over time. points: [{label, value}] */
export function drawLineChart(canvas, points, { unit = "" } = {}) {
  const { ctx, width, height } = prepCanvas(canvas);
  ctx.clearRect(0, 0, width, height);
  if (!points.length) {
    drawEmptyState(ctx, width, height);
    return;
  }

  const padding = { top: 16, right: 16, bottom: 28, left: 44 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const textColor = cssVar("--color-text-muted") || "#6F6558";
  const lineColor = cssVar("--color-primary") || "#8A6E4B";
  const gridColor = cssVar("--color-border") || "#E8E1D6";

  // Grid lines + y-axis labels
  ctx.strokeStyle = gridColor;
  ctx.fillStyle = textColor;
  ctx.font = "11px sans-serif";
  ctx.textAlign = "right";
  const ySteps = 4;
  for (let i = 0; i <= ySteps; i++) {
    const y = padding.top + (chartH * i) / ySteps;
    const value = max - (range * i) / ySteps;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
    ctx.fillText(`${value.toFixed(1)}${unit}`, padding.left - 6, y + 3);
  }

  // Line path
  const stepX = points.length > 1 ? chartW / (points.length - 1) : 0;
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = padding.left + stepX * i;
    const y = padding.top + chartH - ((p.value - min) / range) * chartH;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Points
  ctx.fillStyle = lineColor;
  points.forEach((p, i) => {
    const x = padding.left + stepX * i;
    const y = padding.top + chartH - ((p.value - min) / range) * chartH;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // X labels (first, middle, last to avoid crowding)
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  const labelIdxs = points.length <= 5 ? points.map((_, i) => i) : [0, Math.floor(points.length / 2), points.length - 1];
  labelIdxs.forEach((i) => {
    const x = padding.left + stepX * i;
    ctx.fillText(points[i].label, x, height - 8);
  });
}

/** Simple bar chart, e.g. expenses by category. bars: [{label, value}] */
export function drawBarChart(canvas, bars, { prefix = "" } = {}) {
  const { ctx, width, height } = prepCanvas(canvas);
  ctx.clearRect(0, 0, width, height);
  if (!bars.length) {
    drawEmptyState(ctx, width, height);
    return;
  }

  const padding = { top: 16, right: 16, bottom: 36, left: 44 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const max = Math.max(...bars.map((b) => b.value), 1);

  const textColor = cssVar("--color-text-muted") || "#6F6558";
  const barColor = cssVar("--color-primary") || "#8A6E4B";
  const gridColor = cssVar("--color-border") || "#E8E1D6";

  ctx.strokeStyle = gridColor;
  ctx.fillStyle = textColor;
  ctx.font = "11px sans-serif";
  ctx.textAlign = "right";
  const ySteps = 4;
  for (let i = 0; i <= ySteps; i++) {
    const y = padding.top + (chartH * i) / ySteps;
    const value = max - (max * i) / ySteps;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
    ctx.fillText(`${prefix}${Math.round(value)}`, padding.left - 6, y + 3);
  }

  const gap = 8;
  const barW = (chartW - gap * (bars.length - 1)) / bars.length;
  ctx.fillStyle = barColor;
  ctx.textAlign = "center";
  bars.forEach((b, i) => {
    const barH = (b.value / max) * chartH;
    const x = padding.left + i * (barW + gap);
    const y = padding.top + chartH - barH;
    ctx.fillStyle = barColor;
    ctx.fillRect(x, y, barW, barH);
    ctx.fillStyle = textColor;
    ctx.fillText(b.label, x + barW / 2, height - 20);
    ctx.fillText(`${prefix}${b.value.toFixed(0)}`, x + barW / 2, height - 6);
  });
}

function drawEmptyState(ctx, width, height) {
  ctx.fillStyle = "#A79E8F";
  ctx.font = "13px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Not enough data yet", width / 2, height / 2);
}
