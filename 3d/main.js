
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { initializeEditor } from "./core/editor-init.js";

import { createGeometry } from "./objects/object-factory.js";
import { createObjectManager } from "./objects/object-manager.js";
import { createObjectList } from "./objects/object-list.js";
import { createHierarchyUI } from "./objects/hierarchy-ui.js";
import { createObjectHierarchy } from "./objects/object-hierarchy.js";
import { createHierarchyOrder } from "./objects/hierarchy-order.js";
import { createObjectVisibility } from "./objects/object-visibility.js";
import { createObjectLock } from "./objects/object-lock.js";

import { createNameEditor } from "./properties/name.js";
import { createPositionEditor } from "./properties/position.js";
import { createRotationEditor } from "./properties/rotation.js";
import { createScaleEditor } from "./properties/scale.js";
import { createColorEditor } from "./properties/color.js";

import { createObjectSelection } from "./selection/object-selection.js";
import { createMultiSelection } from "./selection/multi-selection.js";
import { createMultiSelectionVisual } from "./selection/multi-selection-visual.js";
import { createMultiSelectionController } from "./selection/multi-selection-controller.js";
import { createMultiSelectionMode } from "./selection/multi-selection-mode.js";

import { createTransformTool } from "./tools/transform-tool.js";
import { createHistoryManager } from "./history/history-manager.js";
import { createObjectGroup } from "./objects/object-group.js";

import {
  createAddObjectCommand,
  createDeleteObjectCommand,
  createDeleteObjectsCommand,
  createDuplicateObjectCommand,
  createDuplicateObjectsCommand
} from "./history/object-commands.js?v=4";

import {
  createSetParentCommand,
  createRemoveParentCommand
} from "./history/hierarchy-commands.js";

import {
  createMoveHierarchyObjectCommand
} from "./history/hierarchy-order-commands.js";

import {
  createVisibilityCommand
} from "./history/visibility-command.js";

import {
  createLockCommand
} from "./history/lock-command.js";

import { createDuplicateButton } from "./objects/duplicate-button.js";

import {
  createGroupCommand,
  createUngroupCommand,
  createRenameGroupCommand,
  createDeleteGroupCommand
} from "./history/group-commands.js";

// 1. HTML要素
const canvas = document.querySelector("#threeCanvas");
const propertyPanel = document.querySelector("#propertyPanel");
const objectListContainer = document.querySelector("#objectList");
const hierarchyListContainer = document.querySelector("#hierarchyList");
const hierarchyControlsContainer = document.querySelector("#hierarchyControls");
const multiSelectionButton = document.querySelector("#multiSelectionButton");

if (
  !canvas ||
  !propertyPanel ||
  !objectListContainer ||
  !hierarchyListContainer ||
  !hierarchyControlsContainer
) {
  throw new Error("3DエディターのHTML要素が見つかりません");
}


// 2. エディター初期化
const { scene, camera, renderer } = initializeEditor(canvas);


// 3. 管理システム
const objectManager = createObjectManager(scene);
const hierarchy = createObjectHierarchy(scene, objectManager);
const objectGroup = createObjectGroup(scene, objectManager);

let activeGroup = null;

const hierarchyOrder = createHierarchyOrder(objectManager, scene);
const visibility = createObjectVisibility();
const objectLock = createObjectLock();
const history = createHistoryManager(100);


// 4. 複数選択システム
const multiSelection = createMultiSelection();
const multiSelectionVisual = createMultiSelectionVisual();
const multiSelectionMode = createMultiSelectionMode();

function getSelectedObject() {
  return objectManager.getSelected();
}


// 5. ロック確認
function isObjectEffectivelyLocked(object) {
  if (!object) return false;

  let current = object;

  while (current && current !== scene) {
    if (objectLock.isLocked(current)) {
      return true;
    }

    if (
      objectGroup.isGroup(current) &&
      objectGroup.isGroupLocked(current)
    ) {
      return true;
    }

    current = current.parent;
  }

  return false;
}


// 6. UI更新
let objectListView;
let hierarchyUI;

function updateObjectList() {
  objectListView.render(
    objectManager.getAll(),
    getSelectedObject()
  );
}

function updateHierarchy() {
  hierarchyUI.update(
    objectManager.getAll(),
    getSelectedObject()
  );
}

function refreshEditorUI() {
  updateObjectList();
  updateHierarchy();
}


