
import * as THREE from "three";

export function createObjectGroup(scene, objectManager) {
  const groups = new Map();
  let groupCounter = 0;

  function isManaged(object) {
    return !!object &&
      objectManager.getAll().includes(object);
  }

  function createGroup(selectedObjects) {
    const targets = [...new Set(selectedObjects)]
      .filter(object => isManaged(object));

    if (targets.length < 2) return null;

    // 既存の親子関係がある場合は安全のため禁止
    for (const object of targets) {
      if (object.parent !== scene) return null;
      if (object.children.length > 0) return null;
    }

    const group = new THREE.Group();

    groupCounter++;
    group.name = `Group_${groupCounter}`;

    scene.add(group);

    // 選択オブジェクトの中心にグループを配置
    const center = new THREE.Vector3();

    for (const object of targets) {
      center.add(object.position);
    }

    center.divideScalar(targets.length);
    group.position.copy(center);

    // ワールド座標を維持してグループへ移動
    for (const object of targets) {
      group.attach(object);
    }

    groups.set(group, [...targets]);

    return group;
  }

  function ungroup(group) {
    if (!groups.has(group)) return false;

    const children = [...group.children];

    for (const child of children) {
      scene.attach(child);
    }

    scene.remove(group);
    groups.delete(group);

    return true;
  }

  function isGroup(object) {
    return groups.has(object);
  }

  function getGroupObjects(group) {
    return groups.has(group)
      ? [...groups.get(group)]
      : [];
  }

  function getAllGroups() {
    return [...groups.keys()];
  }

  return {
    createGroup,
    ungroup,
    isGroup,
    getGroupObjects,
    getAllGroups
  };
}
