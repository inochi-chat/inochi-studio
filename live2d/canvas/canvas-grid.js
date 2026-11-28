
export function initializeGrid(state) {
  state.gridEnabled = true;

  state.grid = {
    size: 24,
    color: "rgba(255,255,255,0.06)",
    lineWidth: 1,
    opacity: 1
  };

  console.log("Canvas Grid: Ready");
}

export function setGridEnabled(state, enabled) {
  state.gridEnabled = Boolean(enabled);
}

export function toggleGrid(state) {
  state.gridEnabled = !state.gridEnabled;

  return state.gridEnabled;
}

export function setGridSize(state, size) {
  if (!Number.isFinite(size) || size <= 0) {
    return;
  }

  state.grid.size = Math.max(4, Math.min(200, size));
}

export function setGridColor(state, color) {
  if (typeof color !== "string") {
    return;
  }

  state.grid.color = color;
}

export function setGridOpacity(state, opacity) {
  if (!Number.isFinite(opacity)) {
    return;
  }

  state.grid.opacity = Math.max(0, Math.min(1, opacity));
}

export function getGridSettings(state) {
  return {
    enabled: state.gridEnabled,
    size: state.grid.size,
    color: state.grid.color,
    opacity: state.grid.opacity,
    lineWidth: state.grid.lineWidth
  };
}
