
import { createMesh } from "./mesh-manager.js";

export function generateMesh(state, partId, options = {}) {
  const part = state.parts.find(
    item => item.id === partId
  );

  if (!part || !part.image) {
    throw new Error("メッシュを生成するパーツがありません");
  }

  const columns = Math.max(
    1,
    Math.min(50, Math.floor(options.columns ?? 4))
  );

  const rows = Math.max(
    1,
    Math.min(50, Math.floor(options.rows ?? 4))
  );

  const width = part.width || part.image.naturalWidth;
  const height = part.height || part.image.naturalHeight;

  if (!width || !height) {
    throw new Error("パーツの画像サイズが正しくありません");
  }

  const mesh = createMesh(state, {
    name: `${part.name} メッシュ`,
    partId
  });

  mesh.vertices = generateVertices(
    width,
    height,
    columns,
    rows
  );

  mesh.triangles = generateTriangles(
    columns,
    rows
  );

  return mesh;
}

export function generateVertices(
  width,
  height,
  columns,
  rows
) {
  const vertices = [];

  for (let y = 0; y <= rows; y++) {
    for (let x = 0; x <= columns; x++) {
      const positionX = (width / columns) * x;
      const positionY = (height / rows) * y;

      vertices.push({
        id: `vertex_${vertices.length + 1}`,
        x: positionX,
        y: positionY,
        originalX: positionX,
        originalY: positionY,
        u: positionX / width,
        v: positionY / height,
        locked: false
      });
    }
  }

  return vertices;
}

export function generateTriangles(columns, rows) {
  const triangles = [];

  const vertexIndex = (x, y) => {
    return y * (columns + 1) + x;
  };

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const topLeft = vertexIndex(x, y);
      const topRight = vertexIndex(x + 1, y);
      const bottomLeft = vertexIndex(x, y + 1);
      const bottomRight = vertexIndex(x + 1, y + 1);

      triangles.push({
        id: `triangle_${triangles.length + 1}`,
        vertices: [topLeft, bottomLeft, topRight]
      });

      triangles.push({
        id: `triangle_${triangles.length + 1}`,
        vertices: [topRight, bottomLeft, bottomRight]
      });
    }
  }

  return triangles;
}

export function regenerateMesh(state, meshId, options = {}) {
  const mesh = state.meshes.find(
    item => item.id === meshId
  );

  if (!mesh) {
    throw new Error("メッシュが見つかりません");
  }

  const part = state.parts.find(
    item => item.id === mesh.partId
  );

  if (!part || !part.image) {
    throw new Error("元のパーツが見つかりません");
  }

  const columns = Math.max(
    1,
    Math.min(50, Math.floor(options.columns ?? 4))
  );

  const rows = Math.max(
    1,
    Math.min(50, Math.floor(options.rows ?? 4))
  );

  const width = part.width || part.image.naturalWidth;
  const height = part.height || part.image.naturalHeight;

  mesh.vertices = generateVertices(
    width,
    height,
    columns,
    rows
  );

  mesh.triangles = generateTriangles(
    columns,
    rows
  );

  return mesh;
}
