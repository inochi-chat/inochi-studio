
import * as THREE from "three";

export function createMeshVisuals({
  mesh,
  topology
}) {
  if (!mesh?.isMesh || !topology) {
    throw new Error("メッシュとトポロジーが必要です。");
  }

  const group = new THREE.Group();
  group.name = "MeshEditVisuals";

  mesh.add(group);

  let mode = "vertex";

  const selected = {
    vertices: new Set(),
    edges: new Set(),
    faces: new Set()
  };

  function makeColorAttribute(count, color) {
    const values = [];

    for (let i = 0; i < count; i++) {
      values.push(color.r, color.g, color.b);
    }

    return new THREE.Float32BufferAttribute(values, 3);
  }

  // 頂点
  const vertexGeometry = new THREE.BufferGeometry();
  const vertexPositions = [];

  for (const vertex of topology.vertices) {
    vertexPositions.push(
      vertex.position.x,
      vertex.position.y,
      vertex.position.z
    );
  }

  vertexGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertexPositions, 3)
  );

  vertexGeometry.setAttribute(
    "color",
    makeColorAttribute(
      topology.vertices.length,
      new THREE.Color(0xff922e)
    )
  );

  const vertexMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 15,
    sizeAttenuation: false,
    vertexColors: true,
    depthTest: true,
    transparent: true
  });

  const vertexPoints = new THREE.Points(
    vertexGeometry,
    vertexMaterial
  );

  vertexPoints.renderOrder = 20;
  group.add(vertexPoints);

  // 辺
  const edgePositions = [];

  for (const edge of topology.edges) {
    const a = topology.getVertex(edge.vertices[0]);
    const b = topology.getVertex(edge.vertices[1]);

    edgePositions.push(
      a.position.x, a.position.y, a.position.z,
      b.position.x, b.position.y, b.position.z
    );
  }

  const edgeGeometry = new THREE.BufferGeometry();

  edgeGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(edgePositions, 3)
  );

  edgeGeometry.setAttribute(
    "color",
    makeColorAttribute(
      topology.edges.length * 2,
      new THREE.Color(0x65c8ff)
    )
  );

  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    vertexColors: true,
    depthTest: true,
    transparent: true
  });

  const edgeLines = new THREE.LineSegments(
    edgeGeometry,
    edgeMaterial
  );

  edgeLines.renderOrder = 21;
  group.add(edgeLines);

  // 面
  const facePositions = [];

  for (const face of topology.faces) {
    const points = face.vertices.map(id =>
      topology.getVertex(id).position
    );

    facePositions.push(
      points[0].x, points[0].y, points[0].z,
      points[1].x, points[1].y, points[1].z,
      points[2].x, points[2].y, points[2].z
    );
  }

  const faceGeometry = new THREE.BufferGeometry();

  faceGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(facePositions, 3)
  );

  faceGeometry.setAttribute(
    "color",
    makeColorAttribute(
      topology.faces.length * 3,
      new THREE.Color(0x5865d9)
    )
  );

  faceGeometry.computeVertexNormals();

  const faceMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    vertexColors: true,
    side: THREE.FrontSide,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    depthTest: true
  });

  const faceMesh = new THREE.Mesh(
    faceGeometry,
    faceMaterial
  );

  faceMesh.renderOrder = 19;
  group.add(faceMesh);

  function setMode(nextMode) {
    if (!["vertex", "edge", "face"].includes(nextMode)) {
      return;
    }

    mode = nextMode;
    updateVisibility();
  }

  function updateVisibility() {
    vertexPoints.visible = mode === "vertex";
    edgeLines.visible = mode === "edge";
    faceMesh.visible = mode === "face";
  }

  function updateColorAttribute(geometry, ids, total, baseColor) {
    const attribute = geometry.attributes.color;

    for (let i = 0; i < total; i++) {
      const color = ids.has(i)
        ? new THREE.Color(0x35e6a1)
        : baseColor;

      const verticesPerItem = geometry === edgeGeometry ? 2 :
        geometry === faceGeometry ? 3 : 1;

      for (let j = 0; j < verticesPerItem; j++) {
        attribute.setXYZ(
          i * verticesPerItem + j,
          color.r,
          color.g,
          color.b
        );
      }
    }

    attribute.needsUpdate = true;
  }

  function updateSelectionColors() {
    updateColorAttribute(
      vertexGeometry,
      selected.vertices,
      topology.vertices.length,
      new THREE.Color(0xff922e)
    );

    updateColorAttribute(
      edgeGeometry,
      selected.edges,
      topology.edges.length,
      new THREE.Color(0x65c8ff)
    );

    updateColorAttribute(
      faceGeometry,
      selected.faces,
      topology.faces.length,
      new THREE.Color(0x5865d9)
    );
  }

  function setSelection(type, ids) {
    if (!selected[type]) return;

    selected[type] = new Set(ids);
    updateSelectionColors();
  }

  function clearSelection() {
    selected.vertices.clear();
    selected.edges.clear();
    selected.faces.clear();

    updateSelectionColors();
  }

  function dispose() {
    mesh.remove(group);

    vertexGeometry.dispose();
    vertexMaterial.dispose();

    edgeGeometry.dispose();
    edgeMaterial.dispose();

    faceGeometry.dispose();
    faceMaterial.dispose();
  }

  updateVisibility();
  updateSelectionColors();

  return {
    group,
    setMode,
    setSelection,
    clearSelection,
    dispose
  };
}