// 7. カメラ操作
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.dampingFactor = 0.08;


// 8. 変形ツール
const transform = createTransformTool(
  camera,
  renderer,
  scene,
  orbit,
  objectLock,
  objectGroup
);

transform.addEventListener("mouseUp", () => {
  refreshProperties();
});


// 9. プロパティ表示
function refreshProperties() {
  propertyPanel.innerHTML = "";

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

  inner.appendChild(createNameEditor(object, refreshEditorUI));
  inner.appendChild(createPositionEditor(object, refreshEditorUI));
  inner.appendChild(createRotationEditor(object));
  inner.appendChild(createScaleEditor(object));
  inner.appendChild(createColorEditor(object));

  propertyPanel.appendChild(inner);
}


// 10. メイン選択の更新
function selectPrimaryObject(object, selectedObjects = null) {
  activeGroup = null;

  if (object && isObjectEffectivelyLocked(object)) {
    object = null;
    selectedObjects = [];
  }

  objectManager.select(object);

  const selectedObject = getSelectedObject();

  if (selectedObjects && selectedObjects.length > 1) {
    transform.attachMultiple(selectedObjects);
  } else if (selectedObject) {
    transform.attach(selectedObject);
  } else {
    transform.detach();
  }

  refreshEditorUI();
  refreshProperties();
}


// 11. 複数選択の管理
const multiSelectionController = createMultiSelectionController({
  multiSelection,
  visual: multiSelectionVisual,
  objectManager,
  objectLock,
  onChange(selectedObjects) {
    selectPrimaryObject(
      selectedObjects[0] ?? null,
      selectedObjects
    );
  }
});


// 12. 通常の単体選択
function selectObject(object) {
  if (object && isObjectEffectivelyLocked(object)) {
    alert("ロック中のオブジェクトは選択・編集できません。");
    return;
  }

  activeGroup = null;
  multiSelectionController.select(object, false);
}


// 13. オブジェクト一覧
objectListView = createObjectList(
  objectListContainer,
  selectObject
);


// 14. グループ選択
function selectGroup(group) {
  if (!group || !objectGroup.isGroup(group)) return;

  multiSelectionController.clear();

  activeGroup = group;

  objectManager.select(null);

  transform.attach(group);

  refreshEditorUI();
  refreshProperties();
}


