
import * as THREE from "three";

export function createMeshOperations(meshEditor) {
  let mirrorXEnabled = false;

  function positionKey(x, y, z) {
    return `${x.toFixed(5)},${y.toFixed(5)},${z.toFixed(5)}`;
  }

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

    // ミラー相手の頂点を探すため、全頂点を座標で分類
    const positionMap = new Map();

    for (let i = 0; i < position.count; i++) {
      const key = positionKey(
        position.getX(i),
        position.getY(i),
        position.getZ(i)
      );

      if (!positionMap.has(key)) {
        positionMap.set(key, []);
      }

      positionMap.get(key).push(i);
    }

    const processed = new Set();

    for (const vertex of selected) {
      const original = vertex.position.clone();
      const key = positionKey(
        original.x,
        original.y,
        original.z
      );

      if (processed.has(key)) continue;

      const onCenterLine = Math.abs(original.x) < 0.00001;

      // 選択頂点を変形
      const current = original.clone();
      transform(current, vertex);

      if (mirrorXEnabled && onCenterLine) {
        current.x = 0;
      }

      for (const index of vertex.sourceIndices) {
        position.setXYZ(
          index,
          current.x,
          current.y,
          current.z
        );
      }

      processed.add(key);

      if (!mirrorXEnabled || onCenterLine) {
        continue;
      }

      // X軸反対側の同じ位置にある頂点を探す
      const mirrorKey = positionKey(
        -original.x,
        original.y,
        original.z
      );

      const mirrorIndices = positionMap.get(mirrorKey);

      if (!mirrorIndices || mirrorIndices.length === 0) {
        continue;
      }

      // 変形結果をX軸反転して反対側へ適用
      const mirrored = current.clone();
      mirrored.x *= -1;

      for (const index of mirrorIndices) {
        position.setXYZ(
          index,
          mirrored.x,
          mirrored.y,
          mirrored.z
        );
      }

      processed.add(mirrorKey);
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

  function setMirrorX(enabled) {
    mirrorXEnabled = Boolean(enabled);
  }

  function isMirrorXEnabled() {
    return mirrorXEnabled;
  }

  return {
    move,
    scale,
    rotate,
    captureState,
    restoreState,
    setMirrorX,
    isMirrorXEnabled
  };
}
