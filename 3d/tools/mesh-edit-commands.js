
import * as THREE from "three";

export function createMeshEditCommands({
  mesh,
  getTopology,
  getSelection,
  onChange = () => {}
}) {
  if (!mesh?.isMesh) {
    throw new Error("編集対象のメッシュが必要です。");
  }

  function getData() {
    const topology = getTopology?.();
    const selection = getSelection?.();

    if (!topology || !selection) return null;

    return { topology, selection };
  }

  function getTriangles() {
    const geometry = mesh.geometry;
    const position = geometry?.attributes?.position;

    if (!position) return [];

    const index = geometry.index;
    const count = index ? index.count : position.count;
    const triangles = [];

    for (let i = 0; i + 2 < count; i += 3) {
      const ids = index
        ? [
            index.getX(i),
            index.getX(i + 1),
            index.getX(i + 2)
          ]
        : [i, i + 1, i + 2];

      triangles.push(
        ids.map(id => new THREE.Vector3(
          position.getX(id),
          position.getY(id),
          position.getZ(id)
        ))
      );
    }

    return triangles;
  }

  function rebuildGeometry(triangles) {
    const positions = [];

    for (const triangle of triangles) {
      for (const vertex of triangle) {
        positions.push(
          vertex.x,
          vertex.y,
          vertex.z
        );
      }
    }

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );

    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    const previous = mesh.geometry;
    mesh.geometry = geometry;

    previous.dispose();

    onChange();
  }

  function midpoint(a, b) {
    return a.clone().add(b).multiplyScalar(0.5);
  }

  // 選択した辺を細分化
  function subdivideSelectedEdges() {
    const data = getData();

    if (!data) return false;

    const { topology, selection } = data;
    const selectedEdges = new Set(selection.edges || []);

    if (selectedEdges.size === 0) return false;

    const triangles = getTriangles();
    const edgeMidpoints = new Map();

    for (const edgeId of selectedEdges) {
      const edge = topology.getEdge(edgeId);

      if (!edge) continue;

      const vertexA = topology.getVertex(edge.vertices[0]);
      const vertexB = topology.getVertex(edge.vertices[1]);

      if (!vertexA || !vertexB) continue;

      const a = new THREE.Vector3(
        vertexA.position.x,
        vertexA.position.y,
        vertexA.position.z
      );

      const b = new THREE.Vector3(
        vertexB.position.x,
        vertexB.position.y,
        vertexB.position.z
      );

      edgeMidpoints.set(edgeId, midpoint(a, b));
    }

    if (edgeMidpoints.size === 0) return false;

    const result = [];

    for (let i = 0; i < triangles.length; i++) {
      const face = topology.getFace(i);
      const triangle = triangles[i];

      if (!face) {
        result.push(triangle);
        continue;
      }

      const hasSelectedEdge = face.edges.some(
        edgeId => edgeMidpoints.has(edgeId)
      );

      if (!hasSelectedEdge) {
        result.push(triangle);
        continue;
      }

      const points = [
        triangle[0],
        triangle[1],
        triangle[2]
      ];

      const boundary = [];

      for (let j = 0; j < 3; j++) {
        const start = points[j];
        const edgeId = face.edges[j];

        boundary.push(start.clone());

        if (edgeMidpoints.has(edgeId)) {
          boundary.push(
            edgeMidpoints.get(edgeId).clone()
          );
        }
      }

      const center = new THREE.Vector3();

      for (const point of boundary) {
        center.add(point);
      }

      center.divideScalar(boundary.length);

      for (let j = 0; j < boundary.length; j++) {
        const next = (j + 1) % boundary.length;

        result.push([
          boundary[j].clone(),
          boundary[next].clone(),
          center.clone()
        ]);
      }
    }

    if (result.length === triangles.length) {
      return false;
    }

    rebuildGeometry(result);
    return true;
  }

  // 選択した三角形の面を押し出す
  function extrudeSelectedFaces(distance = 0.2) {
    const data = getData();

    if (!data) return false;

    const { selection } = data;
    const triangles = getTriangles();

    const selectedFaces = new Set(
      (selection.faces || []).filter(
        id => Number.isInteger(id) &&
          id >= 0 &&
          id < triangles.length
      )
    );

    if (selectedFaces.size === 0) return false;

    const result = [];

    for (let i = 0; i < triangles.length; i++) {
      const triangle = triangles[i];

      if (!selectedFaces.has(i)) {
        result.push(triangle);
        continue;
      }

      const [a, b, c] = triangle;

      const normal = b.clone()
        .sub(a)
        .cross(c.clone().sub(a))
        .normalize();

      const offset = normal.multiplyScalar(distance);

      const A = a.clone().add(offset);
      const B = b.clone().add(offset);
      const C = c.clone().add(offset);

      // 押し出した上面
      result.push([A, B, C]);

      // 側面
      result.push([a.clone(), b.clone(), B.clone()]);
      result.push([a.clone(), B.clone(), A.clone()]);

      result.push([b.clone(), c.clone(), C.clone()]);
      result.push([b.clone(), C.clone(), B.clone()]);

      result.push([c.clone(), a.clone(), A.clone()]);
      result.push([c.clone(), A.clone(), C.clone()]);
    }

    rebuildGeometry(result);
    return true;
  }

  // 選択した頂点・辺・面に接続する面を削除
  function deleteSelection() {
    const data = getData();

    if (!data) return false;

    const { topology, selection } = data;
    const triangles = getTriangles();

    const deletedFaces = new Set(
      (selection.faces || []).filter(
        id => Number.isInteger(id) &&
          id >= 0 &&
          id < triangles.length
      )
    );

    for (const edgeId of selection.edges || []) {
      const edge = topology.getEdge(edgeId);

      if (!edge) continue;

      for (const faceId of edge.faces) {
        deletedFaces.add(faceId);
      }
    }

    for (const vertexId of selection.vertices || []) {
      const connectedFaces =
        topology.getConnectedFaces(vertexId);

      for (const face of connectedFaces) {
        deletedFaces.add(face.id);
      }
    }

    if (deletedFaces.size === 0) return false;

    const result = triangles.filter(
      (_, index) => !deletedFaces.has(index)
    );

    if (result.length === triangles.length) {
      return false;
    }

    rebuildGeometry(result);
    return true;
  }

  return {
    subdivideSelectedEdges,
    extrudeSelectedFaces,
    deleteSelection
  };
}
