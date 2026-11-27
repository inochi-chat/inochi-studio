
import { createHierarchyDrag } from "./hierarchy-drag.js";
import { createVisibilityButton } from "./visibility-button.js";
import { createLockButton } from "./lock-button.js";

export function createHierarchyView(
  container,
  scene,
  hierarchy,
  onSelect,
  onSetParent,
  onRemoveParent,
  onMove,
  visibility,
  onVisibilityChange,
  objectLock,
  onLockChange,
  objectGroup,
  onSelectGroup,
  onRenameGroup
) {
  const collapsedObjects = new Set();

  const hierarchyDrag = createHierarchyDrag(
    container,
    onSetParent,
    onRemoveParent,
    onMove
  );

  function render(objects, selectedObject) {
    container.innerHTML = "";

    const groups = objectGroup
      ? objectGroup.getAllGroups()
      : [];

    const roots = objects.filter(object =>
      hierarchy.getParent(object) === null &&
      object.parent === scene
    );

    function createItem(object, depth = 0) {
      const wrapper = document.createElement("div");
      wrapper.className = "hierarchy-item";

      const children = hierarchy.getChildren(object);
      const hasChildren = children.length > 0;

      const row = document.createElement("div");
      row.className = "hierarchy-row";

      const toggle = document.createElement("button");
      toggle.className = "hierarchy-toggle";

      toggle.textContent = hasChildren
        ? (collapsedObjects.has(object) ? "▶" : "▼")
        : "";

      toggle.disabled = !hasChildren;

      toggle.addEventListener("click", () => {
        if (collapsedObjects.has(object)) {
          collapsedObjects.delete(object);
        } else {
          collapsedObjects.add(object);
        }

        render(objects, selectedObject);
      });

      const button = document.createElement("button");
      button.className = "object-item";
      button.textContent = object.name || "名称なし";
      button.title = object.name || "名称なし";
      button.style.paddingLeft = `${8 + depth * 16}px`;

      if (object === selectedObject) {
        button.classList.add("selected");
      }

      button.addEventListener("click", () => {
        onSelect(object);
      });

      hierarchyDrag.makeDraggable(button, object);

      const visibilityContainer = document.createElement("div");
      visibilityContainer.className = "visibility-container";

      createVisibilityButton(
        visibilityContainer,
        object,
        visibility,
        onVisibilityChange
      );

      const lockContainer = document.createElement("div");
      lockContainer.className = "lock-container";

      createLockButton(
        lockContainer,
        object,
        objectLock,
        onLockChange
      );

      row.append(
        toggle,
        button,
        visibilityContainer,
        lockContainer
      );

      wrapper.appendChild(row);

      if (hasChildren && !collapsedObjects.has(object)) {
        children.forEach(child => {
          wrapper.appendChild(
            createItem(child, depth + 1)
          );
        });
      }

      return wrapper;
    }

    // 通常オブジェクト
    roots.forEach(object => {
      container.appendChild(createItem(object));
    });

    // グループ
    groups.forEach(group => {
      const wrapper = document.createElement("div");
      wrapper.className = "hierarchy-item";

      const children = objectGroup.getGroupObjects(group);
      const hasChildren = children.length > 0;

      const row = document.createElement("div");
      row.className = "hierarchy-row";

      const toggle = document.createElement("button");
      toggle.className = "hierarchy-toggle";

      toggle.textContent = hasChildren
        ? (collapsedObjects.has(group) ? "▶" : "▼")
        : "";

      toggle.disabled = !hasChildren;

      toggle.addEventListener("click", () => {
        if (collapsedObjects.has(group)) {
          collapsedObjects.delete(group);
        } else {
          collapsedObjects.add(group);
        }

        render(objects, selectedObject);
      });

      const button = document.createElement("button");
      button.className = "object-item";
      button.textContent = `📦 ${group.name || "グループ"}`;
      button.title = group.name || "グループ";
      button.style.paddingLeft = "8px";

      button.addEventListener("click", () => {
        if (onSelectGroup) {
          onSelectGroup(group);
        }
      });

      // グループ名変更ボタン
      const renameButton = document.createElement("button");
      renameButton.className = "hierarchy-toggle";
      renameButton.textContent = "✏️";
      renameButton.title = "グループ名を変更";

      renameButton.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();

        const currentName = group.name || "グループ";
        const newName = prompt(
          "新しいグループ名を入力してください",
          currentName
        );

        if (newName === null) return;

        const trimmedName = newName.trim();

        if (!trimmedName) {
          alert("グループ名を入力してください。");
          return;
        }

        if (onRenameGroup) {
          onRenameGroup(group, trimmedName);
        }
      });

      
      // グループ表示・非表示ボタン
      const visibilityButton = document.createElement("button");
      visibilityButton.className = "hierarchy-toggle";
      visibilityButton.textContent =
        objectGroup.isGroupVisible(group) ? "👁" : "🙈";
      visibilityButton.title = "グループの表示・非表示";

      visibilityButton.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();

        objectGroup.toggleGroupVisibility(group);

        visibilityButton.textContent =
          objectGroup.isGroupVisible(group) ? "👁" : "🙈";
      });

      row.append(
        toggle,
        button,
        renameButton,
        visibilityButton
      );

      wrapper.appendChild(row);

      if (hasChildren && !collapsedObjects.has(group)) {
        children.forEach(child => {
          wrapper.appendChild(createItem(child, 1));
        });
      }

      container.appendChild(wrapper);
    });
  }

  return { render };
}
