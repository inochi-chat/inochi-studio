
import {
  getMeshById,
  selectMesh,
  getSelectedMesh
} from "./mesh-manager.js";

import {
  moveVertex,
  moveVertexBy,
  resetVertex,
  resetAllVertices,
  findNearestVertex
} from "./vertex-manager.js";

import {
  addTriangle,
  removeTriangle,
  getTriangleCount
} from "./triangle-manager.js";

import { generateMesh } from "./mesh-generator.js";

export function initializeMeshEditor(state) {
  state.meshEditor = {
    enabled: false,
    activeTool: "vertex",
    selectedVertexIndex: null,
    selectedTriangleId: null,
    dragging: false
  };

  console.log("Mesh Editor: Ready");
}

export function enableMeshEditor(state, meshId = null) {
  if (meshId) {
    if (!selectMesh(state, meshId)) {
      return false;
    }
  }

  if (!getSelectedMesh(state)) {
    return false;
  }

  state.meshEditor.enabled = true;

  return true;
}

export function disableMeshEditor(state) {
  if (!state.meshEditor) {
    return false;
  }

  state.meshEditor.enabled = false;
  state.meshEditor.dragging = false;
  state.meshEditor.selectedVertexIndex = null;
  state.meshEditor.selectedTriangleId = null;

  return true;
}

export function setMeshTool(state, tool) {
  const availableTools = [
    "vertex",
    "triangle",
    "select"
  ];

  if (!availableTools.includes(tool)) {
    return false;
  }

  state.meshEditor.activeTool = tool;

  return true;
}

export function generatePartMesh(state, partId, options = {}) {
  return generateMesh(state, partId, options);
}

export function selectVertex(state, vertexIndex) {
  const mesh = getSelectedMesh(state);

  if (!mesh || !mesh.vertices[vertexIndex]) {
    return false;
  }

  state.meshEditor.selectedVertexIndex = vertexIndex;

  return true;
}

export function moveSelectedVertex(state, x, y) {
  const mesh = getSelectedMesh(state);
  const index = state.meshEditor.selectedVertexIndex;

  if (!mesh || index === null) {
    return false;
  }

  return moveVertex(mesh, index, x, y);
}

export function moveSelectedVertexBy(state, deltaX, deltaY) {
  const mesh = getSelectedMesh(state);
  const index = state.meshEditor.selectedVertexIndex;

  if (!mesh || index === null) {
    return false;
  }

  return moveVertexBy(mesh, index, deltaX, deltaY);
}

export function findVertexAt(state, x, y, maxDistance = 20) {
  const mesh = getSelectedMesh(state);

  if (!mesh) {
    return null;
  }

  return findNearestVertex(
    mesh,
    x,
    y,
    maxDistance
  );
}

export function resetSelectedVertex(state) {
  const mesh = getSelectedMesh(state);
  const index = state.meshEditor.selectedVertexIndex;

  if (!mesh || index === null) {
    return false;
  }

  return resetVertex(mesh, index);
}

export function resetMeshVertices(state) {
  const mesh = getSelectedMesh(state);

  if (!mesh) {
    return false;
  }

  return resetAllVertices(mesh);
}

export function addMeshTriangle(state, a, b, c) {
  const mesh = getSelectedMesh(state);

  if (!mesh) {
    return null;
  }

  return addTriangle(mesh, a, b, c);
}

export function deleteSelectedTriangle(state) {
  const mesh = getSelectedMesh(state);
  const triangleId = state.meshEditor.selectedTriangleId;

  if (!mesh || !triangleId) {
    return false;
  }

  const removed = removeTriangle(mesh, triangleId);

  if (removed) {
    state.meshEditor.selectedTriangleId = null;
  }

  return removed;
}

export function selectTriangle(state, triangleId) {
  const mesh = getSelectedMesh(state);

  if (
    !mesh ||
    !mesh.triangles.some(
      triangle => triangle.id === triangleId
    )
  ) {
    return false;
  }

  state.meshEditor.selectedTriangleId = triangleId;

  return true;
}

export function getMeshEditorInfo(state) {
  const mesh = getSelectedMesh(state);

  if (!mesh) {
    return null;
  }

  return {
    meshId: mesh.id,
    meshName: mesh.name,
    vertexCount: mesh.vertices.length,
    triangleCount: getTriangleCount(mesh),
    selectedVertexIndex:
      state.meshEditor.selectedVertexIndex,
    selectedTriangleId:
      state.meshEditor.selectedTriangleId
  };
}
