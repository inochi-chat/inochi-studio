
import * as THREE from "three";

export function createMeshEditor({
  scene,
  camera,
  renderer,
  orbitControls = null,
  onModeChange = () => {},
  onSelectionChange = () => {}
}) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  let activeMesh = null;
  let vertexPoints = null;
  let vertexGeometry = null;
  let vertexMaterial = null;

  let vertices = [];
  let selectedVertices = new Set();
  let editing = false;
  let multiSelect = false;
  let pointerStart = null;

  const pointSize = 18;

  function positionKey(x, y, z) {
    return `${x.toFixed(5)},${y.toFixed(5)},${z.toFixed(5)}`;
  }

  function getUniqueVertices(mesh) {
    const position = mesh.geometry.attributes.position;
    const unique = [];
    const lookup = new Map();

    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      const z = position.getZ(i);

      const key = positionKey(x, y, z);

      if (!lookup.has(key)) {
        const vertex = {
          id: unique.length,
          sourceIndices: [],
          position: new THREE.Vector3(x, y, z)
        };

        lookup.set(key, vertex);
        unique.push(vertex);
      }

      lookup.get(key).sourceIndices.push(i);
    }

    return unique;
  }

  function createVertexVisual() {
    if (!activeMesh) return;

    vertices = getUniqueVertices(activeMesh);

    const positions = [];
    const colors = [];

    for (const vertex of vertices) {
      positions.push(
        vertex.position.x,
        vertex.position.y,
        vertex.position.z
      );

      colors.push(1, 0.55, 0.15);
    }

    vertexGeometry = new THREE.BufferGeometry();

    vertexGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );

    vertexGeometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(colors, 3)
    );

    vertexMaterial = new THREE.PointsMaterial({
      size: pointSize,
      sizeAttenuation: false,
      vertexColors: true,
      depthTest: true,
      transparent: true
    });

    vertexPoints = new THREE.Points(
      vertexGeometry,
      vertexMaterial
    );

    vertexPoints.renderOrder = 10;
    activeMesh.add(vertexPoints);

    updateVertexColors();
  }

  function updateVertexColors() {
    if (!vertexGeometry) return;

    const colors = vertexGeometry.attributes.color;

    for (let i = 0; i < vertices.length; i++) {
      const selected = selectedVertices.has(i);

      colors.setXYZ(
        i,
        selected ? 0.1 : 1,
        selected ? 0.8 : 0.55,
        selected ? 1 : 0.15
      );
    }

    colors.needsUpdate = true;
  }

  function refreshVertexPositions() {
    if (!activeMesh || !vertexGeometry) return;

    vertices = getUniqueVertices(activeMesh);

    const positions = vertexGeometry.attributes.position;

    positions.array = new Float32Array(
      vertices.flatMap(vertex => [
        vertex.position.x,
        vertex.position.y,
        vertex.position.z
      ])
    );

    positions.count = vertices.length;
    positions.needsUpdate = true;

    updateVertexColors();
  }

  function removeVertexVisual() {
    if (vertexPoints && activeMesh) {
      activeMesh.remove(vertexPoints);
    }

    vertexGeometry?.dispose();
    vertexMaterial?.dispose();

    vertexPoints = null;
    vertexGeometry = null;
    vertexMaterial = null;
    vertices = [];
  }

  function enterEditMode(mesh) {
    if (
      !mesh ||
      !mesh.isMesh ||
      !mesh.geometry?.attributes?.position
    ) {
      console.warn("メッシュ編集できるオブジェクトを選択してください。");
      return false;
    }

    exitEditMode();

    activeMesh = mesh;
    selectedVertices.clear();

    createVertexVisual();

    editing = true;

    onModeChange({
      editing: true,
      mesh: activeMesh
    });

    onSelectionChange([]);

    return true;
  }

  function exitEditMode() {
    if (!editing && !activeMesh) return;

    removeVertexVisual();

    activeMesh = null;
    selectedVertices.clear();
    editing = false;

    onModeChange({
      editing: false,
      mesh: null
    });

    onSelectionChange([]);
  }

  function setMultiSelect(enabled) {
    multiSelect = Boolean(enabled);
  }

  function clearSelection() {
    selectedVertices.clear();
    updateVertexColors();
    onSelectionChange([]);
  }

  function getSelectedVertices() {
    return [...selectedVertices]
      .map(id => vertices[id])
      .filter(Boolean)
      .map(vertex => ({
        id: vertex.id,
        sourceIndices: [...vertex.sourceIndices],
        position: vertex.position.clone()
      }));
  }

  function selectVertex(id) {
    if (!vertices[id]) return;

    if (!multiSelect) {
      selectedVertices.clear();
    }

    if (multiSelect && selectedVertices.has(id)) {
      selectedVertices.delete(id);
    } else {
      selectedVertices.add(id);
    }

    updateVertexColors();
    onSelectionChange(getSelectedVertices());
  }

  function handlePointerDown(event) {
    if (!editing || !vertexPoints) return;

    pointerStart = {
      x: event.clientX,
      y: event.clientY
    };
  }

  function handlePointerUp(event) {
    if (!editing || !vertexPoints || !pointerStart) return;

    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;

    pointerStart = null;

    if (Math.hypot(dx, dy) > 8) return;

    const rect = renderer.domElement.getBoundingClientRect();

    pointer.x =
      ((event.clientX - rect.left) / rect.width) * 2 - 1;

    pointer.y =
      -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.params.Points.threshold =
      Math.max(
        0.015,
        camera.position.distanceTo(
          activeMesh.getWorldPosition(new THREE.Vector3())
        ) * 0.018
      );

    raycaster.setFromCamera(pointer, camera);

    const hits = raycaster.intersectObject(vertexPoints);

    if (hits.length === 0) return;

    const id = hits[0].index;

    if (id !== undefined) {
      selectVertex(id);
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
    exitEditMode();

    element.removeEventListener("pointerdown", handlePointerDown);
    element.removeEventListener("pointerup", handlePointerUp);
    element.removeEventListener("pointercancel", handlePointerCancel);
  }

  return {
    enterEditMode,
    exitEditMode,
    setMultiSelect,
    clearSelection,
    getSelectedVertices,
    refreshVertexPositions,
    isEditing: () => editing,
    getActiveMesh: () => activeMesh,
    dispose
  };
}
