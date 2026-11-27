
import * as THREE from "three";

export function createObjectGroup(scene, objectManager) {
  const groups = new Map();
  const groupVisibility = new Map();
  const groupLocks = new Map();

  // 削除したグループの情報を一時保存
  const deletedGroups = new WeakMap();

  let groupCounter = 0;

  function isManaged(object) {
    return !!object &&
      objectManager.getAll().includes(object);
  }

  function createGroup(selectedObjects) {
    const targets = [...new Set(selectedObjects)]
      .filter(object => isManaged(object));

    if (targets.length < 2) return null;

    for (const object of targets) {
      if (object.parent !== scene) return null;
      if (object.children.length > 0) return null;
    }

    const group = new THREE.Group();

    groupCounter++;
    group.name = `Group_${groupCounter}`;

    scene.add(group);

    const center = new THREE.Vector3();

    for (const object of targets) {
      center.add(object.position);
    }

    center.divideScalar(targets.length);
    group.position.copy(center);

    for (const object of targets) {
      group.attach(object);
    }

    groups.set(group, [...targets]);
    groupVisibility.set(group, true);
    groupLocks.set(group, false);

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
    groupVisibility.delete(group);
    groupLocks.delete(group);

    return true;
  }

  // グループを削除する
  // 子オブジェクトは呼び出し元で先に退避する
  function deleteGroup(group) {
    if (!groups.has(group)) return false;

    deletedGroups.set(group, {
      children: [...groups.get(group)],
      visible: isGroupVisible(group),
      locked: isGroupLocked(group)
    });

    scene.remove(group);
    groups.delete(group);

    return true;
  }

  // 削除したグループを復元する
  function restoreGroup(group) {
    if (!group || groups.has(group)) return false;

    const info = deletedGroups.get(group);

    if (!info) return false;

    scene.add(group);

    groups.set(group, [...info.children]);
    groupVisibility.set(group, info.visible);
    groupLocks.set(group, info.locked);

    group.visible = info.visible;

    deletedGroups.delete(group);

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

  // 表示・非表示
  function setGroupVisible(group, visible) {
    if (!groups.has(group)) return false;

    const isVisible = Boolean(visible);

    group.visible = isVisible;
    groupVisibility.set(group, isVisible);

    return true;
  }

  function isGroupVisible(group) {
    if (!groups.has(group)) return false;

    return groupVisibility.get(group) ?? true;
  }

  function toggleGroupVisibility(group) {
    if (!groups.has(group)) return false;

    return setGroupVisible(
      group,
      !isGroupVisible(group)
    );
  }

  // ロック・ロック解除
  function setGroupLocked(group, locked) {
    if (!groups.has(group)) return false;

    groupLocks.set(group, Boolean(locked));

    return true;
  }

  function isGroupLocked(group) {
    if (!groups.has(group)) return false;

    return groupLocks.get(group) ?? false;
  }

  function toggleGroupLock(group) {
    if (!groups.has(group)) return false;

    return setGroupLocked(
      group,
      !isGroupLocked(group)
    );
  }

  return {
    createGroup,
    ungroup,
    deleteGroup,
    restoreGroup,
    isGroup,
    getGroupObjects,
    getAllGroups,

    setGroupVisible,
    isGroupVisible,
    toggleGroupVisibility,

    setGroupLocked,
    isGroupLocked,
    toggleGroupLock
  };
}
