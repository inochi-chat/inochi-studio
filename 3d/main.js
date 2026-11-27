
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

// メッシュ編集
import { createMeshEditor } from "./tools/mesh-editor.js";
import { createMeshOperations } from "./tools/mesh-operations.js";
import { createMeshTopology } from "./tools/mesh-topology.js";
import { createMeshVisuals } from "./tools/mesh-visuals.js";
import { createMeshPicker } from "./tools/mesh-picker.js";
import { createMeshEditCommands } from "./tools/mesh-edit-commands.js";
import { createMeshHistory } from "./tools/mesh-history.js";
import { createMeshToolbar } from "./tools/mesh-toolbar.js";


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

let meshTopology = null;
let meshVisuals = null;
let meshPicker = null;
let meshHistory = null;
let meshEditCommands = null;
let activeMesh = null;

let meshSelectionMode = "vertex";
let meshMultiSelect = false;


// メッシュ編集用の選択・表示を再構築
function rebuildMeshTools() {
  if (!activeMesh || !meshEditing) return;

  meshPicker?.dispose();
  meshVisuals?.dispose();

  meshPicker = null;
  meshVisuals = null;

  meshTopology = createMeshTopology(activeMesh);

  meshVisuals = createMeshVisuals({
    mesh: activeMesh,
    topology: meshTopology
  });

  
  meshPicker = createMeshPicker({
    camera,
    renderer,
    orbitControls: orbit,
    mesh: activeMesh,
    topology: meshTopology,
    visuals: meshVisuals,
    meshEditor,

    onSelectionChange(selection) {
      // 頂点・辺・面の選択を頂点選択へ変換
      // これにより辺・面の操作にも頂点変形を利用できる
      const vertexIds = new Set();

      for (const id of selection.vertices) {
        vertexIds.add(id);
      }

      for (const id of selection.edges) {
        const edge = meshTopology.getEdge(id);

        if (!edge) continue;

        for (const vertexId of edge.vertices) {
          vertexIds.add(vertexId);
        }
      }

      for (const id of selection.faces) {
        const face = meshTopology.getFace(id);

        if (!face) continue;

        for (const vertexId of face.vertices) {
          vertexIds.add(vertexId);
        }
      }

      meshEditor.setSelectedVertices([...vertexIds]);
    }
  });

  meshPicker.setMode(meshSelectionMode);
  meshPicker.setMultiSelect(meshMultiSelect);

  meshEditor.refreshVertexPositions();
  meshEditor.clearSelection();
}


// メッシュ編集終了
function exitMeshEditMode() {
  if (!meshEditing) return;

  const previousMesh = activeMesh;

  meshEditing = false;

  meshPicker?.dispose();
  meshVisuals?.dispose();
  meshHistory?.dispose();

  meshPicker = null;
  meshVisuals = null;
  meshTopology = null;
  meshHistory = null;
  meshEditCommands = null;

  meshEditor.exitEditMode();

  activeMesh = null;

  meshToolbar.setEditing(false);
  meshToolbarContainer.hidden = true;

  orbit.enabled = true;

  if (previousMesh && objectManager.getAll().includes(previousMesh)) {
    selectPrimaryObject(previousMesh);
  } else {
    transform.detach();
  }

  refreshProperties();
}


// メッシュ編集開始
function enterMeshEditMode() {
  if (meshEditing) return;

  if (activeGroup) {
    alert("グループではなく、メッシュオブジェクトを選択してください。");
    return;
  }

  const selected = getSelectedObject();

  if (!selected || !selected.isMesh) {
    alert("メッシュオブジェクトを選択してください。");
    return;
  }

  if (isObjectEffectivelyLocked(selected)) {
    alert("ロック中のオブジェクトは編集できません。");
    return;
  }

  const selectedObjects = multiSelection.getAll();

  if (
    selectedObjects.length > 1 ||
    (selectedObjects.length === 1 && selectedObjects[0] !== selected)
  ) {
    alert("メッシュ編集は1つのオブジェクトだけを選択して行ってください。");
    return;
  }

  meshEditing = true;
  activeMesh = selected;

  transform.detach();

  if (!meshEditor.enterEditMode(activeMesh)) {
    meshEditing = false;
    activeMesh = null;
    return;
  }

  meshSelectionMode = "vertex";
  meshMultiSelect = false;

  meshToolbar.setMode("vertex");
  meshToolbar.setMultiSelect(false);
  meshToolbar.setEditing(true);

  meshToolbarContainer.hidden = false;

  meshHistory = createMeshHistory({
    mesh: activeMesh,
    maxHistory: 50,
    onRestore() {
      rebuildMeshTools();
    }
  });

  meshEditCommands = createMeshEditCommands({
    mesh: activeMesh,

    getTopology() {
      return meshTopology;
    },

    getSelection() {
      return meshPicker?.getSelection() ?? null;
    },

    onChange() {
      rebuildMeshTools();
    }
  });

  rebuildMeshTools();

  propertyPanel.innerHTML = "";

  const message = document.createElement("p");
  message.className = "empty";
  message.textContent =
    "メッシュ編集モード中です。頂点・辺・面を選択して編集できます。";

  propertyPanel.appendChild(message);
}


