
import * as THREE from "three";

export function createMeshVisuals({ mesh, topology }) {
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

  const colors = {
    vertex: new THREE.Color(0xffa044),
    edge: new THREE.Color(0x62caff),
    face: new THREE.Color(0x526bd9),
    selected: new THREE.Color(0x35f0a0),
    selectedEdge: new THREE.Color(0xffdf55),
    selectedFace: new THREE.Color(0x24d99a)
  };

  function createGeometry(positions) {
    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );

    return geometry;
  }

  function createColorAttribute(count, color) {
    const values = [];

    for (let i = 0; i < count; i++) {
      values.push(color.r, color.g, color.b);
    }

    return new THREE.Float32BufferAttribute(values, 3);
  }

  function addColors(geometry, count, color) {
    geometry.setAttribute(
      "color",
      createColorAttribute(count, color)
    );
  }

  // -------------------------
  // 頂点
  // -------------------------

  const vertexPositions = [];

  for (const vertex of topology.vertices) {
    vertexPositions.push(
      vertex.position.x,
      vertex.position.y,
      vertex.position.z
    );
  }

  const vertexGeometry = createGeometry(vertexPositions);

  addColors(
    vertexGeometry,
    topology.vertices.length,
    colors.vertex
  );

  const vertexMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 13,
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

  // 選択頂点の強調表示

  const selectedVertexGeometry = createGeometry([]);

  const selectedVertexMaterial = new THREE.PointsMaterial({
    color: colors.selected,
    size: 24,
    sizeAttenuation: false,
    depthTest: false,
    transparent: true
  });

  const selectedVertexPoints = new THREE.Points(
    selectedVertexGeometry,
    selectedVertexMaterial
  );

  selectedVertexPoints.renderOrder = 30;
  group.add(selectedVertexPoints);

  // -------------------------
  // 辺
  // -------------------------

  const edgePositions = [];

  for (const edge of topology.edges) {
    const a = topology.getVertex(edge.vertices[0]);
    const b = topology.getVertex(edge.vertices[1]);

    edgePositions.push(
      a.position.x, a.position.y, a.position.z,
      b.position.x, b.position.y, b.position.z
    );
  }

  const edgeGeometry = createGeometry(edgePositions);

  addColors(
    edgeGeometry,
    topology.edges.length * 2,
    colors.edge
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

  // 選択辺の強調表示

  const selectedEdgeGeometry = createGeometry([]);

  const selectedEdgeMaterial = new THREE.LineBasicMaterial({
    color: colors.selectedEdge,
    linewidth: 3,
    depthTest: false,
    transparent: true
  });

  const selectedEdgeLines = new THREE.LineSegments(
    selectedEdgeGeometry,
    selectedEdgeMaterial
  );

  selectedEdgeLines.renderOrder = 31;
  group.add(selectedEdgeLines);

  // -------------------------
  // 面
  // -------------------------

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

  const faceGeometry = createGeometry(facePositions);

  addColors(
    faceGeometry,
    topology.faces.length * 3,
    colors.face
  );

  faceGeometry.computeVertexNormals();

  const faceMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    vertexColors: true,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    depthTest: true
  });

  const faceMesh = new THREE.Mesh(
    faceGeometry,
    faceMaterial
  );

  faceMesh.renderOrder = 19;
  group.add(faceMesh);

  // 選択面の強調表示

  const selectedFaceGeometry = createGeometry([]);

  const selectedFaceMaterial = new THREE.MeshBasicMaterial({
    color: colors.selectedFace,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
    depthTest: false
  });

  const selectedFaceMesh = new THREE.Mesh(
    selectedFaceGeometry,
    selectedFaceMaterial
  );

  selectedFaceMesh.renderOrder = 29;
  group.add(selectedFaceMesh);

  // -------------------------
  // 選択表示の更新
  // -------------------------

  function updateVertexColors() {
    const attribute = vertexGeometry.attributes.color;

    for (let i = 0; i < topology.vertices.length; i++) {
      const color = selected.vertices.has(i)
        ? colors.selected
        : colors.vertex;

      attribute.setXYZ(i, color.r, color.g, color.b);
    }

    attribute.needsUpdate = true;
  }

  function updateEdgeColors() {
    const attribute = edgeGeometry.attributes.color;

    for (let i = 0; i < topology.edges.length; i++) {
      const color = selected.edges.has(i)
        ? colors.selectedEdge
        : colors.edge;

      attribute.setXYZ(i * 2, color.r, color.g, color.b);
      attribute.setXYZ(i * 2 + 1, color.r, color.g, color.b);
    }

    attribute.needsUpdate = true;
  }

  function updateSelectedVertexOverlay() {
    const positions = [];

    for (const id of selected.vertices) {
      const vertex = topology.getVertex(id);

      if (!vertex) continue;

      positions.push(
        vertex.position.x,
        vertex.position.y,
        vertex.position.z
      );
    }

    selectedVertexGeometry.dispose();

    selectedVertexPoints.geometry = createGeometry(positions);
  }

  function updateSelectedEdgeOverlay() {
    const positions = [];

    for (const id of selected.edges) {
      const edge = topology.edges[id];

      if (!edge) continue;

      const a = topology.getVertex(edge.vertices[0]);
      const b = topology.getVertex(edge.vertices[1]);

      if (!a || !b) continue;

      positions.push(
        a.position.x, a.position.y, a.position.z,
        b.position.x, b.position.y, b.position.z
      );
    }

    selectedEdgeGeometry.dispose();

    selectedEdgeLines.geometry = createGeometry(positions);
  }

  function updateSelectedFaceOverlay() {
    const positions = [];

    for (const id of selected.faces) {
      const face = topology.faces[id];

      if (!face) continue;

      const points = face.vertices.map(vertexId =>
        topology.getVertex(vertexId)
      );

      if (points.some(point => !point)) continue;

      positions.push(
        points[0].position.x,
        points[0].position.y,
        points[0].position.z,

        points[1].position.x,
        points[1].position.y,
        points[1].position.z,

        points[2].position.x,
        points[2].position.y,
        points[2].position.z
      );
    }

    selectedFaceGeometry.dispose();

    selectedFaceMesh.geometry = createGeometry(positions);
    selectedFaceMesh.geometry.computeVertexNormals();
  }

  function updateSelectionVisuals() {
    updateVertexColors();
    updateEdgeColors();

    updateSelectedVertexOverlay();
    updateSelectedEdgeOverlay();
    updateSelectedFaceOverlay();
  }

  // -------------------------
  // 表示モード
  // -------------------------

  function setMode(nextMode) {
    if (!["vertex", "edge", "face"].includes(nextMode)) {
      return;
    }

    mode = nextMode;
    updateVisibility();
  }

  function updateVisibility() {
    vertexPoints.visible = mode === "vertex";
    selectedVertexPoints.visible = mode === "vertex";

    edgeLines.visible = mode === "edge";
    selectedEdgeLines.visible = mode === "edge";

    faceMesh.visible = mode === "face";
    selectedFaceMesh.visible = mode === "face";
  }

  // -------------------------
  // 選択管理
  // -------------------------

  function setSelection(type, ids) {
    if (!selected[type]) return;

    selected[type] = new Set(ids);
    updateSelectionVisuals();
  }

  function clearSelection() {
    selected.vertices.clear();
    selected.edges.clear();
    selected.faces.clear();

    updateSelectionVisuals();
  }

  // -------------------------
  // 解放
  // -------------------------

  function dispose() {
    mesh.remove(group);

    vertexGeometry.dispose();
    vertexMaterial.dispose();

    selectedVertexPoints.geometry.dispose();
    selectedVertexMaterial.dispose();

    edgeGeometry.dispose();
    edgeMaterial.dispose();

    selectedEdgeLines.geometry.dispose();
    selectedEdgeMaterial.dispose();

    faceGeometry.dispose();
    faceMaterial.dispose();

    selectedFaceMesh.geometry.dispose();
    selectedFaceMaterial.dispose();
  }

  updateVisibility();
  updateSelectionVisuals();

  return {
    group,
    setMode,
    setSelection,
    clearSelection,
    dispose
  };
}
