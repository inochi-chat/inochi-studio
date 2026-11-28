
import { createNameEditor } from "../properties/name.js";
import { createPositionEditor } from "../properties/position.js";
import { createRotationEditor } from "../properties/rotation.js";
import { createScaleEditor } from "../properties/scale.js";
import { createColorEditor } from "../properties/color.js";

export function createPropertyPanel({
  propertyPanel,
  getSelectedObject,
  isMeshEditing,
  isObjectEffectivelyLocked,
  onRefreshEditorUI,
  onEnterMeshEditMode
}) {
  function refresh() {
    propertyPanel.innerHTML = "";

    if (isMeshEditing()) {
      const message = document.createElement("p");
      message.className = "empty";
      message.textContent =
        "メッシュ編集モード中です。編集終了で通常のプロパティに戻ります。";

      propertyPanel.appendChild(message);
      return;
    }

    const object = getSelectedObject();

    if (!object) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent =
        "オブジェクトを選択すると、ここで詳細を編集できるよ。";

      propertyPanel.appendChild(empty);
      return;
    }

    if (isObjectEffectivelyLocked(object)) {
      const message = document.createElement("p");
      message.className = "empty";
      message.textContent =
        "このオブジェクトはロック中のため編集できません。";

      propertyPanel.appendChild(message);
      return;
    }

    const inner = document.createElement("div");
    inner.className = "properties-inner";

    const meshEditButton = document.createElement("button");

    meshEditButton.type = "button";
    meshEditButton.textContent = "🔷 メッシュ編集（Edit Mode）";
    meshEditButton.style.width = "100%";
    meshEditButton.style.minHeight = "48px";
    meshEditButton.style.marginBottom = "12px";
    meshEditButton.style.fontSize = "15px";
    meshEditButton.style.fontWeight = "bold";
    meshEditButton.style.cursor = "pointer";

    meshEditButton.addEventListener(
      "click",
      onEnterMeshEditMode
    );

    inner.appendChild(meshEditButton);

    inner.appendChild(
      createNameEditor(object, onRefreshEditorUI)
    );

    inner.appendChild(
      createPositionEditor(object, onRefreshEditorUI)
    );

    inner.appendChild(createRotationEditor(object));
    inner.appendChild(createScaleEditor(object));
    inner.appendChild(createColorEditor(object));

    propertyPanel.appendChild(inner);
  }

  return {
    refresh
  };
}
