
export function getTriangle(mesh, triangleIndex) {
  if (!mesh || !Array.isArray(mesh.triangles)) {
    return null;
  }

  return mesh.triangles[triangleIndex] || null;
}

export function getTriangleById(mesh, triangleId) {
  if (!mesh || !Array.isArray(mesh.triangles)) {
    return null;
  }

  return mesh.triangles.find(
    triangle => triangle.id === triangleId
  ) || null;
}

export function addTriangle(mesh, vertexA, vertexB, vertexC) {
  if (!mesh || !Array.isArray(mesh.vertices)) {
    return null;
  }

  const indices = [vertexA, vertexB, vertexC];

  if (
    indices.some(
      index =>
        !Number.isInteger(index) ||
        index < 0 ||
        index >= mesh.vertices.length
    )
  ) {
    return null;
  }

  if (new Set(indices).size !== 3) {
    return null;
  }

  const triangle = {
    id: `triangle_${Date.now()}_${mesh.triangles.length}`,
    vertices: indices
  };

  mesh.triangles.push(triangle);

  return triangle;
}

export function removeTriangle(mesh, triangleId) {
  if (!mesh || !Array.isArray(mesh.triangles)) {
    return false;
  }

  const index = mesh.triangles.findIndex(
    triangle => triangle.id === triangleId
  );

  if (index === -1) {
    return false;
  }

  mesh.triangles.splice(index, 1);

  return true;
}

export function setTriangleVertices(
  mesh,
  triangleId,
  vertexA,
  vertexB,
  vertexC
) {
  const triangle = getTriangleById(mesh, triangleId);

  if (!triangle) {
    return false;
  }

  const indices = [vertexA, vertexB, vertexC];

  if (
    indices.some(
      index =>
        !Number.isInteger(index) ||
        index < 0 ||
        index >= mesh.vertices.length
    )
  ) {
    return false;
  }

  if (new Set(indices).size !== 3) {
    return false;
  }

  triangle.vertices = indices;

  return true;
}

export function getTriangleVertices(mesh, triangle) {
  if (!mesh || !triangle) {
    return null;
  }

  const [a, b, c] = triangle.vertices;

  return [
    mesh.vertices[a],
    mesh.vertices[b],
    mesh.vertices[c]
  ];
}

export function getTrianglesByVertex(mesh, vertexIndex) {
  if (!mesh || !Array.isArray(mesh.triangles)) {
    return [];
  }

  return mesh.triangles.filter(
    triangle => triangle.vertices.includes(vertexIndex)
  );
}

export function getTriangleCount(mesh) {
  return mesh?.triangles?.length || 0;
}

export function clearTriangles(mesh) {
  if (!mesh || !Array.isArray(mesh.triangles)) {
    return false;
  }

  mesh.triangles = [];

  return true;
}

export function calculateTriangleArea(mesh, triangle) {
  const vertices = getTriangleVertices(mesh, triangle);

  if (
    !vertices ||
    vertices.some(vertex => !vertex)
  ) {
    return 0;
  }

  const [a, b, c] = vertices;

  return Math.abs(
    (a.x * (b.y - c.y) +
      b.x * (c.y - a.y) +
      c.x * (a.y - b.y)) / 2
  );
}
