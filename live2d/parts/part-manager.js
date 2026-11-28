
export function initializePartManager(state) {
  if (!Array.isArray(state.parts)) {
    state.parts = [];
  }

  state.partManager = {
    nextId: 1,
    selectedPartId: null
  };

  console.log("Part Manager: Ready");
}

export function createPart(state, options = {}) {
  const part = {
    id: `part_${state.partManager.nextId++}`,

    name: options.name || "新しいパーツ",

    image: options.image || null,

    x: options.x ?? 0,
    y: options.y ?? 0,

    width: options.width || options.image?.naturalWidth || 0,
    height: options.height || options.image?.naturalHeight || 0,

    rotation: 0,

    scaleX: 1,
    scaleY: 1,

    visible: true,
    locked: false,

    opacity: 1,

    parentId: null,

    meshId: null,

    deformerIds: [],

    createdAt: Date.now()
  };

  state.parts.push(part);

  selectPart(state, part.id);

  return part;
}

export function getPartById(state, partId) {
  return state.parts.find(
    part => part.id === partId
  ) || null;
}

export function getAllParts(state) {
  return [...state.parts];
}

export function removePart(state, partId) {
  const index = state.parts.findIndex(
    part => part.id === partId
  );

  if (index === -1) {
    return false;
  }

  state.parts.splice(index, 1);

  // 削除されたパーツを親にしていた子パーツは親を解除
  state.parts.forEach(part => {
    if (part.parentId === partId) {
      part.parentId = null;
    }
  });

  if (state.partManager.selectedPartId === partId) {
    state.partManager.selectedPartId = null;
    state.selectedPartId = null;
  }

  return true;
}

export function selectPart(state, partId) {
  const part = getPartById(state, partId);

  if (!part) {
    return false;
  }

  state.partManager.selectedPartId = partId;
  state.selectedPartId = partId;

  return true;
}

export function renamePart(state, partId, newName) {
  const part = getPartById(state, partId);

  if (!part || typeof newName !== "string") {
    return false;
  }

  const name = newName.trim();

  if (!name) {
    return false;
  }

  part.name = name;

  return true;
}

export function setPartVisibility(state, partId, visible) {
  const part = getPartById(state, partId);

  if (!part) {
    return false;
  }

  part.visible = Boolean(visible);

  return true;
}

export function setPartLocked(state, partId, locked) {
  const part = getPartById(state, partId);

  if (!part) {
    return false;
  }

  part.locked = Boolean(locked);

  return true;
}

export function duplicatePart(state, partId) {
  const original = getPartById(state, partId);

  if (!original) {
    return null;
  }

  const duplicate = {
    ...original,

    id: `part_${state.partManager.nextId++}`,

    name: `${original.name} コピー`,

    x: original.x + 20,
    y: original.y + 20,

    deformerIds: [...original.deformerIds],

    createdAt: Date.now()
  };

  state.parts.push(duplicate);

  selectPart(state, duplicate.id);

  return duplicate;
}
