
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

import { createNameEditor } from "./properties/name.js";
import { createPositionEditor } from "./properties/position.js";
import { createRotationEditor } from "./properties/rotation.js";
import { createScaleEditor } from "./properties/scale.js";
import { createColorEditor } from "./properties/color.js";

import { createSelectionSystem } from "./app/selection-controller.js";

import { createTransformTool } from "./tools/transform-tool.js";
import { createHistoryManager } from "./history/history-manager.js";

import { createRenameGroupCommand } from "./history/group-commands.js";

import { createMeshEditor } from "./tools/mesh-editor.js";
import { createMeshOperations } from "./tools/mesh-operations.js";
import { createMeshToolbar } from "./tools/mesh-toolbar.js?v=2";

import { createMeshSculptController } from "./app/mesh-sculpt.js";
import { createMeshEditing } from "./app/mesh-editing.js";
import { createMeshActions } from "./app/mesh-actions.js?v=2";
import { createObjectActions } from "./app/object-actions.js";
import { createHierarchyActions } from "./app/hierarchy-actions.js";

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

function getSelectedObject() {
  return objectManager.getSelected();
}

// =====================================================
// 4. ロック確認
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
// 5. UI更新
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
// 6. カメラ操作
// =====================================================

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.dampingFactor = 0.08;

// =====================================================
// 7. 変形ツール
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
// 8. 選択システム
// =====================================================

const selectionSystem = createSelectionSystem({
  objectManager,
  objectLock,

  onChange(selectedObjects) {
    selectPrimaryObject(
      selectedObjects[0] ?? null,
      selectedObjects
    );
  }
});

const multiSelection = selectionSystem.multiSelection;
const multiSelectionVisual = selectionSystem.visual;
const multiSelectionMode = selectionSystem.mode;
const multiSelectionController = selectionSystem.controller;

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

function getMeshState() {
  return meshEditingController?.getState() ?? {};
}

function rebuildMeshTools() {
  meshEditingController?.rebuild();
}

// =====================================================
// 10. スカルプト処理
// =====================================================

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

// =====================================================
// 11. メッシュ編集管理モジュール
// =====================================================

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

function exitMeshEditMode() {
  if (!meshEditing) return;

  meshEditing = false;

  meshEditingController.exit();
}

function enterMeshEditMode() {
  if (meshEditing) return;

  meshSelectionMode = "vertex";
  meshMultiSelect = false;

  const success = meshEditingController.enter();

  meshEditing = success;
}

// =====================================================
// 12. メッシュツールバー
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
// 13. プロパティ表示
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
// 14. メイン選択の更新
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
// 15. 通常の単体選択
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
// 16. オブジェクト一覧
// =====================================================

objectListView = createObjectList(
  objectListContainer,
  selectObject
);

// =====================================================
// 17. グループ選択
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
// 18. グループ名変更
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
// 19. 階層操作モジュール
// =====================================================

const hierarchyActions = createHierarchyActions({
  hierarchy,
  hierarchyOrder,
  visibility,
  objectLock,
  multiSelection,
  multiSelectionController,
  getSelectedObject,
  isObjectEffectivelyLocked,
  isEditing: () => meshEditing,
  history,
  refreshEditorUI,
  refreshProperties
});

// =====================================================
// 20. 階層UI
// =====================================================

hierarchyUI = createHierarchyUI({
  listContainer: hierarchyListContainer,
  controlsContainer: hierarchyControlsContainer,
  scene,
  hierarchy,

  onSelect: selectObject,
  onSetParent: hierarchyActions.setObjectParent,
  onRemoveParent: hierarchyActions.removeObjectParent,
  onMove: hierarchyActions.moveHierarchyObject,

  visibility,
  onVisibilityChange: hierarchyActions.handleVisibilityChange,

  objectLock,
  onLockChange: hierarchyActions.handleLockChange,

  objectGroup,
  onSelectGroup: selectGroup,
  onRenameGroup: renameGroup
});

// =====================================================
// 21. 履歴変更時
// =====================================================

function onHistoryChange(object) {
  if (meshEditing) return;

  activeGroup = null;
  selectObject(object);
}

// =====================================================
// 22. オブジェクト操作モジュール
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
// 23. メッシュ操作モジュール
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
// 24. グループ操作ボタン
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
// 25. 複数選択モード
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
// 26. Undo・Redo
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
// 27. 3D画面からの通常選択
// =====================================================

const objectSelection = selectionSystem.createObjectPicker({
  camera,
  renderer,
  transform,
  onSelect: selectObject,

  isEnabled() {
    return !meshEditing;
  }
});

// =====================================================
// 28. ボタン接続
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
// 29. キーボードショートカット
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
// 30. 初期キューブ
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
// 31. 描画ループ
// =====================================================

function animate() {
  requestAnimationFrame(animate);

  orbit.update();
  multiSelectionVisual.update();

  renderer.render(scene, camera);
}

animate();

console.log("Inochi Studio 3D Editor Ready");
