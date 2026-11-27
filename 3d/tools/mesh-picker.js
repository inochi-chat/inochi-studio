
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
  const element = renderer.domElement;

  let mode = "vertex";
  let multiSelect = false;
  let pointerStart = null;

  const selected = {
    vertices: new Set(),
    edges: new Set(),
    faces: new Set()
  };

  const selectionBox = document.createElement("div");

  Object.assign(selectionBox.style, {
    position: "fixed",
    display: "none",
    pointerEvents: "none",
    zIndex: "99999",
    border: "2px solid #42a5ff",
    background: "rgba(66, 165, 255, 0.16)",
    boxSizing: "border-box",
    borderRadius: "2px"
  });

  document.body.appendChild(selectionBox);

  function getRect(a, b) {
    return {
      left: Math.min(a.x, b.x),
      right: Math.max(a.x, b.x),
      top: Math.min(a.y, b.y),
      bottom: Math.max(a.y, b.y)
    };
  }

  function updateSelectionBox(point) {
    const rect = getRect(pointerStart, point);

    selectionBox.style.display = "block";
    selectionBox.style.left = `${rect.left}px`;
    selectionBox.style.top = `${rect.top}px`;
    selectionBox.style.width = `${rect.right - rect.left}px`;
    selectionBox.style.height = `${rect.bottom - rect.top}px`;
  }

  function hideSelectionBox() {
    selectionBox.style.display = "none";
  }

  function getActiveSet() {
    if (mode === "vertex") return selected.vertices;
    if (mode === "edge") return selected.edges;
    if (mode === "face") return selected.faces;
    return null;
  }

  function updateVisuals() {
    visuals.setSelection("vertices", [...selected.vertices]);
    visuals.setSelection("edges", [...selected.edges]);
    visuals.setSelection("faces", [...selected.faces]);

    if (meshEditor) {
      meshEditor.setSelectedVertices([...selected.vertices]);
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

  function clearSelection() {
    selected.vertices.clear();
    selected.edges.clear();
    selected.faces.clear();
    updateVisuals();
    notifySelection();
  }

  function select(id) {
    if (id == null) return;

    const activeSet = getActiveSet();
    if (!activeSet) return;

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

  function getWorldPosition(vertexId) {
    const vertex = topology.getVertex(vertexId);
    if (!vertex) return null;

    mesh.updateWorldMatrix(true, false);

    return mesh.localToWorld(
      new THREE.Vector3(
        vertex.position.x,
        vertex.position.y,
        vertex.position.z
      )
    );
  }

  function getScreenPosition(vertexId) {
    const world = getWorldPosition(vertexId);
    if (!world) return null;

    const projected = world.clone().project(camera);

    if (projected.z < -1 || projected.z > 1) {
      return null;
    }

    const rect = element.getBoundingClientRect();

    return {
      x: rect.left + (projected.x + 1) * rect.width / 2,
      y: rect.top + (1 - projected.y) * rect.height / 2
    };
  }

  function isInside(point, rect) {
    return Boolean(
      point &&
      point.x >= rect.left &&
      point.x <= rect.right &&
      point.y >= rect.top &&
      point.y <= rect.bottom
    );
  }

  function orientation(a, b, c) {
    return (
      (b.x - a.x) * (c.y - a.y) -
      (b.y - a.y) * (c.x - a.x)
    );
  }

  function segmentsIntersect(a, b, c, d) {
    const o1 = orientation(a, b, c);
    const o2 = orientation(a, b, d);
    const o3 = orientation(c, d, a);
    const o4 = orientation(c, d, b);

    return (
      ((o1 >= 0 && o2 <= 0) || (o1 <= 0 && o2 >= 0)) &&
      ((o3 >= 0 && o4 <= 0) || (o3 <= 0 && o4 >= 0))
    );
  }

  function segmentIntersectsRect(a, b, rect) {
    if (!a || !b) return false;

    if (isInside(a, rect) || isInside(b, rect)) {
      return true;
    }

    const tl = { x: rect.left, y: rect.top };
    const tr = { x: rect.right, y: rect.top };
    const bl = { x: rect.left, y: rect.bottom };
    const br = { x: rect.right, y: rect.bottom };

    return (
      segmentsIntersect(a, b, tl, tr) ||
      segmentsIntersect(a, b, tr, br) ||
      segmentsIntersect(a, b, br, bl) ||
      segmentsIntersect(a, b, bl, tl)
    );
  }

  function pointInTriangle(p, a, b, c) {
    const d1 = orientation(p, a, b);
    const d2 = orientation(p, b, c);
    const d3 = orientation(p, c, a);

    const hasNegative = d1 < 0 || d2 < 0 || d3 < 0;
    const hasPositive = d1 > 0 || d2 > 0 || d3 > 0;

    return !(hasNegative && hasPositive);
  }

  function triangleIntersectsRect(points, rect) {
    if (points.some(p => !p)) return false;

    if (points.some(p => isInside(p, rect))) {
      return true;
    }

    const center = {
      x: (rect.left + rect.right) / 2,
      y: (rect.top + rect.bottom) / 2
    };

    if (pointInTriangle(center, points[0], points[1], points[2])) {
      return true;
    }

    if (
      segmentIntersectsRect(points[0], points[1], rect) ||
      segmentIntersectsRect(points[1], points[2], rect) ||
      segmentIntersectsRect(points[2], points[0], rect)
    ) {
      return true;
    }

    const corners = [
      { x: rect.left, y: rect.top },
      { x: rect.right, y: rect.top },
      { x: rect.left, y: rect.bottom },
      { x: rect.right, y: rect.bottom }
    ];

    return corners.some(p =>
      pointInTriangle(p, points[0], points[1], points[2])
    );
  }

  function findVertex() {
    const candidates = topology.vertices.map(vertex => ({
      id: vertex.id,
      position: getWorldPosition(vertex.id)
    })).filter(item => item.position);

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

    const material = new THREE.PointsMaterial({ size: 12 });
    const points = new THREE.Points(geometry, material);

    const worldPosition = mesh.getWorldPosition(new THREE.Vector3());

    raycaster.params.Points.threshold = Math.max(
      0.015,
      camera.position.distanceTo(worldPosition) * 0.018
    );

    const hits = raycaster.intersectObject(points);

    geometry.dispose();
    material.dispose();

    return hits.length ? candidates[hits[0].index].id : null;
  }

  function findEdge() {
    const threshold = 0.045;

    let bestId = null;
    let bestDistance = Infinity;

    for (const edge of topology.edges) {
      const a = getWorldPosition(edge.vertices[0]);
      const b = getWorldPosition(edge.vertices[1]);

      if (!a || !b) continue;

      const screenA = a.clone().project(camera);
      const screenB = b.clone().project(camera);

      const a2 = new THREE.Vector2(screenA.x, screenA.y);
      const b2 = new THREE.Vector2(screenB.x, screenB.y);

      const segment = b2.clone().sub(a2);
      const lengthSquared = segment.lengthSq();

      const t = lengthSquared === 0
        ? 0
        : THREE.MathUtils.clamp(
            pointer.clone().sub(a2).dot(segment) / lengthSquared,
            0,
            1
          );

      const closest = a2.clone().add(segment.multiplyScalar(t));
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

  function selectAt(clientX, clientY) {
    const rect = element.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    pointer.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );

    raycaster.setFromCamera(pointer, camera);

    const id = findTarget();
    if (id !== null) select(id);
  }

  function selectByRectangle(start, end) {
    const rect = getRect(start, end);
    const activeSet = getActiveSet();

    if (!activeSet) return;

    if (!multiSelect) {
      activeSet.clear();
    }

    if (mode === "vertex") {
      for (const vertex of topology.vertices) {
        if (isInside(getScreenPosition(vertex.id), rect)) {
          activeSet.add(vertex.id);
        }
      }
    }

    if (mode === "edge") {
      for (const edge of topology.edges) {
        const a = getScreenPosition(edge.vertices[0]);
        const b = getScreenPosition(edge.vertices[1]);

        if (segmentIntersectsRect(a, b, rect)) {
          activeSet.add(edge.id);
        }
      }
    }

    if (mode === "face") {
      for (const face of topology.faces) {
        const points = face.vertices.map(id => getScreenPosition(id));

        if (triangleIntersectsRect(points, rect)) {
          activeSet.add(face.id);
        }
      }
    }

    updateVisuals();
    notifySelection();
  }

  // -------------------------
  // Pointer events
  // -------------------------

  function handlePointerDown(event) {
    if (event.button !== undefined && event.button !== 0) return;

    const rect = element.getBoundingClientRect();

    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    ) {
      return;
    }

    pointerStart = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId
    };

    event.preventDefault();
    event.stopPropagation();

    if (event.pointerId !== undefined) {
      element.setPointerCapture(event.pointerId);
    }

    hideSelectionBox();
  }

  function handlePointerMove(event) {
    if (!pointerStart) return;

    if (
      pointerStart.pointerId !== undefined &&
      event.pointerId !== pointerStart.pointerId
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    updateSelectionBox({
      x: event.clientX,
      y: event.clientY
    });
  }

  function handlePointerUp(event) {
    if (!pointerStart) return;

    if (
      pointerStart.pointerId !== undefined &&
      event.pointerId !== pointerStart.pointerId
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const start = {
      x: pointerStart.x,
      y: pointerStart.y
    };

    const end = {
      x: event.clientX,
      y: event.clientY
    };

    const dx = end.x - start.x;
    const dy = end.y - start.y;

    pointerStart = null;
    hideSelectionBox();

    if (Math.hypot(dx, dy) < 6) {
      selectAt(end.x, end.y);
    } else {
      selectByRectangle(start, end);
    }
  }

  function handlePointerCancel(event) {
    if (!pointerStart) return;

    if (
      pointerStart.pointerId !== undefined &&
      event.pointerId !== pointerStart.pointerId
    ) {
      return;
    }

    pointerStart = null;
    hideSelectionBox();
  }

  // -------------------------
  // Mode and multi-select
  // -------------------------

  function setMode(nextMode) {
    if (!["vertex", "edge", "face"].includes(nextMode)) return;

    mode = nextMode;
    clearSelection();
    visuals.setMode(mode);
  }

  function setMultiSelect(enabled) {
    multiSelect = Boolean(enabled);
    meshEditor?.setMultiSelect(multiSelect);
  }

  // -------------------------
  // Event registration
  // -------------------------

  element.addEventListener("pointerdown", handlePointerDown, true);
  element.addEventListener("pointermove", handlePointerMove);
  element.addEventListener("pointerup", handlePointerUp);
  element.addEventListener("pointercancel", handlePointerCancel);

  function dispose() {
    element.removeEventListener("pointerdown", handlePointerDown, true);
    element.removeEventListener("pointermove", handlePointerMove);
    element.removeEventListener("pointerup", handlePointerUp);
    element.removeEventListener("pointercancel", handlePointerCancel);

    pointerStart = null;
    hideSelectionBox();
    selectionBox.remove();
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
