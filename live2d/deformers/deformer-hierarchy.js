
import { getDeformerById } from "./deformer-manager.js";

export function initializeDeformerHierarchy(state) {
  state.deformerHierarchy = {
    enabled: true
  };

  console.log("Deformer Hierarchy: Ready");
}

export function setDeformerParent(state, childId, parentId) {
  const child = getDeformerById(state, childId);

  if (!child) {
    return false;
  }

  if (childId === parentId) {
    return false;
  }

  if (parentId !== null) {
    const parent = getDeformerById(state, parentId);

    if (!parent) {
      return false;
    }

    if (isDeformerDescendant(state, parentId, childId)) {
      return false;
    }
  }

  child.parentId = parentId;

  return true;
}

export function getDeformerParent(state, childId) {
  const child = getDeformerById(state, childId);

  if (!child || !child.parentId) {
    return null;
  }

  return getDeformerById(state, child.parentId);
}

export function getDeformerChildren(state, parentId) {
  return state.deformers.filter(
    deformer => deformer.parentId === parentId
  );
}

export function getDeformerAncestors(state, deformerId) {
  const ancestors = [];
  let current = getDeformerById(state, deformerId);

  while (current?.parentId) {
    const parent = getDeformerById(
      state,
      current.parentId
    );

    if (!parent) {
      break;
    }

    ancestors.push(parent);
    current = parent;
  }

  return ancestors;
}

export function getDeformerDescendants(state, parentId) {
  const descendants = [];

  function collect(currentId) {
    const children = getDeformerChildren(state, currentId);

    for (const child of children) {
      descendants.push(child);
      collect(child.id);
    }
  }

  collect(parentId);

  return descendants;
}

export function isDeformerDescendant(
  state,
  deformerId,
  possibleAncestorId
) {
  let current = getDeformerById(state, deformerId);

  while (current?.parentId) {
    if (current.parentId === possibleAncestorId) {
      return true;
    }

    current = getDeformerById(
      state,
      current.parentId
    );
  }

  return false;
}

export function removeDeformerParent(state, childId) {
  const child = getDeformerById(state, childId);

  if (!child) {
    return false;
  }

  child.parentId = null;

  return true;
}

export function clearDeformerHierarchy(state) {
  for (const deformer of state.deformers) {
    deformer.parentId = null;
  }
}

export function getDeformerHierarchyTree(state) {
  function buildTree(parentId = null) {
    return getDeformerChildren(state, parentId).map(
      deformer => ({
        id: deformer.id,
        name: deformer.name,
        type: deformer.type,
        children: buildTree(deformer.id)
      })
    );
  }

  return buildTree();
}