// 15. グループ名変更
function renameGroup(group, newName) {
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


// 16. 階層UI
hierarchyUI = createHierarchyUI({
  listContainer: hierarchyListContainer,
  controlsContainer: hierarchyControlsContainer,
  scene,
  hierarchy,
  onSelect: selectObject,
  onSetParent: setObjectParent,
  onRemoveParent: removeObjectParent,
  onMove: moveHierarchyObject,
  visibility,
  onVisibilityChange: handleVisibilityChange,
  objectLock,
  onLockChange: handleLockChange,
  objectGroup,
  onSelectGroup: selectGroup,
  onRenameGroup: renameGroup
});


// 17. 履歴変更時
function onHistoryChange(object) {
  activeGroup = null;
  selectObject(object);
}


// 18. オブジェクト追加
function addObject(type) {
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


// 19. オブジェクト削除

function deleteSelectedObject() {
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
        activeGroup = group;

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

  // 通常オブジェクトの削除
  // 既存の削除処理をここに残す
}


// 20. オブジェクト複製
function duplicateSelectedObject() {
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
  activeGroup = null;

  history.execute(command);

  refreshEditorUI();
  refreshProperties();
}


// 21. 複製ボタン
createDuplicateButton({
  button: document.querySelector("#duplicateObject"),
  getSelectedObject,
  onDuplicate: duplicateSelectedObject
});


// 22. グループ化
function groupSelectedObjects() {
  if (activeGroup) {
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
  activeGroup = null;

  const command = createGroupCommand(
    objectGroup,
    targets,
    group => {
      activeGroup = group;

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


// 23. グループ解除
function ungroupSelectedObject() {
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
      activeGroup = result || null;

      if (result) {
        transform.attach(result);
      } else {
        transform.detach();
      }

      refreshEditorUI();
      refreshProperties();
    }
  );

  history.execute(command);
}


// 24. グループ操作ボタン
document
  .querySelector("#groupObjects")
  ?.addEventListener("click", groupSelectedObjects);

document
  .querySelector("#ungroupObjects")
  ?.addEventListener("click", ungroupSelectedObject);


// 25. 親子関係の設定
function setObjectParent(child, parent) {
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

  if (command) {
    history.execute(command);
  }
}


// 26. 親子関係の解除
function removeObjectParent(child) {
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

  if (command) {
    history.execute(command);
  }
}


// 27. 階層の並び替え
function moveHierarchyObject(object, target, position) {
  if (
    isObjectEffectivelyLocked(object) ||
    isObjectEffectivelyLocked(target)
  ) {
    return;
  }

  if (!hierarchyOrder.canMove(object, target)) {
    return;
  }

  const siblings = hierarchyOrder.getSiblings(object);

  const oldIndex = hierarchyOrder.getIndex(object);
  const targetIndex = siblings.indexOf(target);

  if (oldIndex < 0 || targetIndex < 0) return;

  let newIndex = targetIndex +
    (position === "after" ? 1 : 0);

  if (oldIndex < newIndex) {
    newIndex--;
  }

  if (oldIndex === newIndex) return;

  const command = createMoveHierarchyObjectCommand(
    hierarchyOrder,
    object,
    newIndex,
    refreshEditorUI
  );

  if (command) {
    history.execute(command);
  }
}


// 28. 表示・非表示の変更
function handleVisibilityChange(object, newVisible) {
  const command = createVisibilityCommand(
    visibility,
    object,
    newVisible,
    refreshEditorUI
  );

  if (command) {
    history.execute(command);
  }
}


// 29. ロック・ロック解除
function handleLockChange(object, newLocked) {
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

  if (command) {
    history.execute(command);
  }
}


// 30. 複数選択モード
function updateMultiSelectionButton() {
  if (!multiSelectionButton) return;

  const enabled = multiSelectionMode.isEnabled();

  multiSelectionButton.textContent = enabled
    ? "☑ 複数選択：ON"
    : "☐ 複数選択：OFF";

  multiSelectionButton.classList.toggle("active", enabled);
}

multiSelectionButton?.addEventListener("click", () => {
  const enabled = multiSelectionMode.toggle();

  if (!enabled) {
    const selectedObjects = multiSelection.getAll();

    multiSelectionController.select(
      selectedObjects[0] ?? null,
      false
    );
  }

  updateMultiSelectionButton();
});

updateMultiSelectionButton();


// 31. Undo・Redo
function undo() {
  history.undo();
}

function redo() {
  history.redo();
}


// 32. 3D画面からの選択
createObjectSelection({
  camera,
  renderer,
  objectManager,
  transform,
  objectLock,
  multiSelectionController,
  multiSelectionMode,
  onSelect: selectObject
});


// 33. ボタン接続
document.querySelector("#addCube")
  ?.addEventListener("click", addCube);

document.querySelector("#addSphere")
  ?.addEventListener("click", addSphere);

document.querySelector("#addCylinder")
  ?.addEventListener("click", addCylinder);

document.querySelector("#moveTool")
  ?.addEventListener("click", () => {
    transform.setMode("translate");
  });

document.querySelector("#rotateTool")
  ?.addEventListener("click", () => {
    transform.setMode("rotate");
  });

document.querySelector("#scaleTool")
  ?.addEventListener("click", () => {
    transform.setMode("scale");
  });

document.querySelector("#deleteObject")
  ?.addEventListener("click", deleteSelectedObject);

document.querySelector("#undoButton")
  ?.addEventListener("click", undo);

document.querySelector("#redoButton")
  ?.addEventListener("click", redo);


// 34. キーボードショートカット
document.addEventListener("keydown", event => {
  const target = event.target;

  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target?.isContentEditable
  ) {
    return;
  }

  if (!(event.ctrlKey || event.metaKey)) return;

  if (event.key.toLowerCase() === "z") {
    event.preventDefault();

    if (event.shiftKey) {
      redo();
    } else {
      undo();
    }
  }

  if (event.key.toLowerCase() === "y") {
    event.preventDefault();
    redo();
  }
});


// 35. 初期キューブ
const initialCubeGeometry = createGeometry("cube");

const initialCube = objectManager.add(
  initialCubeGeometry,
  "Cube"
);

if (initialCube) {
  selectObject(initialCube);
}


// 36. 描画ループ
function animate() {
  requestAnimationFrame(animate);

  orbit.update();
  multiSelectionVisual.update();

  renderer.render(scene, camera);
}

animate();

console.log("Inochi Studio 3D Editor Ready");
