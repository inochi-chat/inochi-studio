
import * as THREE from "three";

export function createMeshPicker({
  camera,
  renderer,
  mesh,
  topology,
  visuals,
  meshEditor = null,
  onSelectionChange = () => {}
}) {
  if (!camera || !renderer || !mesh || !topology || !visuals) {
    throw new Error("メッシュ選択に必要な設定が不足しています。");
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  let mode = "vertex";
  let multiSelect = false;
  let pointerStart = null;

  const selected = {
    vertices: new Set(),
    edges: new Set(),
    faces: new Set()
  };

  function getActiveSet() {
  if (mode === "vertex") return selected.vertices;
  if (mode === "edge") return selected.edges;
  if (mode === "face") return selected.faces;
  return null;
}

  function getWorldPosition(vertexId) {
    const vertex = topology.getVertex(vertexId);
    if (!vertex) return null;

    return mesh.localToWorld(
      new THREE.Vector3(
        vertex.position.x,
        vertex.position.y,
        vertex.position.z
      )
    );
  }

  function findVertex() {
    const candidates = topology.vertices.map(vertex => ({
      id: vertex.id,
      position: getWorldPosition(vertex.id)
    }));

    const positions = [];

    for (const candidate of candidates) {
      positions.push(
        candidate.position.x,
        candidate.position.y,
        candidate.position.z
      );
    }

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );

    const points = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({ size: 12 })
    );

    const worldPosition = mesh.getWorldPosition(new THREE.Vector3());

    raycaster.params.Points.threshold = Math.max(
      0.015,
      camera.position.distanceTo(worldPosition) * 0.018
    );

    const hits = raycaster.intersectObject(points);

    geometry.dispose();
    points.material.dispose();

    return hits.length
      ? candidates[hits[0].index].id
      : null;
  }

  function findEdge() {
    const threshold = 0.045;
    let bestId = null;
    let bestDistance = Infinity;

    for (const edge of topology.edges) {
      const a = getWorldPosition(edge.vertices[0]);
      const b = getWorldPosition(edge.vertices[1]);

      if (!a || !b) continue;

      const screenA = new THREE.Vector2(
        a.clone().project(camera).x,
        a.clone().project(camera).y
      );

      const screenB = new THREE.Vector2(
        b.clone().project(camera).x,
        b.clone().project(camera).y
      );

      const segment = screenB.clone().sub(screenA);
      const lengthSquared = segment.lengthSq();

      const t = lengthSquared === 0
        ? 0
        : THREE.MathUtils.clamp(
            pointer.clone().sub(screenA).dot(segment) /
              lengthSquared,
            0,
            1
          );

      const closest = screenA.clone().add(
        segment.multiplyScalar(t)
      );

      const distance = closest.distanceTo(pointer);

      if (distance < threshold && distance < bestDistance) {
        bestDistance = distance;
        bestId = edge.id;
      }
    }

    return bestId;
  }

  function findFace() {
    const hits = raycaster.intersectObject(mesh, false);

    if (!hits.length || hits[0].faceIndex == null) {
      return null;
    }

    const face = topology.getFace(hits[0].faceIndex);

    return face ? face.id : null;
  }

  function findTarget() {
    if (mode === "vertex") return findVertex();
    if (mode === "edge") return findEdge();
    if (mode === "face") return findFace();

    return null;
  }

  function updateVisuals() {
    visuals.setSelection("vertices", [...selected.vertices]);
    visuals.setSelection("edges", [...selected.edges]);
    visuals.setSelection("faces", [...selected.faces]);

    if (meshEditor) {
      meshEditor.setSelectedVertices(
        [...selected.vertices]
      );
    }
  }

  function notifySelection() {
    onSelectionChange({
      mode,
      vertices: [...selected.vertices],
      edges: [...selected.edges],
      faces: [...selected.faces]
    });
  }

  function select(id) {
    if (id == null) return;

    const activeSet = getActiveSet();

    if (!multiSelect) {
      activeSet.clear();
    }

    if (multiSelect && activeSet.has(id)) {
      activeSet.delete(id);
    } else {
      activeSet.add(id);
    }

    updateVisuals();
    notifySelection();
  }

  function clearSelection() {
    selected.vertices.clear();
    selected.edges.clear();
    selected.faces.clear();

    updateVisuals();
    notifySelection();
  }

  function setMode(nextMode) {
    if (!["vertex", "edge", "face"].includes(nextMode)) {
      return;
    }

    mode = nextMode;

    clearSelection();
    visuals.setMode(mode);
  }

  function setMultiSelect(enabled) {
    multiSelect = Boolean(enabled);

    meshEditor?.setMultiSelect(multiSelect);
  }

  function handlePointerDown(event) {
    if (event.button !== undefined && event.button !== 0) {
      return;
    }

    pointerStart = {
      x: event.clientX,
      y: event.clientY
    };
  }

  function handlePointerUp(event) {
    if (!pointerStart) return;

    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;

    pointerStart = null;

    if (Math.hypot(dx, dy) > 8) return;

    const rect = renderer.domElement.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    raycaster.setFromCamera(pointer, camera);

    const id = findTarget();

    if (id !== null) {
      select(id);
    }
  }

  function handlePointerCancel() {
    pointerStart = null;
  }

  const element = renderer.domElement;

  element.addEventListener("pointerdown", handlePointerDown);
  element.addEventListener("pointerup", handlePointerUp);
  element.addEventListener("pointercancel", handlePointerCancel);

  function dispose() {
    element.removeEventListener("pointerdown", handlePointerDown);
    element.removeEventListener("pointerup", handlePointerUp);
    element.removeEventListener("pointercancel", handlePointerCancel);
  }

  return {
    setMode,
    setMultiSelect,
    clearSelection,
    getSelection: () => ({
      vertices: [...selected.vertices],
      edges: [...selected.edges],
      faces: [...selected.faces]
    }),
    dispose
  };
}
