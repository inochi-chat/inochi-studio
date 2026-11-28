
export function initializeMeshManager(state) {
  if (!Array.isArray(state.meshes)) {
    state.meshes = [];
  }

  state.meshManager = {
    nextId: 1,
    selectedMeshId: null
  };

  console.log("Mesh Manager: Ready");
}

export function createMesh(state, options = {}) {
  const mesh = {
    id: `mesh_${state.meshManager.nextId++}`,
    name: options.name || "新しいメッシュ",
    partId: options.partId || null,

    vertices: [],
    triangles: [],

    visible: true,
    locked: false,

    createdAt: Date.now()
  };

  state.meshes.push(mesh);

  selectMesh(state, mesh.id);

  return mesh;
}

export function getMeshById(state, meshId) {
  return state.meshes.find(
    mesh => mesh.id === meshId
  ) || null;
}

export function getAllMeshes(state) {
  return [...state.meshes];
}

export function selectMesh(state, meshId) {
  const mesh = getMeshById(state, meshId);

  if (!mesh) {
    return false;
  }

  state.meshManager.selectedMeshId = meshId;

  return true;
}

export function getSelectedMesh(state) {
  return getMeshById(
    state,
    state.meshManager.selectedMeshId
  );
}

export function removeMesh(state, meshId) {
  const index = state.meshes.findIndex(
    mesh => mesh.id === meshId
  );

  if (index === -1) {
    return false;
  }

  state.meshes.splice(index, 1);

  if (state.meshManager.selectedMeshId === meshId) {
    state.meshManager.selectedMeshId = null;
  }

  return true;
}

export function renameMesh(state, meshId, newName) {
  const mesh = getMeshById(state, meshId);

  if (!mesh || typeof newName !== "string") {
    return false;
  }

  const name = newName.trim();

  if (!name) {
    return false;
  }

  mesh.name = name;

  return true;
}

export function setMeshVisibility(state, meshId, visible) {
  const mesh = getMeshById(state, meshId);

  if (!mesh) {
    return false;
  }

  mesh.visible = Boolean(visible);

  return true;
}

export function setMeshLocked(state, meshId, locked) {
  const mesh = getMeshById(state, meshId);

  if (!mesh) {
    return false;
  }

  mesh.locked = Boolean(locked);

  return true;
}

export function getMeshesByPart(state, partId) {
  return state.meshes.filter(
    mesh => mesh.partId === partId
  );
}
