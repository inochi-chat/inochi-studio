
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

  const vertexMaterial = new THREE.PointsMaterial({
    color: 0xff922e,
    size: 12,
    sizeAttenuation: false,
    depthTest: false
  });

  const vertexPoints = new THREE.Points(
    vertexGeometry,
    vertexMaterial
  );

  vertexPoints.renderOrder = 20;
  group.add(vertexPoints);

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

  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0x65c8ff,
    depthTest: false
  });

  const edgeLines = new THREE.LineSegments(
    edgeGeometry,
    edgeMaterial
  );

  edgeLines.renderOrder = 21;
  group.add(edgeLines);

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

  faceGeometry.computeVertexNormals();

  const faceMaterial = new THREE.MeshBasicMaterial({
    color: 0x5865d9,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    depthTest: false
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

  function setSelection(type, ids) {
    if (!selected[type]) return;

    selected[type] = new Set(ids);

    updateSelectionColors();
  }

  function updateSelectionColors() {
    const vertexColors = [];

    for (let i = 0; i < topology.vertices.length; i++) {
      const color = selected.vertices.has(i)
        ? new THREE.Color(0x35e6a1)
        : new THREE.Color(0xff922e);

      vertexColors.push(color.r, color.g, color.b);
    }

    vertexGeometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(vertexColors, 3)
    );

    vertexMaterial.vertexColors = true;
    vertexMaterial.needsUpdate = true;

    const edgeColors = [];

    for (let i = 0; i < topology.edges.length; i++) {
      const color = selected.edges.has(i)
        ? new THREE.Color(0x35e6a1)
        : new THREE.Color(0x65c8ff);

      for (let j = 0; j < 2; j++) {
        edgeColors.push(color.r, color.g, color.b);
      }
    }

    edgeGeometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(edgeColors, 3)
    );

    edgeMaterial.vertexColors = true;
    edgeMaterial.needsUpdate = true;

    const faceColors = [];

    for (let i = 0; i < topology.faces.length; i++) {
      const color = selected.faces.has(i)
        ? new THREE.Color(0x35e6a1)
        : new THREE.Color(0x5865d9);

      for (let j = 0; j < 3; j++) {
        faceColors.push(color.r, color.g, color.b);
      }
    }

    faceGeometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(faceColors, 3)
    );

    faceMaterial.vertexColors = true;
    faceMaterial.needsUpdate = true;
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
