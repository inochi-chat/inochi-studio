
import { getPartById } from "./part-manager.js";

export function initializePartHierarchy(state) {
  state.hierarchy = {
    enabled: true
  };

  console.log("Part Hierarchy: Ready");
}

export function setParent(state, childId, parentId) {
  const child = getPartById(state, childId);

  if (!child) {
    return false;
  }

  if (childId === parentId) {
    return false;
  }

  if (parentId !== null) {
    const parent = getPartById(state, parentId);

    if (!parent) {
      return false;
    }

    if (isDescendant(state, parentId, childId)) {
      return false;
    }
  }

  child.parentId = parentId;

  return true;
}

export function getChildren(state, parentId) {
  return state.parts.filter(
    part => part.parentId === parentId
  );
}

export function getParent(state, childId) {
  const child = getPartById(state, childId);

  if (!child || !child.parentId) {
    return null;
  }

  return getPartById(state, child.parentId);
}

export function getAncestors(state, partId) {
  const ancestors = [];
  let current = getPartById(state, partId);

  while (current && current.parentId) {
    const parent = getPartById(state, current.parentId);

    if (!parent) {
      break;
    }

    ancestors.push(parent);
    current = parent;
  }

  return ancestors;
}

export function getDescendants(state, parentId) {
  const descendants = [];

  function collect(currentId) {
    const children = getChildren(state, currentId);

    for (const child of children) {
      descendants.push(child);
      collect(child.id);
    }
  }

  collect(parentId);

  return descendants;
}

export function isDescendant(state, partId, possibleAncestorId) {
  let current = getPartById(state, partId);

  while (current && current.parentId) {
    if (current.parentId === possibleAncestorId) {
      return true;
    }

    current = getPartById(state, current.parentId);
  }

  return false;
}

export function removeParent(state, childId) {
  const child = getPartById(state, childId);

  if (!child) {
    return false;
  }

  child.parentId = null;

  return true;
}

export function clearHierarchy(state) {
  for (const part of state.parts) {
    part.parentId = null;
  }
}

export function getHierarchyTree(state) {
  function buildTree(parentId = null) {
    return getChildren(state, parentId).map(part => ({
      id: part.id,
      name: part.name,
      children: buildTree(part.id)
    }));
  }

  return buildTree();
}