// 数値入力
function askVector(title, defaultValue) {
  const answer = window.prompt(
    `${title}\nX, Y, Z の順にカンマ区切りで入力してください。`,
    defaultValue
  );

  if (answer === null) return null;

  const values = answer.split(",").map(value => Number(value.trim()));

  if (
    values.length !== 3 ||
    values.some(value => !Number.isFinite(value))
  ) {
    alert("数値を3つ入力してください。例：0, 0.2, 0");
    return null;
  }

  return values;
}


// メッシュ編集操作
function runMeshAction(action) {
  if (!meshEditing || !meshPicker || !meshHistory) return;

  const selection = meshPicker.getSelection();

  if (action === "clear") {
    meshPicker.clearSelection();
    return;
  }

  if (action === "undo") {
    meshHistory.undo();
    return;
  }

  if (action === "redo") {
    meshHistory.redo();
    return;
  }

  if (action === "editMode" || action === "objectMode") {
    exitMeshEditMode();
    return;
  }

  if (action === "move") {
    if (meshEditor.getSelectedVertices().length === 0) {
      alert("移動する頂点を選択してください。");
      return;
    }

    const values = askVector("頂点の移動量", "0, 0.2, 0");
    if (!values) return;

    meshHistory.save();

    if (meshOperations.move(...values)) {
      rebuildMeshTools();
    }

    return;
  }

  if (action === "rotate") {
    if (meshEditor.getSelectedVertices().length === 0) {
      alert("回転する頂点を選択してください。");
      return;
    }

    const values = askVector("回転角度（度）", "0, 0, 15");
    if (!values) return;

    const radians = values.map(value => value * Math.PI / 180);

    meshHistory.save();

    if (meshOperations.rotate(...radians)) {
      rebuildMeshTools();
    }

    return;
  }

  if (action === "scale") {
    if (meshEditor.getSelectedVertices().length === 0) {
      alert("拡大・縮小する頂点を選択してください。");
      return;
    }

    const values = askVector("拡大・縮小倍率", "1.2, 1.2, 1.2");
    if (!values) return;

    meshHistory.save();

    if (meshOperations.scale(...values)) {
      rebuildMeshTools();
    }

    return;
  }

  if (action === "subdivide") {
    if (selection.edges.length === 0) {
      alert("分割する辺を選択してください。");
      return;
    }

    meshHistory.save();
    meshEditCommands.subdivideSelectedEdges();
    return;
  }

  if (action === "extrude") {
    if (selection.faces.length === 0) {
      alert("押し出す面を選択してください。");
      return;
    }

    const answer = window.prompt("押し出す距離を入力してください。", "0.2");

    if (answer === null) return;

    const distance = Number(answer);

    if (!Number.isFinite(distance)) {
      alert("正しい数値を入力してください。");
      return;
    }

    meshHistory.save();
    meshEditCommands.extrudeSelectedFaces(distance);
    return;
  }

  if (action === "delete") {
    const hasSelection =
      selection.vertices.length > 0 ||
      selection.edges.length > 0 ||
      selection.faces.length > 0;

    if (!hasSelection) {
      alert("削除する頂点・辺・面を選択してください。");
      return;
    }

    meshHistory.save();
    meshEditCommands.deleteSelection();
  }
}


// メッシュツールバー
const meshToolbar = createMeshToolbar({
  container: meshToolbarContainer,

  onModeChange(mode) {
    meshSelectionMode = mode;
    meshPicker?.setMode(mode);
  },

  onMultiSelectChange(enabled) {
    meshMultiSelect = enabled;
    meshPicker?.setMultiSelect(enabled);
  },

  onAction(action) {
    runMeshAction(action);
  }
});

