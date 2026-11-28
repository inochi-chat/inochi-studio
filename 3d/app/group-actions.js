
export function createGroupActions({
  objectGroup,
  history,
  refreshEditorUI,
  isEditing
}) {
  function renameGroup(group, newName) {
    if (isEditing()) return;
    if (!group || !objectGroup.isGroup(group)) return;

    if (objectGroup.isGroupLocked(group)) {
      alert("ロック中のグループ名は変更できません。");
      return;
    }

    const command = createRenameGroupCommand(
      group,
      newName,
      refreshEditorUI
    );

    history.execute(command);
  }

  return {
    renameGroup
  };
}

import { createRenameGroupCommand } from "../history/group-commands.js";
