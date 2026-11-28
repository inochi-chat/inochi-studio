
import { createGeometry } from "../objects/object-factory.js";

import {
  createAddObjectCommand,
  createDeleteObjectCommand,
  createDeleteObjectsCommand,
  createDuplicateObjectCommand,
  createDuplicateObjectsCommand
} from "../history/object-commands.js?v=4";

import {
  createGroupCommand,
  createUngroupCommand,
  createDeleteGroupCommand
} from "../history/group-commands.js";

export function createObjectActions({
  objectManager,
  objectGroup,
  multiSelection,
  multiSelectionController,
  transform,
  history,
  hierarchy,
  isObjectEffectivelyLocked,
  isEditing,
  getSelectedObject,
  getActiveGroup,
  setActiveGroup,
  onHistoryChange,
  refreshEditorUI,
  refreshProperties
}) {
  function addObject(type) {
    if (isEditing()) return;

    const geometry = createGeometry(type);
    if (!geometry) return;

    const command = createAddObjectCommand(
      objectManager,
      geometry,
      type,
      onHistoryChange
    );

    history.execute(command);
  }

  function addCube() {
    addObject("cube");
  }

  function addSphere() {
    addObject("sphere");
  }

  function addCylinder() {
    addObject("cylinder");
  }

  function deleteSelectedObject() {
    if (isEditing()) return;

    const activeGroup = getActiveGroup();

    if (activeGroup && objectGroup.isGroup(activeGroup)) {
      if (objectGroup.isGroupLocked(activeGroup)) {
        alert("ロック中のグループは削除できません。先にロックを解除してください。");
        return;
      }

      const targetGroup = activeGroup;

      const command = createDeleteGroupCommand(
        objectGroup,
        objectManager,
        targetGroup,
        group => {
          setActiveGroup(group);

          if (group) {
            transform.attach(group);
          } else {
            transform.detach();
          }

          refreshEditorUI();
          refreshProperties();
        }
      );

      transform.detach();
      history.execute(command);
      return;
    }

    const selectedObjects = multiSelection.getAll();

    const targets = selectedObjects.length > 1
      ? selectedObjects
      : [getSelectedObject()].filter(Boolean);

    if (targets.length === 0) return;

    for (const object of targets) {
      if (isObjectEffectivelyLocked(object)) {
        alert("ロック中のオブジェクトが含まれているため削除できません。");
        return;
      }

      if (hierarchy.hasChildren(object)) {
        alert("子オブジェクトがあるものは、先に子オブジェクトを解除してください。");
        return;
      }
    }

    transform.detach();

    const command = targets.length === 1
      ? createDeleteObjectCommand(
          objectManager,
          targets[0],
          onHistoryChange
        )
      : createDeleteObjectsCommand(
          objectManager,
          targets,
          onHistoryChange
        );

    multiSelectionController.clear();
    setActiveGroup(null);

    history.execute(command);

    refreshEditorUI();
    refreshProperties();
  }

  function duplicateSelectedObject() {
    if (isEditing()) return;

    const activeGroup = getActiveGroup();

    if (activeGroup && objectGroup.isGroup(activeGroup)) {
      alert("グループの複製機能は現在準備中です。");
      return;
    }

    const selectedObjects = multiSelection.getAll();

    const targets = selectedObjects.length > 0
      ? selectedObjects
      : [getSelectedObject()].filter(Boolean);

    if (targets.length === 0) return;

    for (const object of targets) {
      if (isObjectEffectivelyLocked(object)) {
        alert("ロック中のオブジェクトが含まれているため複製できません。");
        return;
      }

      if (hierarchy.hasChildren(object)) {
        alert("子オブジェクトがあるものが含まれています。現在は複製できません。");
        return;
      }
    }

    const command = targets.length === 1
      ? createDuplicateObjectCommand(
          objectManager,
          targets[0],
          onHistoryChange
        )
      : createDuplicateObjectsCommand(
          objectManager,
          targets,
          onHistoryChange
        );

    transform.detach();
    multiSelectionController.clear();
    setActiveGroup(null);

    history.execute(command);

    refreshEditorUI();
    refreshProperties();
  }

  function groupSelectedObjects() {
    if (isEditing()) return;

    if (getActiveGroup()) {
      alert("すでにグループが選択されています。");
      return;
    }

    const selectedObjects = multiSelection.getAll();

    const targets = selectedObjects.length > 0
      ? selectedObjects
      : [getSelectedObject()].filter(Boolean);

    if (targets.length < 2) {
      alert("グループ化するオブジェクトを2個以上選択してください。");
      return;
    }

    for (const object of targets) {
      if (isObjectEffectivelyLocked(object)) {
        alert("ロック中のオブジェクトが含まれているためグループ化できません。");
        return;
      }

      if (hierarchy.hasChildren(object)) {
        alert("子オブジェクトがあるものは現在グループ化できません。");
        return;
      }
    }

    transform.detach();
    multiSelectionController.clear();
    setActiveGroup(null);

    const command = createGroupCommand(
      objectGroup,
      targets,
      group => {
        setActiveGroup(group);

        if (group) {
          transform.attach(group);
        } else {
          transform.detach();
        }

        refreshEditorUI();
        refreshProperties();
      }
    );

    history.execute(command);
  }

  function ungroupSelectedObject() {
    if (isEditing()) return;

    const activeGroup = getActiveGroup();

    if (!activeGroup || !objectGroup.isGroup(activeGroup)) {
      alert("グループを選択してください。");
      return;
    }

    if (objectGroup.isGroupLocked(activeGroup)) {
      alert("ロック中のグループは解除できません。先にロックを解除してください。");
      return;
    }

    const group = activeGroup;

    transform.detach();

    const command = createUngroupCommand(
      objectGroup,
      group,
      result => {
        setActiveGroup(result || null);

        if (result) {
          transform.attach(result);
        } else {
          transform.detach();
        }

        refreshEditorUI();
        refreshProperties();
      }
    );

    if (command) {
      history.execute(command);
    }
  }

  return {
    addObject,
    addCube,
    addSphere,
    addCylinder,
    deleteSelectedObject,
    duplicateSelectedObject,
    groupSelectedObjects,
    ungroupSelectedObject
  };
}