meshToolbar.setEditing(false);
meshToolbarContainer.hidden = true;


// =====================================================
// 10. プロパティ表示
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

  
  if (true) {
    const meshEditButton = document.createElement("button");

    meshEditButton.type = "button";
    meshEditButton.textContent = "🔷 メッシュ編集（Edit Mode）";

    meshEditButton.style.width = "100%";
    meshEditButton.style.minHeight = "48px";
    meshEditButton.style.marginBottom = "12px";
    meshEditButton.style.fontSize = "15px";
    meshEditButton.style.fontWeight = "bold";
    meshEditButton.style.cursor = "pointer";

    meshEditButton.addEventListener("click", () => {
      enterMeshEditMode();
    });

    inner.appendChild(meshEditButton);
  }

  
  inner.appendChild(createNameEditor(object, refreshEditorUI));
  inner.appendChild(createPositionEditor(object, refreshEditorUI));
  inner.appendChild(createRotationEditor(object));
  inner.appendChild(createScaleEditor(object));
  inner.appendChild(createColorEditor(object));

  propertyPanel.appendChild(inner);
}


// =====================================================
// 11. メイン選択の更新
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
// 12. 複数選択の管理
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
// 13. 通常の単体選択
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
// 14. オブジェクト一覧
// =====================================================

objectListView = createObjectList(
  objectListContainer,
  selectObject
);


// =====================================================
// 15. グループ選択
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
// 16. グループ名変更
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
// 17. 階層UI
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
// 18. 履歴変更時
// =====================================================

function onHistoryChange(object) {
  if (meshEditing) return;

  activeGroup = null;
  selectObject(object);
}


// =====================================================
// 19. オブジェクト追加
// =====================================================

function addObject(type) {
  if (meshEditing) return;

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


// =====================================================
// 20. オブジェクト削除
// =====================================================

function deleteSelectedObject() {
  if (meshEditing) return;

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
  activeGroup = null;

  history.execute(command);

  refreshEditorUI();
  refreshProperties();
}


// =====================================================
// 21. オブジェクト複製
// =====================================================

function duplicateSelectedObject() {
  if (meshEditing) return;

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


// =====================================================
// 22. 複製ボタン
// =====================================================

createDuplicateButton({
  button: document.querySelector("#duplicateObject"),
  getSelectedObject,
  onDuplicate: duplicateSelectedObject
});


// =====================================================
// 23. グループ化
// =====================================================

function groupSelectedObjects() {
  if (meshEditing) return;

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


// =====================================================
// 24. グループ解除
// =====================================================

function ungroupSelectedObject() {
  if (meshEditing) return;

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


// =====================================================
// 25. グループ操作ボタン
// =====================================================

document
  .querySelector("#groupObjects")
  ?.addEventListener("click", groupSelectedObjects);

document
  .querySelector("#ungroupObjects")
  ?.addEventListener("click", ungroupSelectedObject);


// =====================================================
// 26. 親子関係の設定
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
// 27. 親子関係の解除
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
// 28. 階層の並び替え
// =====================================================

function moveHierarchyObject(object, target, position) {
  if (meshEditing) return;

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


// =====================================================
// 29. 表示・非表示の変更
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
// 30. ロック・ロック解除
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
// 31. 複数選択モード
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
// 32. Undo・Redo
// =====================================================

function undo() {
  if (meshEditing) {
    meshHistory?.undo();
    return;
  }

  history.undo();
}

function redo() {
  if (meshEditing) {
    meshHistory?.redo();
    return;
  }

  history.redo();
}


// =====================================================
// 33. 3D画面からの通常選択
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
// 34. ボタン接続
// =====================================================

document.querySelector("#addCube")
  ?.addEventListener("click", addCube);

document.querySelector("#addSphere")
  ?.addEventListener("click", addSphere);

document.querySelector("#addCylinder")
  ?.addEventListener("click", addCylinder);

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
  ?.addEventListener("click", deleteSelectedObject);

document.querySelector("#undoButton")
  ?.addEventListener("click", undo);

document.querySelector("#redoButton")
  ?.addEventListener("click", redo);


// =====================================================
// 35. キーボードショートカット
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
// 36. 初期キューブ
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
// 37. 描画ループ
// =====================================================

function animate() {
  requestAnimationFrame(animate);

  orbit.update();
  multiSelectionVisual.update();

  renderer.render(scene, camera);
}

animate();

console.log("Inochi Studio 3D Editor Ready");
