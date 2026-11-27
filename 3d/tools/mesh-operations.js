
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

    return true;
  }

  function applyToSelected(transform) {
    const context = getContext();

    if (!context || context.selected.length === 0) {
      return false;
    }

    const { position, selected } = context;

    for (const vertex of selected) {
      const index = vertex.sourceIndex;

      const current = new THREE.Vector3(
        position.getX(index),
        position.getY(index),
        position.getZ(index)
      );

      transform(current, vertex);

      position.setXYZ(
        index,
        current.x,
        current.y,
        current.z
      );
    }

    position.needsUpdate = true;

    context.mesh.geometry.computeVertexNormals();
    context.mesh.geometry.computeBoundingBox();
    context.mesh.geometry.computeBoundingSphere();

    return true;
  }

  function move(x = 0, y = 0, z = 0) {
    return applyToSelected(vertex => {
      vertex.x += x;
      vertex.y += y;
      vertex.z += z;
    });
  }

  function scale(x = 1, y = 1, z = 1) {
    const context = getContext();

    if (!context || context.selected.length === 0) {
      return false;
    }

    const center = new THREE.Vector3();

    for (const vertex of context.selected) {
      center.add(vertex.position);
    }

    center.divideScalar(context.selected.length);

    return applyToSelected(vertex => {
      vertex.sub(center);
      vertex.x *= x;
      vertex.y *= y;
      vertex.z *= z;
      vertex.add(center);
    });
  }

  function rotate(x = 0, y = 0, z = 0) {
    const context = getContext();

    if (!context || context.selected.length === 0) {
      return false;
    }

    const center = new THREE.Vector3();

    for (const vertex of context.selected) {
      center.add(vertex.position);
    }

    center.divideScalar(context.selected.length);

    const rotation = new THREE.Euler(x, y, z, "XYZ");
    const quaternion = new THREE.Quaternion()
      .setFromEuler(rotation);

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
