
import * as THREE from "three";

export function createMeshEditor({
  scene,
  camera,
  renderer,
  orbitControls = null,
  onModeChange = () => {},
  onSelectionChange = () => {}
}) {
  let activeMesh = null;
  let vertices = [];
  let selectedVertices = new Set();
  let editing = false;
  let multiSelect = false;

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
    vertices = getUniqueVertices(mesh);
    selectedVertices.clear();
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

    activeMesh = null;
    vertices = [];
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

  function setSelectedVertices(ids = []) {
    selectedVertices.clear();

    for (const id of ids) {
      if (vertices[id]) {
        selectedVertices.add(id);
      }
    }

    onSelectionChange(getSelectedVertices());
  }

  function clearSelection() {
    selectedVertices.clear();
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

    onSelectionChange(getSelectedVertices());
  }

  function refreshVertexPositions() {
    if (!activeMesh) return;

    vertices = getUniqueVertices(activeMesh);

    selectedVertices = new Set(
      [...selectedVertices].filter(id => vertices[id])
    );

    onSelectionChange(getSelectedVertices());
  }

  function dispose() {
    exitEditMode();
  }

  return {
    enterEditMode,
    exitEditMode,
    setMultiSelect,
    setSelectedVertices,
    selectVertex,
    clearSelection,
    getSelectedVertices,
    refreshVertexPositions,
    isEditing: () => editing,
    getActiveMesh: () => activeMesh,
    dispose
  };
}
