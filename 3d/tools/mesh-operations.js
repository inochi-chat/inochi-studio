
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

  function finishGeometry(mesh) {
    const geometry = mesh.geometry;
    const position = geometry.attributes.position;

    position.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    meshEditor.refreshVertexPositions();
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

    finishGeometry(context.mesh);
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

  // 同じ位置に重なった頂点をまとめる
  function getUniqueRecords(mesh) {
    const geometry = mesh.geometry;
    const position = geometry.attributes.position;
    const normal = geometry.attributes.normal;
    const records = new Map();
    const indexToRecord = new Array(position.count);

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
          neighbors: new Set()
        });
      }

      const record = records.get(key);
      record.indices.push(i);
      indexToRecord[i] = record;

      if (normal) {
        record.normal.x += normal.getX(i);
        record.normal.y += normal.getY(i);
        record.normal.z += normal.getZ(i);
      }
    }

    for (const record of records.values()) {
      if (record.normal.lengthSq() > 0) {
        record.normal.normalize();
      } else {
        record.normal.set(0, 1, 0);
      }
    }

    // 三角形から隣接頂点を取得
    const index = geometry.index;
    const count = index ? index.count : position.count;

    function getRecordAt(i) {
      const vertexIndex = index ? index.getX(i) : i;
      return indexToRecord[vertexIndex];
    }

    for (let i = 0; i + 2 < count; i += 3) {
      const a = getRecordAt(i);
      const b = getRecordAt(i + 1);
      const c = getRecordAt(i + 2);

      if (!a || !b || !c) continue;

      if (a !== b) {
        a.neighbors.add(b);
        b.neighbors.add(a);
      }

      if (b !== c) {
        b.neighbors.add(c);
        c.neighbors.add(b);
      }

      if (c !== a) {
        c.neighbors.add(a);
        a.neighbors.add(c);
      }
    }

    return [...records.values()];
  }

  function brushFalloff(distance, radius) {
    if (distance >= radius) return 0;

    const t = 1 - distance / radius;
    return t * t * (3 - 2 * t);
  }

  function getBrushCenters(point) {
    const centers = [point.clone()];

    if (mirrorXEnabled && Math.abs(point.x) > 0.00001) {
      centers.push(
        new THREE.Vector3(-point.x, point.y, point.z)
      );
    }

    return centers;
  }

  function getNearestDistance(position, centers) {
    let minimum = Infinity;

    for (const center of centers) {
      minimum = Math.min(
        minimum,
        position.distanceTo(center)
      );
    }

    return minimum;
  }

  // 表面の指定位置にブラシを適用
  function sculptAt(
    point,
    radius = 0.5,
    strength = 0.1,
    mode = "pushpull"
  ) {
    const context = getContext();

    if (!context || !point) return false;

    radius = Number(radius);
    strength = Number(strength);

    if (
      !Number.isFinite(radius) ||
      !Number.isFinite(strength) ||
      radius <= 0
    ) {
      return false;
    }

    if (!["pushpull", "smooth", "inflate"].includes(mode)) {
      return false;
    }

    const { mesh } = context;
    const geometry = mesh.geometry;

    geometry.computeVertexNormals();

    const records = getUniqueRecords(mesh);
    if (records.length === 0) return false;

    const centers = getBrushCenters(
      point.isVector3
        ? point
        : new THREE.Vector3(point.x, point.y, point.z)
    );

    const original = records.map(record =>
      record.position.clone()
    );

    const updates = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];

      const distance = getNearestDistance(
        original[i],
        centers
      );

      const influence = brushFalloff(distance, radius);

      if (influence <= 0) continue;

      const next = original[i].clone();
      const amount = strength * influence;

      if (mode === "pushpull") {
        // 表面の法線方向に押し出す・へこませる
        next.addScaledVector(record.normal, amount);
      }

      if (mode === "inflate") {
        // 頂点ごとの法線方向に膨らませる
        next.addScaledVector(
          record.normal,
          Math.abs(strength) * influence
        );
      }

      if (mode === "smooth") {
        const neighbors = record.neighbors;

        if (neighbors.size > 0) {
          const average = new THREE.Vector3();

          for (const neighbor of neighbors) {
            average.add(neighbor.position);
          }

          average.divideScalar(neighbors.size);

          const blend = THREE.MathUtils.clamp(
            Math.abs(strength) * influence,
            0,
            1
          );

          next.lerp(average, blend);
        }
      }

      updates.push({ record, next });
    }

    if (updates.length === 0) return false;

    const position = geometry.attributes.position;

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

  // 以前の選択頂点中心ブラシも互換用に残す
  function sculptSelected(radius, strength, mode) {
    const context = getContext();

    if (!context || context.selected.length === 0) {
      return false;
    }

    const centers = context.selected.map(vertex =>
      vertex.position.clone()
    );

    let changed = false;

    for (const center of centers) {
      changed = sculptAt(center, radius, strength, mode) || changed;
    }

    return changed;
  }

  function sculptPushPull(radius = 0.5, strength = 0.1) {
    return sculptSelected(radius, strength, "pushpull");
  }

  function sculptSmooth(radius = 0.5, strength = 0.5) {
    return sculptSelected(radius, strength, "smooth");
  }

  function sculptInflate(radius = 0.5, strength = 0.1) {
    return sculptSelected(radius, strength, "inflate");
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
    sculptAt,
    sculptPushPull,
    sculptSmooth,
    sculptInflate
  };
}
