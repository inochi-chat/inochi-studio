
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
      const key = positionKey(original.x, original.y, original.z);

      if (processed.has(key)) continue;

      const onCenterLine = Math.abs(original.x) < 0.00001;

      const current = original.clone();
      transform(current, vertex);

      if (mirrorXEnabled && onCenterLine) {
        current.x = 0;
      }

      for (const index of vertex.sourceIndices) {
        position.setXYZ(index, current.x, current.y, current.z);
      }

      processed.add(key);

      if (!mirrorXEnabled || onCenterLine) continue;

      const mirrorKey = positionKey(
        -original.x,
        original.y,
        original.z
      );

      const mirrorIndices = positionMap.get(mirrorKey);
      if (!mirrorIndices?.length) continue;

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

    finishGeometry(mesh);
    return true;
  }

  function finishGeometry(mesh) {
    const geometry = mesh.geometry;
    const position = geometry.attributes.position;

    position.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    meshEditor.refreshVertexPositions();
  }

  function getSelectionCenter(selected) {
    const center = new THREE.Vector3();

    for (const vertex of selected) {
      center.add(vertex.position);
    }

    return center.divideScalar(selected.length);
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
    if (!context || context.selected.length === 0) return false;

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
    if (!context || context.selected.length === 0) return false;

    const center = getSelectionCenter(context.selected);

    const quaternion = new THREE.Quaternion()
      .setFromEuler(new THREE.Euler(x, y, z, "XYZ"));

    return applyToSelected(vertex => {
      vertex.sub(center);
      vertex.applyQuaternion(quaternion);
      vertex.add(center);
    });
  }

  // ブラシの中心を取得。左右対称ONなら反対側にも中心を作る
  function getBrushCenters(selected) {
    const centers = [];

    for (const vertex of selected) {
      const center = vertex.position.clone();
      centers.push(center);

      if (mirrorXEnabled && Math.abs(center.x) > 0.00001) {
        centers.push(
          new THREE.Vector3(-center.x, center.y, center.z)
        );
      }
    }

    const unique = new Map();

    for (const center of centers) {
      unique.set(
        positionKey(center.x, center.y, center.z),
        center
      );
    }

    return [...unique.values()];
  }

  function getUniqueRecords(mesh) {
    const geometry = mesh.geometry;
    const position = geometry.attributes.position;
    const normal = geometry.attributes.normal;

    const records = new Map();

    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      const z = position.getZ(i);
      const key = positionKey(x, y, z);

      if (!records.has(key)) {
        records.set(key, {
          key,
          position: new THREE.Vector3(x, y, z),
          normal: new THREE.Vector3(),
          indices: [],
          normalCount: 0
        });
      }

      const record = records.get(key);
      record.indices.push(i);

      if (normal) {
        record.normal.x += normal.getX(i);
        record.normal.y += normal.getY(i);
        record.normal.z += normal.getZ(i);
        record.normalCount++;
      }
    }

    for (const record of records.values()) {
      if (record.normal.lengthSq() > 0) {
        record.normal.normalize();
      } else {
        record.normal.set(0, 1, 0);
      }
    }

    return [...records.values()];
  }

  function getNearestBrush(record, centers) {
    let nearest = null;
    let minDistance = Infinity;

    for (const center of centers) {
      const distance = record.position.distanceTo(center);

      if (distance < minDistance) {
        minDistance = distance;
        nearest = center;
      }
    }

    return {
      center: nearest,
      distance: minDistance
    };
  }

  function brushFalloff(distance, radius) {
    if (distance >= radius) return 0;

    const t = 1 - distance / radius;
    return t * t * (3 - 2 * t);
  }

  function applyBrush(radius, strength, operation) {
    const context = getContext();

    if (!context || context.selected.length === 0) {
      return false;
    }

    radius = Number(radius);
    strength = Number(strength);

    if (
      !Number.isFinite(radius) ||
      !Number.isFinite(strength) ||
      radius <= 0
    ) {
      return false;
    }

    const { mesh } = context;
    const geometry = mesh.geometry;

    // 頂点法線を最新にする
    geometry.computeVertexNormals();

    const position = geometry.attributes.position;
    const centers = getBrushCenters(context.selected);
    const records = getUniqueRecords(mesh);

    if (centers.length === 0 || records.length === 0) {
      return false;
    }

    const originalPositions = records.map(record =>
      record.position.clone()
    );

    const updates = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const nearest = getNearestBrush(record, centers);
      const influence = brushFalloff(nearest.distance, radius);

      if (influence <= 0) continue;

      const next = originalPositions[i].clone();

      operation({
        next,
        original: originalPositions[i],
        normal: record.normal,
        center: nearest.center,
        influence,
        radius,
        strength,
        records,
        originalPositions,
        index: i
      });

      updates.push({ record, next });
    }

    if (updates.length === 0) return false;

    for (const update of updates) {
      for (const index of update.record.indices) {
        position.setXYZ(
          index,
          update.next.x,
          update.next.y,
          update.next.z
        );
      }
    }

    finishGeometry(mesh);
    return true;
  }

  // 押し出し・へこませる：ブラシ中心から外側／内側へ動かす
  function sculptPushPull(radius = 0.5, strength = 0.1) {
    return applyBrush(radius, strength, ({
      next,
      original,
      center,
      influence,
      strength
    }) => {
      const direction = original.clone().sub(center);

      if (direction.lengthSq() < 0.000001) {
        return;
      }

      direction.normalize();
      next.addScaledVector(direction, strength * influence);
    });
  }

  // なめらか化：近くの頂点の平均位置へ少しずつ近づける
  function sculptSmooth(radius = 0.5, strength = 0.5) {
    const amount = THREE.MathUtils.clamp(strength, 0, 1);

    return applyBrush(radius, amount, ({
      next,
      influence,
      radius,
      records,
      originalPositions,
      index
    }) => {
      const current = originalPositions[index];
      const neighborRadius = radius * 0.45;

      const average = new THREE.Vector3();
      let totalWeight = 0;

      for (let i = 0; i < records.length; i++) {
        if (i === index) continue;

        const other = originalPositions[i];
        const distance = current.distanceTo(other);

        if (distance <= 0.00001 || distance > neighborRadius) {
          continue;
        }

        const weight = 1 / distance;
        average.addScaledVector(other, weight);
        totalWeight += weight;
      }

      if (totalWeight === 0) return;

      average.divideScalar(totalWeight);

      const blend = amount * influence;
      next.lerp(average, blend);
    });
  }

  // 膨らませる：頂点法線の方向へ押し出す
  function sculptInflate(radius = 0.5, strength = 0.1) {
    return applyBrush(radius, strength, ({
      next,
      normal,
      influence,
      strength
    }) => {
      next.addScaledVector(normal, strength * influence);
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
    isMirrorXEnabled,
    sculptPushPull,
    sculptSmooth,
    sculptInflate
  };
}
