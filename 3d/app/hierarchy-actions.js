
import {
  createSetParentCommand,
  createRemoveParentCommand
} from "../history/hierarchy-commands.js";

import {
  createMoveHierarchyObjectCommand
} from "../history/hierarchy-order-commands.js";

import { createVisibilityCommand } from "../history/visibility-command.js";
import { createLockCommand } from "../history/lock-command.js";

export function createHierarchyActions({
  hierarchy,
  hierarchyOrder,
  visibility,
  objectLock,
  multiSelection,
  multiSelectionController,
  getSelectedObject,
  isObjectEffectivelyLocked,
  isEditing,
  history,
  refreshEditorUI,
  refreshProperties
}) {
  function setObjectParent(child, parent) {
    if (isEditing()) return;

    if (
      isObjectEffectivelyLocked(child) ||
      isObjectEffectivelyLocked(parent)
    ) {
      alert("ロック中のオブジェクトは親子関係を変更できません。");
      return;
    }

    if (!hierarchy.canSetParent(child, parent)) {
      alert("この親子関係は設定できません。");
      return;
    }

    const command = createSetParentCommand(
      hierarchy,
      child,
      parent,
      () => {
        refreshEditorUI();
        refreshProperties();
      }
    );

    if (command) history.execute(command);
  }

  function removeObjectParent(child) {
    if (isEditing()) return;

    if (isObjectEffectivelyLocked(child)) {
      alert("ロック中のオブジェクトは親子関係を変更できません。");
      return;
    }

    const command = createRemoveParentCommand(
      hierarchy,
      child,
      () => {
        refreshEditorUI();
        refreshProperties();
      }
    );

    if (command) history.execute(command);
  }

  function moveHierarchyObject(object, target, position) {
    if (isEditing()) return;

    if (
      isObjectEffectivelyLocked(object) ||
      isObjectEffectivelyLocked(target)
    ) {
      return;
    }

    if (!hierarchyOrder.canMove(object, target)) return;

    const siblings = hierarchyOrder.getSiblings(object);
    const oldIndex = hierarchyOrder.getIndex(object);
    const targetIndex = siblings.indexOf(target);

    if (oldIndex < 0 || targetIndex < 0) return;

    let newIndex = targetIndex +
      (position === "after" ? 1 : 0);

    if (oldIndex < newIndex) newIndex--;

    if (oldIndex === newIndex) return;

    const command = createMoveHierarchyObjectCommand(
      hierarchyOrder,
      object,
      newIndex,
      refreshEditorUI
    );

    if (command) history.execute(command);
  }

  function handleVisibilityChange(object, newVisible) {
    if (isEditing()) return;

    const command = createVisibilityCommand(
      visibility,
      object,
      newVisible,
      refreshEditorUI
    );

    if (command) history.execute(command);
  }

  function handleLockChange(object, newLocked) {
    if (isEditing()) return;

    const command = createLockCommand(
      objectLock,
      object,
      newLocked,
      () => {
        if (
          objectLock.isLocked(object) &&
          multiSelection.has(object)
        ) {
          multiSelectionController.select(
            getSelectedObject() === object
              ? null
              : getSelectedObject(),
            false
          );
        } else {
          refreshEditorUI();
          refreshProperties();
        }
      }
    );

    if (command) history.execute(command);
  }

  return {
    setObjectParent,
    removeObjectParent,
    moveHierarchyObject,
    handleVisibilityChange,
    handleLockChange
  };
}
