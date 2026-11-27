
export function createMeshTopology(mesh) {
  if (!mesh?.isMesh || !mesh.geometry?.attributes?.position) {
    throw new Error("有効なメッシュを指定してください。");
  }

  const geometry = mesh.geometry;
  const position = geometry.attributes.position;
  const index = geometry.index;

  const vertices = [];
  const edges = [];
  const faces = [];

  const vertexLookup = new Map();
  const edgeLookup = new Map();

  const vertexEdges = new Map();
  const vertexFaces = new Map();

  function vertexKey(x, y, z) {
    return `${x.toFixed(5)},${y.toFixed(5)},${z.toFixed(5)}`;
  }

  function getVertexId(sourceIndex) {
    const x = position.getX(sourceIndex);
    const y = position.getY(sourceIndex);
    const z = position.getZ(sourceIndex);

    const key = vertexKey(x, y, z);

    if (!vertexLookup.has(key)) {
      const id = vertices.length;

      vertexLookup.set(key, id);

      vertices.push({
        id,
        position: { x, y, z },
        sourceIndices: [sourceIndex]
      });

      vertexEdges.set(id, new Set());
      vertexFaces.set(id, new Set());
    } else {
      const vertex = vertices[vertexLookup.get(key)];

      if (!vertex.sourceIndices.includes(sourceIndex)) {
        vertex.sourceIndices.push(sourceIndex);
      }
    }

    return vertexLookup.get(key);
  }

  // 孤立頂点も含めて登録
  for (let i = 0; i < position.count; i++) {
    getVertexId(i);
  }

  function getEdgeId(a, b) {
    const start = Math.min(a, b);
    const end = Math.max(a, b);
    const key = `${start}:${end}`;

    if (!edgeLookup.has(key)) {
      const id = edges.length;

      edgeLookup.set(key, id);

      edges.push({
        id,
        vertices: [start, end],
        faces: []
      });
    }

    return edgeLookup.get(key);
  }

  const elementCount = index
    ? index.count
    : position.count;

  const triangleCount = Math.floor(elementCount / 3);

  for (let i = 0; i < triangleCount; i++) {
    const sourceIndices = index
      ? [
          index.getX(i * 3),
          index.getX(i * 3 + 1),
          index.getX(i * 3 + 2)
        ]
      : [
          i * 3,
          i * 3 + 1,
          i * 3 + 2
        ];

    const vertexIds = sourceIndices.map(getVertexId);

    const face = {
      id: faces.length,
      triangleIndex: i,
      vertices: vertexIds,
      edges: []
    };

    const edgePairs = [
      [vertexIds[0], vertexIds[1]],
      [vertexIds[1], vertexIds[2]],
      [vertexIds[2], vertexIds[0]]
    ];

    for (const vertexId of vertexIds) {
      vertexFaces.get(vertexId).add(face.id);
    }

    for (const [a, b] of edgePairs) {
      const edgeId = getEdgeId(a, b);

      face.edges.push(edgeId);

      const edge = edges[edgeId];

      if (!edge.faces.includes(face.id)) {
        edge.faces.push(face.id);
      }

      vertexEdges.get(a).add(edgeId);
      vertexEdges.get(b).add(edgeId);
    }

    faces.push(face);
  }

  function getVertex(id) {
    return vertices[id] ?? null;
  }

  function getEdge(id) {
    return edges[id] ?? null;
  }

  function getFace(id) {
    return faces[id] ?? null;
  }

  function getConnectedEdges(vertexId) {
    return [...(vertexEdges.get(vertexId) ?? [])]
      .map(id => edges[id]);
  }

  function getConnectedFaces(vertexId) {
    return [...(vertexFaces.get(vertexId) ?? [])]
      .map(id => faces[id]);
  }

  function getAdjacentFaces(edgeId) {
    const edge = getEdge(edgeId);

    if (!edge) return [];

    return edge.faces.map(id => faces[id]);
  }

  return {
    vertices,
    edges,
    faces,
    getVertex,
    getEdge,
    getFace,
    getConnectedEdges,
    getConnectedFaces,
    getAdjacentFaces
  };
}
