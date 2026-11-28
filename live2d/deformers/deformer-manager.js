
export function initializeDeformerManager(state) {
  if (!Array.isArray(state.deformers)) {
    state.deformers = [];
  }

  state.deformerManager = {
    nextId: 1,
    selectedDeformerId: null
  };

  console.log("Deformer Manager: Ready");
}

export function createDeformer(state, options = {}) {
  const deformer = {
    id: `deformer_${state.deformerManager.nextId++}`,
    name: options.name || "新しいデフォーマー",
    type: options.type || "warp",

    x: options.x ?? 0,
    y: options.y ?? 0,
    width: options.width ?? 200,
    height: options.height ?? 200,

    rotation: options.rotation ?? 0,
    scaleX: options.scaleX ?? 1,
    scaleY: options.scaleY ?? 1,

    parentId: options.parentId || null,
    children: [],

    visible: true,
    locked: false,

    createdAt: Date.now()
  };

  state.deformers.push(deformer);

  selectDeformer(state, deformer.id);

  return deformer;
}

export function getDeformerById(state, deformerId) {
  return state.deformers.find(
    deformer => deformer.id === deformerId
  ) || null;
}

export function getAllDeformers(state) {
  return [...state.deformers];
}

export function getSelectedDeformer(state) {
  return getDeformerById(
    state,
    state.deformerManager.selectedDeformerId
  );
}

export function selectDeformer(state, deformerId) {
  const deformer = getDeformerById(state, deformerId);

  if (!deformer) {
    return false;
  }

  state.deformerManager.selectedDeformerId = deformerId;

  return true;
}

export function removeDeformer(state, deformerId) {
  const index = state.deformers.findIndex(
    deformer => deformer.id === deformerId
  );

  if (index === -1) {
    return false;
  }

  state.deformers.splice(index, 1);

  for (const deformer of state.deformers) {
    if (deformer.parentId === deformerId) {
      deformer.parentId = null;
    }
  }

  for (const part of state.parts) {
    if (part.deformerIds?.includes(deformerId)) {
      part.deformerIds = part.deformerIds.filter(
        id => id !== deformerId
      );
    }
  }

  if (state.deformerManager.selectedDeformerId === deformerId) {
    state.deformerManager.selectedDeformerId = null;
  }

  return true;
}

export function renameDeformer(state, deformerId, newName) {
  const deformer = getDeformerById(state, deformerId);

  if (!deformer || typeof newName !== "string") {
    return false;
  }

  const name = newName.trim();

  if (!name) {
    return false;
  }

  deformer.name = name;

  return true;
}

export function setDeformerVisibility(state, deformerId, visible) {
  const deformer = getDeformerById(state, deformerId);

  if (!deformer) {
    return false;
  }

  deformer.visible = Boolean(visible);

  return true;
}

export function setDeformerLocked(state, deformerId, locked) {
  const deformer = getDeformerById(state, deformerId);

  if (!deformer) {
    return false;
  }

  deformer.locked = Boolean(locked);

  return true;
}
