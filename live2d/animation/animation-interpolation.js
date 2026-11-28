
export function interpolateValue(
  startValue,
  endValue,
  progress,
  type = "linear"
) {
  const t = Math.max(0, Math.min(1, progress));

  switch (type) {
    case "hold":
      return startValue;

    case "bezier":
      return cubicEase(startValue, endValue, t);

    case "ease-in":
      return startValue + (endValue - startValue) * (t * t);

    case "ease-out":
      return startValue + (endValue - startValue) *
        (1 - (1 - t) * (1 - t));

    case "ease-in-out":
      return startValue + (endValue - startValue) *
        (t < 0.5
          ? 2 * t * t
          : 1 - Math.pow(-2 * t + 2, 2) / 2);

    case "linear":
    default:
      return startValue + (endValue - startValue) * t;
  }
}

export function cubicEase(startValue, endValue, progress) {
  const t = Math.max(0, Math.min(1, progress));

  const eased = t * t * (3 - 2 * t);

  return startValue + (endValue - startValue) * eased;
}

export function calculateTrackValue(track, time, defaultValue = 0) {
  if (!track || !Array.isArray(track.keyframes)) {
    return defaultValue;
  }

  const frames = [...track.keyframes].sort(
    (a, b) => a.time - b.time
  );

  if (frames.length === 0) {
    return defaultValue;
  }

  if (time <= frames[0].time) {
    return frames[0].value;
  }

  const lastFrame = frames[frames.length - 1];

  if (time >= lastFrame.time) {
    return lastFrame.value;
  }

  for (let i = 0; i < frames.length - 1; i++) {
    const start = frames[i];
    const end = frames[i + 1];

    if (time < start.time || time > end.time) {
      continue;
    }

    const duration = end.time - start.time;

    if (duration <= 0) {
      return end.value;
    }

    const progress = (time - start.time) / duration;

    return interpolateValue(
      start.value,
      end.value,
      progress,
      start.interpolation || "linear"
    );
  }

  return defaultValue;
}

export function getInterpolationTypes() {
  return [
    { id: "linear", name: "直線" },
    { id: "hold", name: "一定値" },
    { id: "bezier", name: "滑らか" },
    { id: "ease-in", name: "加速" },
    { id: "ease-out", name: "減速" },
    { id: "ease-in-out", name: "加速・減速" }
  ];
}
