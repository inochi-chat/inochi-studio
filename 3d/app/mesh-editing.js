
import { createMeshTopology } from "../tools/mesh-topology.js";
import { createMeshVisuals } from "../tools/mesh-visuals.js";
import { createMeshPicker } from "../tools/mesh-picker.js";
import { createMeshGizmo } from "../tools/mesh-gizmo.js";
import { createMeshEditCommands } from "../tools/mesh-edit-commands.js";
import { createMeshHistory } from "../tools/mesh-history.js";

export function createMeshEditing({
  scene,
  camera,
  renderer,
  orbit,
  meshEditor,
  meshOperations,
  sculptController,
  getSelectedObject,
  getActiveGroup,
  isObjectEffectivelyLocked,
  getSelectedObjects,
  transform,
  selectPrimaryObject,
  refreshProperties,
  propertyPanel,
  container,
  getSculptSettings,
  getSelectionSettings,
  getGizmoVisible
}) {
  let editing = false;
  let activeMesh = null;

  let topology = null;
  let visuals = null;
  let picker = null;
  let gizmo = null;
  let history = null;
  let editCommands = null;
  let toolbar = null;

  function setToolbar(value) {
    toolbar = value;
  }

  function rebuild() {
    if (!editing || !activeMesh) return;

    picker?.dispose();
    visuals?.dispose();
    gizmo?.dispose();

    picker = null;
    visuals = null;
    gizmo = null;

    topology = createMeshTopology(activeMesh);

    visuals = createMeshVisuals({
      mesh: activeMesh,
      topology
    });

    gizmo = createMeshGizmo({
      scene,
      camera,
      renderer,
      mesh: activeMesh,
      topology,
      operations: meshOperations,
      meshEditor,
      meshHistory: history,
      orbitControls: orbit
    });

    gizmo.setVisible(getGizmoVisible());

    picker = createMeshPicker({
      camera,
      renderer,
      orbitControls: orbit,
      mesh: activeMesh,
      topology,
      visuals,
      meshEditor,

      onSelectionChange(selection) {
        const vertexIds = new Set();

        for (const id of selection.vertices) {
          vertexIds.add(id);
        }

        for (const id of selection.edges) {
          const edge = topology.getEdge(id);
          if (!edge) continue;

          for (const vertexId of edge.vertices) {
            vertexIds.add(vertexId);
          }
        }

        for (const id of selection.faces) {
          const face = topology.getFace(id);
          if (!face) continue;

          for (const vertexId of face.vertices) {
            vertexIds.add(vertexId);
          }
        }

        const ids = [...vertexIds];

        meshEditor.setSelectedVertices(ids);
        gizmo?.update(ids);
      },

      onSculptStroke(stroke) {
        sculptController.handleStroke(stroke);
      }
    });

    const selection = getSelectionSettings();
    const sculpt = getSculptSettings();

    picker.setMode(selection.mode);
    picker.setMultiSelect(selection.multiSelect);
    picker.setSculptMode(sculpt.enabled, sculpt.mode);

    meshEditor.refreshVertexPositions();
    meshEditor.clearSelection();

    gizmo?.update([]);
  }

  function showEditingMessage() {
    propertyPanel.innerHTML = "";

    const message = document.createElement("p");
    message.className = "empty";
    message.textContent =
      "メッシュ編集モード中です。頂点・辺・面を選択して編集できます。";

    propertyPanel.appendChild(message);
  }

  function enter() {
    if (editing) return false;

    if (getActiveGroup()) {
      alert("グループではなく、メッシュオブジェクトを選択してください。");
      return false;
    }

    const selected = getSelectedObject();

    if (!selected || !selected.isMesh) {
      alert("メッシュオブジェクトを選択してください。");
      return false;
    }

    if (isObjectEffectivelyLocked(selected)) {
      alert("ロック中のオブジェクトは編集できません。");
      return false;
    }

    const selectedObjects = getSelectedObjects();

    if (
      selectedObjects.length > 1 ||
      (selectedObjects.length === 1 && selectedObjects[0] !== selected)
    ) {
      alert("メッシュ編集は1つのオブジェクトだけを選択して行ってください。");
      return false;
    }

    if (!meshEditor.enterEditMode(selected)) {
      return false;
    }

    editing = true;
    activeMesh = selected;

    transform.detach();

    toolbar?.setMode("vertex");
    toolbar?.setMultiSelect(false);
    toolbar?.setEditing(true);

    container.hidden = false;

    history = createMeshHistory({
      mesh: activeMesh,
      maxHistory: 50,
      onRestore() {
        rebuild();
      }
    });

    editCommands = createMeshEditCommands({
      mesh: activeMesh,

      getTopology() {
        return topology;
      },

      getSelection() {
        return picker?.getSelection() ?? null;
      },

      onChange() {
        rebuild();
      }
    });

    rebuild();
    showEditingMessage();

    return true;
  }

  function exit() {
    if (!editing) return;

    const previousMesh = activeMesh;

    editing = false;
    sculptController.resetStroke();

    picker?.dispose();
    visuals?.dispose();
    gizmo?.dispose();
    history?.dispose();

    picker = null;
    visuals = null;
    gizmo = null;
    topology = null;
    history = null;
    editCommands = null;

    meshEditor.exitEditMode();

    activeMesh = null;

    toolbar?.setEditing(false);
    container.hidden = true;

    orbit.enabled = true;

    if (
      previousMesh &&
      selectPrimaryObject
    ) {
      selectPrimaryObject(previousMesh);
    } else {
      transform.detach();
    }

    refreshProperties();
  }

  function getState() {
    return {
      editing,
      activeMesh,
      topology,
      picker,
      gizmo,
      history,
      editCommands
    };
  }

  return {
    enter,
    exit,
    rebuild,
    setToolbar,

    setSelectionMode(mode) {
      picker?.setMode(mode);
    },

    setMultiSelect(enabled) {
      picker?.setMultiSelect(enabled);
    },

    setSculptMode(enabled, mode) {
      picker?.setSculptMode(enabled, mode);
    },

    setGizmoVisible(visible) {
      gizmo?.setVisible(visible);
    },

    getState,

    isEditing() {
      return editing;
    },

    getActiveMesh() {
      return activeMesh;
    }
  };
}
