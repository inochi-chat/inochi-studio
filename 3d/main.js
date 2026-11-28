
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createGeometry } from "./objects/object-factory.js";
import { initializeEditor } from "./core/editor-init.js";

import { createObjectManager } from "./objects/object-manager.js";
import { createObjectList } from "./objects/object-list.js";
import { createHierarchyUI } from "./objects/hierarchy-ui.js";
import { createObjectHierarchy } from "./objects/object-hierarchy.js";
import { createHierarchyOrder } from "./objects/hierarchy-order.js";
import { createObjectVisibility } from "./objects/object-visibility.js";
import { createObjectLock } from "./objects/object-lock.js";
import { createObjectGroup } from "./objects/object-group.js";
import { createDuplicateButton } from "./objects/duplicate-button.js";

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

import {
  createSetParentCommand,
  createRemoveParentCommand
} from "./history/hierarchy-commands.js";

import {
  createMoveHierarchyObjectCommand
} from "./history/hierarchy-order-commands.js";

import { createVisibilityCommand } from "./history/visibility-command.js";
import { createLockCommand } from "./history/lock-command.js";

import {
  createRenameGroupCommand
} from "./history/group-commands.js";

import { createMeshEditor } from "./tools/mesh-editor.js";
import { createMeshOperations } from "./tools/mesh-operations.js";

import { createMeshToolbar } from "./tools/mesh-toolbar.js?v=2";

import { createMeshSculptController } from "./app/mesh-sculpt.js";
import { createMeshEditing } from "./app/mesh-editing.js";
import { createMeshActions } from "./app/mesh-actions.js?v=2";
import { createObjectActions } from "./app/object-actions.js";

// =====================================================
// 1. HTML要素
// =====================================================

const canvas = document.querySelector("#threeCanvas");
const propertyPanel = document.querySelector("#propertyPanel");
const objectListContainer = document.querySelector("#objectList");
const hierarchyListContainer = document.querySelector("#hierarchyList");
const hierarchyControlsContainer = document.querySelector("#hierarchyControls");
const multiSelectionButton = document.querySelector("#multiSelectionButton");
const meshToolbarContainer = document.querySelector("#meshToolbarContainer");

if (
  !canvas ||
  !propertyPanel ||
  !objectListContainer ||
  !hierarchyListContainer ||
  !hierarchyControlsContainer ||
  !meshToolbarContainer
) {
  throw new Error("3DエディターのHTML要素が見つかりません");
}

// =====================================================
// 2. エディター初期化
// =====================================================

const { scene, camera, renderer } = initializeEditor(canvas);

// =====================================================
// 3. 管理システム
// =====================================================

const objectManager = createObjectManager(scene);
const hierarchy = createObjectHierarchy(scene, objectManager);
const objectGroup = createObjectGroup(scene, objectManager);

let activeGroup = null;

const hierarchyOrder = createHierarchyOrder(objectManager, scene);
const visibility = createObjectVisibility();
const objectLock = createObjectLock();
const history = createHistoryManager(100);

let meshEditing = false;

// =====================================================
// 4. 複数選択システム
// =====================================================

const multiSelection = createMultiSelection();
const multiSelectionVisual = createMultiSelectionVisual();
const multiSelectionMode = createMultiSelectionMode();

function getSelectedObject() {
  return objectManager.getSelected();
}

// =====================================================
// 5. ロック確認
// =====================================================

