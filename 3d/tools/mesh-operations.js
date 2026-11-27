
import * as THREE from "three";

export function createMeshOperations(meshEditor) {
  function getContext() {
    const mesh = meshEditor.getActiveMesh();

    if (!mesh || !mesh.geometry?.attributes?.position) {
      return null;
    }

    return {
      mesh,
      position: mesh.geometry.attributes.position,
      selected: meshEditor.getSelectedVertices()
    };
  }

  function captureState() {
    const context = getContext();

    if (!context) return null;

    return {
      positions: Array.from(context.position.array)
    };
  }

  function restoreState(state) {
    const context = getContext();

    if (!context || !state?.positions) return false;

    const attribute = context.position;

    if (state.positions.length !== attribute.array.length) {
      return false;
    }

    for (let i = 0; i < state.positions.length; i++) {
      attribute.array[i] = state.positions[i];
    }

    attribute.needsUpdate = true;

    context.mesh.geometry.computeVertexNormals();
    context.mesh.geometry.computeBoundingBox();
    context.mesh.geometry.computeBoundingSphere();

    meshEditor.refreshVertexPositions();

    return true;
  }

  function applyToSelected(transform) {
    const context = getContext();

    if (!context || context.selected.length === 0) {
      return false;
    }

    const { mesh, position, selected } = context;

    for (const vertex of selected) {
      const current = vertex.position.clone();

      transform(current, vertex);

      for (const index of vertex.sourceIndices) {
        position.setXYZ(
          index,
          current.x,
          current.y,
          current.z
        );
      }
    }

    position.needsUpdate = true;

    mesh.geometry.computeVertexNormals();
    mesh.geometry.computeBoundingBox();
    mesh.geometry.computeBoundingSphere();

    meshEditor.refreshVertexPositions();

    return true;
  }

  function move(x = 0, y = 0, z = 0) {
    return applyToSelected(vertex => {
      vertex.x += x;
      vertex.y += y;
      vertex.z += z;
    });
  }

  function getSelectionCenter(selected) {
    const center = new THREE.Vector3();

    for (const vertex of selected) {
      center.add(vertex.position);
    }

    return center.divideScalar(selected.length);
  }

  function scale(x = 1, y = 1, z = 1) {
    const context = getContext();

    if (!context || context.selected.length === 0) {
      return false;
    }

    const center = getSelectionCenter(context.selected);

    return applyToSelected(vertex => {
      vertex.sub(center);
      vertex.set(
        vertex.x * x,
        vertex.y * y,
        vertex.z * z
      );
      vertex.add(center);
    });
  }

  function rotate(x = 0, y = 0, z = 0) {
    const context = getContext();

    if (!context || context.selected.length === 0) {
      return false;
    }

    const center = getSelectionCenter(context.selected);

    const quaternion = new THREE.Quaternion()
      .setFromEuler(new THREE.Euler(x, y, z, "XYZ"));

    return applyToSelected(vertex => {
      vertex.sub(center);
      vertex.applyQuaternion(quaternion);
      vertex.add(center);
    });
  }

  return {
    move,
    scale,
    rotate,
    captureState,
    restoreState
  };
}
