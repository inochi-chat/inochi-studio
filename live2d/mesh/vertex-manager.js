
export function getVertex(mesh, vertexIndex) {
  if (!mesh || !Array.isArray(mesh.vertices)) {
    return null;
  }

  return mesh.vertices[vertexIndex] || null;
}

export function getVertexById(mesh, vertexId) {
  if (!mesh || !Array.isArray(mesh.vertices)) {
    return null;
  }

  return mesh.vertices.find(
    vertex => vertex.id === vertexId
  ) || null;
}

export function moveVertex(
  mesh,
  vertexIndex,
  x,
  y
) {
  const vertex = getVertex(mesh, vertexIndex);

  if (!vertex || vertex.locked) {
    return false;
  }

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return false;
  }

  vertex.x = x;
  vertex.y = y;

  return true;
}

export function moveVertexBy(
  mesh,
  vertexIndex,
  deltaX,
  deltaY
) {
  const vertex = getVertex(mesh, vertexIndex);

  if (!vertex || vertex.locked) {
    return false;
  }

  if (
    !Number.isFinite(deltaX) ||
    !Number.isFinite(deltaY)
  ) {
    return false;
  }

  vertex.x += deltaX;
  vertex.y += deltaY;

  return true;
}

export function resetVertex(mesh, vertexIndex) {
  const vertex = getVertex(mesh, vertexIndex);

  if (!vertex) {
    return false;
  }

  vertex.x = vertex.originalX;
  vertex.y = vertex.originalY;

  return true;
}

export function resetAllVertices(mesh) {
  if (!mesh || !Array.isArray(mesh.vertices)) {
    return false;
  }

  for (const vertex of mesh.vertices) {
    vertex.x = vertex.originalX;
    vertex.y = vertex.originalY;
  }

  return true;
}

export function setVertexLocked(
  mesh,
  vertexIndex,
  locked
) {
  const vertex = getVertex(mesh, vertexIndex);

  if (!vertex) {
    return false;
  }

  vertex.locked = Boolean(locked);

  return true;
}

export function getVertexDistance(first, second) {
  if (!first || !second) {
    return Infinity;
  }

  const deltaX = first.x - second.x;
  const deltaY = first.y - second.y;

  return Math.hypot(deltaX, deltaY);
}

export function findNearestVertex(
  mesh,
  x,
  y,
  maxDistance = 20
) {
  if (!mesh || !Array.isArray(mesh.vertices)) {
    return null;
  }

  let nearestVertex = null;
  let nearestIndex = -1;
  let nearestDistance = maxDistance;

  mesh.vertices.forEach((vertex, index) => {
    const distance = getVertexDistance(
      vertex,
      { x, y }
    );

    if (distance <= nearestDistance) {
      nearestDistance = distance;
      nearestVertex = vertex;
      nearestIndex = index;
    }
  });

  if (!nearestVertex) {
    return null;
  }

  return {
    vertex: nearestVertex,
    index: nearestIndex,
    distance: nearestDistance
  };
}

export function getVertexCount(mesh) {
  return mesh?.vertices?.length || 0;
}