function isObjectEffectivelyLocked(object) {
  if (!object) return false;

  let current = object;

  while (current && current !== scene) {
    if (objectLock.isLocked(current)) return true;

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

// =====================================================
// 6. UI更新
// =====================================================

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

// =====================================================
// 7. カメラ操作
// =====================================================

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.dampingFactor = 0.08;

// =====================================================
// 8. 変形ツール
// =====================================================

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

// =====================================================
// 9. メッシュ編集システム
// =====================================================

const meshEditor = createMeshEditor({
  scene,
  camera,
  renderer,
  orbitControls: orbit
});

const meshOperations = createMeshOperations(meshEditor);

let meshSelectionMode = "vertex";
let meshMultiSelect = false;

let meshGizmoVisible = true;

let meshSculptEnabled = false;
let meshSculptMode = "pushpull";
let meshSculptRadius = 0.5;
let meshSculptStrength = 0.1;

let meshEditingController = null;

// メッシュ編集状態を取得
function getMeshState() {
  return meshEditingController?.getState() ?? {};
}

// メッシュ編集用の再構築
function rebuildMeshTools() {
  meshEditingController?.rebuild();
}

// スカルプト処理
const meshSculptController = createMeshSculptController({
  getOperations: () => meshOperations,

  getHistory: () => getMeshState().history,

  isEditing: () => meshEditing,

  isEnabled: () => meshSculptEnabled,

  getRadius: () => meshSculptRadius,

  getStrength: () => meshSculptStrength,

  getMode: () => meshSculptMode,

  onStrokeEnd(changed) {
    if (!changed) return;

    requestAnimationFrame(() => {
      if (
        meshEditing &&
        meshEditingController?.getActiveMesh()
      ) {
        rebuildMeshTools();
      }
    });
  }
});

// メッシュ編集管理モジュール
meshEditingController = createMeshEditing({
  scene,
  camera,
  renderer,
  orbit,

  meshEditor,
  meshOperations,

  sculptController: meshSculptController,

  getSelectedObject,

  getActiveGroup: () => activeGroup,

  isObjectEffectivelyLocked,

  getSelectedObjects: () => multiSelection.getAll(),

  transform,

  selectPrimaryObject,

  refreshProperties,

  propertyPanel,

  container: meshToolbarContainer,

  getSculptSettings: () => ({
    enabled: meshSculptEnabled,
    mode: meshSculptMode
  }),

  getSelectionSettings: () => ({
    mode: meshSelectionMode,
    multiSelect: meshMultiSelect
  }),

  getGizmoVisible: () => meshGizmoVisible
});

// メッシュ編集終了
function exitMeshEditMode() {
  if (!meshEditing) return;

  meshEditing = false;

  meshEditingController.exit();
}

// メッシュ編集開始
function enterMeshEditMode() {
  if (meshEditing) return;

  meshSelectionMode = "vertex";
  meshMultiSelect = false;

  const success = meshEditingController.enter();

  meshEditing = success;
}

// =====================================================
// 10. メッシュツールバー
// =====================================================

const meshToolbar = createMeshToolbar({
  container: meshToolbarContainer,

  onModeChange(mode) {
    meshSelectionMode = mode;
    meshEditingController.setSelectionMode(mode);
  },

  onMultiSelectChange(enabled) {
    meshMultiSelect = enabled;
    meshEditingController.setMultiSelect(enabled);
  },

  onAction(action) {
    meshActions.run(action);
  },

  onGizmoVisibilityChange(visible) {
    meshGizmoVisible = visible;
    meshEditingController.setGizmoVisible(visible);
  },

  onMirrorChange(enabled) {
    meshOperations.setMirrorX(enabled);
  },

  onSculptModeChange(enabled, mode, radius, strength) {
    meshSculptEnabled = enabled;
    meshSculptMode = mode;

    if (Number.isFinite(radius) && radius > 0) {
      meshSculptRadius = radius;
    }

    if (Number.isFinite(strength)) {
      meshSculptStrength = strength;
    }

    meshEditingController.setSculptMode(
      meshSculptEnabled,
      meshSculptMode
    );
  }
});

meshEditingController.setToolbar(meshToolbar);

meshToolbar.setEditing(false);
meshToolbarContainer.hidden = true;

// =====================================================
// 11. プロパティ表示
// =====================================================

function refreshProperties() {
  propertyPanel.innerHTML = "";

  if (meshEditing) {
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

  meshEditButton.addEventListener("click", enterMeshEditMode);
  inner.appendChild(meshEditButton);

  inner.appendChild(createNameEditor(object, refreshEditorUI));
  inner.appendChild(createPositionEditor(object, refreshEditorUI));
  inner.appendChild(createRotationEditor(object));
  inner.appendChild(createScaleEditor(object));
  inner.appendChild(createColorEditor(object));

  propertyPanel.appendChild(inner);
}

// =====================================================
// 12. メイン選択の更新
// =====================================================

function selectPrimaryObject(object, selectedObjects = null) {
  if (meshEditing) return;

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

// =====================================================
// 13. 複数選択の管理
// =====================================================

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

// =====================================================
// 14. 通常の単体選択
// =====================================================

function selectObject(object) {
  if (meshEditing) return;

  if (object && isObjectEffectivelyLocked(object)) {
    alert("ロック中のオブジェクトは選択・編集できません。");
    return;
  }

  activeGroup = null;
  multiSelectionController.select(object, false);
}

// =====================================================
// 15. オブジェクト一覧
// =====================================================

objectListView = createObjectList(
  objectListContainer,
  selectObject
);

// =====================================================
// 16. グループ選択
// =====================================================

function selectGroup(group) {
  if (meshEditing) return;
  if (!group || !objectGroup.isGroup(group)) return;

  multiSelectionController.clear();
  activeGroup = group;
  objectManager.select(null);
  transform.attach(group);

  refreshEditorUI();
  refreshProperties();
}

// =====================================================
// 17. グループ名変更
// =====================================================

function renameGroup(group, newName) {
  if (meshEditing) return;
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

// =====================================================
// 18. 階層UI
// =====================================================

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

// =====================================================
// 19. 履歴変更時
// =====================================================

function onHistoryChange(object) {
  if (meshEditing) return;

  activeGroup = null;
  selectObject(object);
}

// =====================================================
// 20. オブジェクト操作モジュール
// =====================================================

const objectActions = createObjectActions({
  objectManager,
  objectGroup,
  multiSelection,
  multiSelectionController,
  transform,
  history,
  hierarchy,
  isObjectEffectivelyLocked,
  isEditing: () => meshEditing,
  getSelectedObject,
  getActiveGroup: () => activeGroup,

  setActiveGroup(group) {
    activeGroup = group;
  },

  onHistoryChange,
  refreshEditorUI,
  refreshProperties
});

// =====================================================
// 21. メッシュ操作モジュール
// =====================================================

const meshActions = createMeshActions({
  meshEditor,
  meshOperations,

  getMeshState,

  isEditing: () => meshEditing,

  rebuildMeshTools,

  exitMeshEditMode
});

// =====================================================
// 22. グループ操作ボタン
// =====================================================

document
  .querySelector("#groupObjects")
  ?.addEventListener(
    "click",
    objectActions.groupSelectedObjects
  );

document
  .querySelector("#ungroupObjects")
  ?.addEventListener(
    "click",
    objectActions.ungroupSelectedObject
  );

// =====================================================
// 23. 親子関係の設定
// =====================================================

function setObjectParent(child, parent) {
  if (meshEditing) return;

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

// =====================================================
// 24. 親子関係の解除
// =====================================================

function removeObjectParent(child) {
  if (meshEditing) return;

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

// =====================================================
// 25. 階層の並び替え
// =====================================================

function moveHierarchyObject(object, target, position) {
  if (meshEditing) return;

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

  if (command) {
    history.execute(command);
  }
}

// =====================================================
// 26. 表示・非表示の変更
// =====================================================

function handleVisibilityChange(object, newVisible) {
  if (meshEditing) return;

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

// =====================================================
// 27. ロック・ロック解除
// =====================================================

function handleLockChange(object, newLocked) {
  if (meshEditing) return;

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

// =====================================================
// 28. 複数選択モード
// =====================================================

function updateMultiSelectionButton() {
  if (!multiSelectionButton) return;

  const enabled = multiSelectionMode.isEnabled();

  multiSelectionButton.textContent = enabled
    ? "☑ 複数選択：ON"
    : "☐ 複数選択：OFF";

  multiSelectionButton.classList.toggle("active", enabled);
}

multiSelectionButton?.addEventListener("click", () => {
  if (meshEditing) return;

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

// =====================================================
// 29. Undo・Redo
// =====================================================

function undo() {
  if (meshEditing) {
    getMeshState().history?.undo();
    return;
  }

  history.undo();
}

function redo() {
  if (meshEditing) {
    getMeshState().history?.redo();
    return;
  }

  history.redo();
}

// =====================================================
// 30. 3D画面からの通常選択
// =====================================================

const objectSelection = createObjectSelection({
  camera,
  renderer,
  objectManager,
  transform,
  objectLock,
  multiSelectionController,
  multiSelectionMode,
  onSelect: selectObject,

  isEnabled() {
    return !meshEditing;
  }
});

// =====================================================
// 31. ボタン接続
// =====================================================

document.querySelector("#addCube")
  ?.addEventListener("click", objectActions.addCube);

document.querySelector("#addSphere")
  ?.addEventListener("click", objectActions.addSphere);

document.querySelector("#addCylinder")
  ?.addEventListener("click", objectActions.addCylinder);

document.querySelector("#moveTool")
  ?.addEventListener("click", () => {
    if (!meshEditing) transform.setMode("translate");
  });

document.querySelector("#rotateTool")
  ?.addEventListener("click", () => {
    if (!meshEditing) transform.setMode("rotate");
  });

document.querySelector("#scaleTool")
  ?.addEventListener("click", () => {
    if (!meshEditing) transform.setMode("scale");
  });

document.querySelector("#deleteObject")
  ?.addEventListener(
    "click",
    objectActions.deleteSelectedObject
  );

document.querySelector("#undoButton")
  ?.addEventListener("click", undo);

document.querySelector("#redoButton")
  ?.addEventListener("click", redo);

// =====================================================
// 32. キーボードショートカット
// =====================================================

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

// =====================================================
// 33. 初期キューブ
// =====================================================

const initialCubeGeometry = createGeometry("cube");

const initialCube = objectManager.add(
  initialCubeGeometry,
  "Cube"
);

if (initialCube) {
  selectObject(initialCube);
}

// =====================================================
// 34. 描画ループ
// =====================================================

function animate() {
  requestAnimationFrame(animate);

  orbit.update();
  multiSelectionVisual.update();

  renderer.render(scene, camera);
}

animate();

console.log("Inochi Studio 3D Editor Ready");
