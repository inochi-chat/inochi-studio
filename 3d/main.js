
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

import { createPropertyPanel } from "./app/property-panel.js";
import { createEditorUI } from "./app/editor-ui.js";
import { createSelectionSystem } from "./app/selection-controller.js";
import { createSelectionActions } from "./app/selection-actions.js";
import { createHistoryActions } from "./app/history-actions.js";
import { createGroupActions } from "./app/group-actions.js";
import { createMultiSelectionUI } from "./app/multi-selection-ui.js";

import { createTransformTool } from "./tools/transform-tool.js";
import { createHistoryManager } from "./history/history-manager.js";
import { createMaterialCommand } from "./history/material-command.js";
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
let editorUI;

function updateObjectList() {
  editorUI.updateObjectList();
}

function updateHierarchy() {
  editorUI.updateHierarchy();
}

function refreshEditorUI() {
  editorUI.refreshEditorUI();
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
// 13. プロパティ表示モジュール
// =====================================================

const propertyPanelController = createPropertyPanel({
  propertyPanel,

  getSelectedObject,

  isMeshEditing: () => meshEditing,

  isObjectEffectivelyLocked,

  onRefreshEditorUI: refreshEditorUI,

  onEnterMeshEditMode: enterMeshEditMode,

  onMaterialChange(object, before, after) {
    const command = createMaterialCommand(
      object,
      before,
      after,
      () => {
        refreshEditorUI();
        refreshProperties();
      }
    );

    history.execute(command);
  }
});

function refreshProperties() {
  propertyPanelController.refresh();
}

// =====================================================
// 14. 選択操作モジュール
// =====================================================

const selectionActions = createSelectionActions({
  objectManager,
  objectGroup,
  multiSelectionController,
  transform,

  isMeshEditing: () => meshEditing,

  isObjectEffectivelyLocked,

  refreshEditorUI,
  refreshProperties,

  setActiveGroup(group) {
    activeGroup = group;
  }
});

// =====================================================
// 15. 選択処理
// =====================================================

function selectPrimaryObject(object, selectedObjects = null) {
  selectionActions.selectPrimaryObject(
    object,
    selectedObjects
  );
}

function selectObject(object) {
  selectionActions.selectObject(object);
}

function selectGroup(group) {
  selectionActions.selectGroup(group);
}

// =====================================================
// 16. 履歴操作モジュール
// =====================================================

const historyActions = createHistoryActions({
  history,

  isMeshEditing: () => meshEditing,

  getMeshHistory: () => getMeshState().history,

  setActiveGroup(group) {
    activeGroup = group;
  },

  selectObject
});

// =====================================================
// 17. オブジェクト一覧
// =====================================================

objectListView = createObjectList(
  objectListContainer,
  selectObject
);

// =====================================================
// 18. グループ操作モジュール
// =====================================================

const groupActions = createGroupActions({
  objectGroup,
  history,
  refreshEditorUI,
  isEditing: () => meshEditing
});

function renameGroup(group, newName) {
  groupActions.renameGroup(group, newName);
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

editorUI = createEditorUI({
  objectManager,
  getSelectedObject,
  objectListView,
  hierarchyUI
});

// =====================================================
// 21. 履歴変更時
// =====================================================

function onHistoryChange(object) {
  historyActions.onHistoryChange(object);
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
// 25. 複数選択UIモジュール
// =====================================================

const multiSelectionUI = createMultiSelectionUI({
  button: multiSelectionButton,
  mode: multiSelectionMode,
  multiSelection,
  multiSelectionController,
  isEditing: () => meshEditing
});

// =====================================================
// 26. Undo・Redo
// =====================================================

function undo() {
  historyActions.undo();
}

function redo() {
  historyActions.redo();
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
