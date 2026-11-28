
export function createWarpDeformer(options = {}) {
  const columns = Math.max(
    1,
    Math.min(30, Math.floor(options.columns ?? 2))
  );

  const rows = Math.max(
    1,
    Math.min(30, Math.floor(options.rows ?? 2))
  );

  const width = Math.max(1, options.width ?? 200);
  const height = Math.max(1, options.height ?? 200);

  const vertices = [];

  for (let y = 0; y <= rows; y++) {
    for (let x = 0; x <= columns; x++) {
      const positionX = (width / columns) * x;
      const positionY = (height / rows) * y;

      vertices.push({
        id: `warp_vertex_${vertices.length + 1}`,
        x: positionX,
        y: positionY,
        originalX: positionX,
        originalY: positionY,
        locked: false
      });
    }
  }

  return {
    type: "warp",
    width,
    height,
    columns,
    rows,
    vertices
  };
}

export function getWarpVertex(warp, index) {
  if (!warp || !Array.isArray(warp.vertices)) {
    return null;
  }

  return warp.vertices[index] || null;
}

export function moveWarpVertex(warp, index, x, y) {
  const vertex = getWarpVertex(warp, index);

  if (
    !vertex ||
    vertex.locked ||
    !Number.isFinite(x) ||
    !Number.isFinite(y)
  ) {
    return false;
  }

  vertex.x = x;
  vertex.y = y;

  return true;
}

export function resetWarpVertex(warp, index) {
  const vertex = getWarpVertex(warp, index);

  if (!vertex) {
    return false;
  }

  vertex.x = vertex.originalX;
  vertex.y = vertex.originalY;

  return true;
}

export function resetWarp(warp) {
  if (!warp || !Array.isArray(warp.vertices)) {
    return false;
  }

  for (const vertex of warp.vertices) {
    vertex.x = vertex.originalX;
    vertex.y = vertex.originalY;
  }

  return true;
}

export function setWarpVertexLocked(warp, index, locked) {
  const vertex = getWarpVertex(warp, index);

  if (!vertex) {
    return false;
  }

  vertex.locked = Boolean(locked);

  return true;
}

export function getWarpVertexIndex(warp, column, row) {
  if (
    !warp ||
    !Number.isInteger(column) ||
    !Number.isInteger(row) ||
    column < 0 ||
    row < 0 ||
    column > warp.columns ||
    row > warp.rows
  ) {
    return -1;
  }

  return row * (warp.columns + 1) + column;
}

export function getWarpGridInfo(warp) {
  if (!warp) {
    return null;
  }

  return {
    columns: warp.columns,
    rows: warp.rows,
    vertexCount: warp.vertices.length,
    width: warp.width,
    height: warp.height
  };
}
