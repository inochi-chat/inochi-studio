
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

      const boundary = [];

      for (let j = 0; j < 3; j++) {
        boundary.push(triangle[j].clone());

        const edgeId = face.edges[j];

        if (edgeMidpoints.has(edgeId)) {
          boundary.push(edgeMidpoints.get(edgeId).clone());
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

  // 選択した面をまとまりとして押し出す
  function extrudeSelectedFaces(distance = 0.2) {
    const data = getData();

    if (!data || !Number.isFinite(distance)) {
      return false;
    }

    const { topology, selection } = data;
    const triangles = getTriangles();

    const selectedFaces = new Set(
      (selection.faces || []).filter(
        id => Number.isInteger(id) &&
          id >= 0 &&
          id < triangles.length &&
          topology.getFace(id)
      )
    );

    if (selectedFaces.size === 0) return false;

    // 選択面ごとの法線を集める
    const vertexNormals = new Map();

    for (const faceId of selectedFaces) {
      const face = topology.getFace(faceId);
      const triangle = triangles[faceId];

      if (!face || !triangle) continue;

      const [a, b, c] = triangle;

      const normal = b.clone()
        .sub(a)
        .cross(c.clone().sub(a));

      if (normal.lengthSq() < 0.0000001) continue;

      normal.normalize();

      for (const vertexId of face.vertices) {
        if (!vertexNormals.has(vertexId)) {
          vertexNormals.set(
            vertexId,
            new THREE.Vector3()
          );
        }

        vertexNormals.get(vertexId).add(normal);
      }
    }

    if (vertexNormals.size === 0) return false;

    // 選択範囲内の頂点を移動させる
    for (const normal of vertexNormals.values()) {
      normal.normalize();
    }

    function getMovedVertex(vertexId) {
      const vertex = topology.getVertex(vertexId);
      const normal = vertexNormals.get(vertexId);

      if (!vertex || !normal) return null;

      return new THREE.Vector3(
        vertex.position.x,
        vertex.position.y,
        vertex.position.z
      ).addScaledVector(normal, distance);
    }

    const result = [];

    // 選択されていない面はそのまま残す
    // 選択された面は移動後の位置に作り直す
    for (let i = 0; i < triangles.length; i++) {
      const triangle = triangles[i];

      if (!selectedFaces.has(i)) {
        result.push(triangle);
        continue;
      }

      const face = topology.getFace(i);

      if (!face) continue;

      const moved = face.vertices.map(getMovedVertex);

      if (moved.some(vertex => !vertex)) {
        result.push(triangle);
        continue;
      }

      result.push(moved);
    }

    // 選択範囲の外周だけ側面を作る
    for (const faceId of selectedFaces) {
      const face = topology.getFace(faceId);

      if (!face) continue;

      for (let j = 0; j < 3; j++) {
        const edgeId = face.edges[j];
        const edge = topology.getEdge(edgeId);

        if (!edge) continue;

        const selectedAdjacentFaces = edge.faces.filter(
          id => selectedFaces.has(id)
        );

        // 選択面が2つ以上接している辺には壁を作らない
        if (selectedAdjacentFaces.length !== 1) {
          continue;
        }

        const startId = face.vertices[j];
        const endId = face.vertices[(j + 1) % 3];

        const start = topology.getVertex(startId);
        const end = topology.getVertex(endId);

        const movedStart = getMovedVertex(startId);
        const movedEnd = getMovedVertex(endId);

        if (
          !start ||
          !end ||
          !movedStart ||
          !movedEnd
        ) {
          continue;
        }

        const a = new THREE.Vector3(
          start.position.x,
          start.position.y,
          start.position.z
        );

        const b = new THREE.Vector3(
          end.position.x,
          end.position.y,
          end.position.z
        );

        // 外周の側面を2枚の三角形で作る
        result.push([
          a.clone(),
          b.clone(),
          movedEnd.clone()
        ]);

        result.push([
          a.clone(),
          movedEnd.clone(),
          movedStart.clone()
        ]);
      }
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
