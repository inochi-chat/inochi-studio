
export function initializeTimeline(state) {
  state.timeline = {
    pixelsPerSecond: 100,
    scrollX: 0,
    zoom: 1,
    rulerHeight: 28,
    trackHeight: 36,
    currentTime: 0,
    snapEnabled: true,
    snapInterval: 1 / 30
  };

  console.log("Timeline Manager: Ready");
}

export function timeToPosition(state, time) {
  const timeline = state.timeline;

  return (
    time * timeline.pixelsPerSecond * timeline.zoom
    - timeline.scrollX
  );
}

export function positionToTime(state, position) {
  const timeline = state.timeline;

  return (
    (position + timeline.scrollX) /
    (timeline.pixelsPerSecond * timeline.zoom)
  );
}

export function frameToTime(frame, frameRate) {
  if (!Number.isFinite(frameRate) || frameRate <= 0) {
    return 0;
  }

  return frame / frameRate;
}

export function timeToFrame(time, frameRate) {
  if (!Number.isFinite(frameRate) || frameRate <= 0) {
    return 0;
  }

  return Math.round(time * frameRate);
}

export function snapTimeToFrame(state, time, frameRate = 30) {
  if (!Number.isFinite(time)) return 0;

  if (!state.timeline.snapEnabled) {
    return time;
  }

  const interval = 1 / frameRate;

  return Math.round(time / interval) * interval;
}

export function setTimelineZoom(state, zoom, centerPosition = 0) {
  const timeline = state.timeline;

  if (!Number.isFinite(zoom)) return;

  const oldZoom = timeline.zoom;

  const newZoom = Math.max(
    0.1,
    Math.min(10, zoom)
  );

  const centerTime = positionToTime(
    state,
    centerPosition
  );

  timeline.zoom = newZoom;

  timeline.scrollX =
    centerTime * timeline.pixelsPerSecond * newZoom
    - centerPosition;
}

export function setTimelineScroll(state, scrollX) {
  if (!Number.isFinite(scrollX)) return;

  state.timeline.scrollX = Math.max(0, scrollX);
}

export function setTimelineSnap(state, enabled) {
  state.timeline.snapEnabled = Boolean(enabled);
}

export function setSnapInterval(state, interval) {
  if (!Number.isFinite(interval) || interval <= 0) {
    return false;
  }

  state.timeline.snapInterval = interval;

  return true;
}

export function getTimelineInfo(state) {
  const timeline = state.timeline;

  return {
    zoom: timeline.zoom,
    scrollX: timeline.scrollX,
    pixelsPerSecond: timeline.pixelsPerSecond,
    currentTime: timeline.currentTime,
    snapEnabled: timeline.snapEnabled,
    snapInterval: timeline.snapInterval
  };
}
