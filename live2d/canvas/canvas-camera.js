
export function initializeCamera(state) {
  state.zoom = 1;
  state.panX = 0;
  state.panY = 0;

  state.minZoom = 0.05;
  state.maxZoom = 10;

  state.camera = {
    dragging: false,
    lastX: 0,
    lastY: 0,
    zoomStep: 1.15
  };

  console.log("Canvas Camera: Ready");
}

export function setZoom(state, zoom, centerX = null, centerY = null) {
  const camera = state.camera;

  if (!camera) {
    return;
  }

  const oldZoom = state.zoom || 1;

  const newZoom = Math.max(
    state.minZoom,
    Math.min(state.maxZoom, zoom)
  );

  if (centerX !== null && centerY !== null) {
    const worldX = (centerX - state.panX) / oldZoom;
    const worldY = (centerY - state.panY) / oldZoom;

    state.panX = centerX - worldX * newZoom;
    state.panY = centerY - worldY * newZoom;
  }

  state.zoom = newZoom;

  updateZoomDisplay(state);
}

export function zoomIn(state) {
  const camera = state.camera;

  setZoom(
    state,
    state.zoom * (camera?.zoomStep || 1.15)
  );
}

export function zoomOut(state) {
  const camera = state.camera;

  setZoom(
    state,
    state.zoom / (camera?.zoomStep || 1.15)
  );
}

export function resetCamera(state) {
  state.zoom = 1;
  state.panX = 0;
  state.panY = 0;

  updateZoomDisplay(state);
}

export function moveCamera(state, deltaX, deltaY) {
  state.panX += deltaX;
  state.panY += deltaY;
}

export function startCameraDrag(state, x, y) {
  if (!state.camera) {
    return;
  }

  state.camera.dragging = true;
  state.camera.lastX = x;
  state.camera.lastY = y;
}

export function updateCameraDrag(state, x, y) {
  const camera = state.camera;

  if (!camera || !camera.dragging) {
    return;
  }

  const deltaX = x - camera.lastX;
  const deltaY = y - camera.lastY;

  moveCamera(state, deltaX, deltaY);

  camera.lastX = x;
  camera.lastY = y;
}

export function stopCameraDrag(state) {
  if (!state.camera) {
    return;
  }

  state.camera.dragging = false;
}

function updateZoomDisplay(state) {
  const zoomLabel = document.getElementById("zoomValue");

  if (zoomLabel) {
    zoomLabel.textContent =
      `${Math.round(state.zoom * 100)}%`;
  }
}
