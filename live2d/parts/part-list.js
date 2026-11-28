
import {
  selectPart,
  renamePart,
  setPartVisibility,
  setPartLocked,
  removePart
} from "./part-manager.js";

export function initializePartList(state) {
  state.partListElement = document.getElementById("partsList");

  if (!state.partListElement) {
    throw new Error("Parts list element was not found.");
  }

  renderPartList(state);

  console.log("Part List: Ready");
}

export function renderPartList(state) {
  const container = state.partListElement;

  if (!container) {
    return;
  }

  container.innerHTML = "";

  if (state.parts.length === 0) {
    container.innerHTML = `
      <div class="empty-message">
        まだパーツがありません
      </div>
    `;
    return;
  }

  state.parts.forEach((part) => {
    const item = document.createElement("div");

    item.className = "part-list-item";

    if (part.id === state.selectedPartId) {
      item.classList.add("active");
    }

    const name = document.createElement("span");
    name.className = "part-name";
    name.textContent = part.name;

    const controls = document.createElement("div");
    controls.className = "part-controls";

    const visibilityButton = createButton(
      part.visible ? "表示" : "非表示",
      "visibility-button"
    );

    const lockButton = createButton(
      part.locked ? "🔒" : "🔓",
      "lock-button"
    );

    const renameButton = createButton(
      "✎",
      "rename-button"
    );

    const deleteButton = createButton(
      "×",
      "delete-button"
    );

    item.addEventListener("click", () => {
      selectPart(state, part.id);
      renderPartList(state);

      if (typeof state.onPartSelected === "function") {
        state.onPartSelected(part);
      }
    });

    visibilityButton.addEventListener("click", (event) => {
      event.stopPropagation();

      setPartVisibility(state, part.id, !part.visible);

      renderPartList(state);

      state.requestRender?.();
    });

    lockButton.addEventListener("click", (event) => {
      event.stopPropagation();

      setPartLocked(state, part.id, !part.locked);

      renderPartList(state);
    });

    renameButton.addEventListener("click", (event) => {
      event.stopPropagation();

      const newName = window.prompt(
        "パーツ名を入力してください",
        part.name
      );

      if (newName !== null && renamePart(state, part.id, newName)) {
        renderPartList(state);
      }
    });

    deleteButton.addEventListener("click", (event) => {
      event.stopPropagation();

      if (!window.confirm(`「${part.name}」を削除しますか？`)) {
        return;
      }

      removePart(state, part.id);

      renderPartList(state);

      state.requestRender?.();
    });

    controls.append(
      visibilityButton,
      lockButton,
      renameButton,
      deleteButton
    );

    item.append(name, controls);

    container.appendChild(item);
  });
}

function createButton(label, className) {
  const button = document.createElement("button");

  button.type = "button";
  button.textContent = label;
  button.className = className;

  return button;
}
