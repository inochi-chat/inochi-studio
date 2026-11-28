
export function createMeshActionController({
  getState,
  getMeshEditor,
  getMeshOperations,
  isEditing,
  rebuild,
  exit
}) {
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

  function handleAction(action) {
    const state = getState();

    const meshPicker = state.picker;
    const meshHistory = state.history;
    const meshEditCommands = state.editCommands;

    if (!isEditing() || !meshPicker || !meshHistory) return;

    const meshEditor = getMeshEditor();
    const meshOperations = getMeshOperations();

    if (action.startsWith("transform:")) {
      const [, transformMode, rawValues] = action.split(":");
      const values = rawValues.split(",").map(Number);

      if (
        values.length !== 3 ||
        values.some(value => !Number.isFinite(value))
      ) {
        alert("変形数値が正しくありません。");
        return;
      }

      if (meshEditor.getSelectedVertices().length === 0) {
        alert("変形する頂点を選択してください。");
        return;
      }

      meshHistory.save();

      let success = false;

      if (transformMode === "move") {
        success = meshOperations.move(...values);
      }

      if (transformMode === "rotate") {
        const radians = values.map(value => value * Math.PI / 180);
        success = meshOperations.rotate(...radians);
      }

      if (transformMode === "scale") {
        success = meshOperations.scale(...values);
      }

      if (success) {
        rebuild();
      } else {
        meshHistory.undo();
      }

      return;
    }

    if (action.startsWith("sculpt:")) {
      const [, mode, rawRadius, rawStrength] = action.split(":");

      const radius = Number(rawRadius);
      const strength = Number(rawStrength);

      if (
        !Number.isFinite(radius) ||
        !Number.isFinite(strength) ||
        radius <= 0
      ) {
        alert("ブラシサイズと強さを正しく入力してください。");
        return;
      }

      if (meshEditor.getSelectedVertices().length === 0) {
        alert("スカルプトする頂点を選択してください。");
        return;
      }

      meshHistory.save();

      let success = false;

      if (mode === "pushpull") {
        success = meshOperations.sculptPushPull(radius, strength);
      }

      if (mode === "smooth") {
        success = meshOperations.sculptSmooth(radius, strength);
      }

      if (mode === "inflate") {
        success = meshOperations.sculptInflate(radius, strength);
      }

      if (success) {
        rebuild();
      } else {
        meshHistory.undo();
        alert("スカルプトを適用できませんでした。");
      }

      return;
    }

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
      exit();
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
        rebuild();
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
        rebuild();
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
        rebuild();
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

    if (action.startsWith("extrude:")) {
      if (selection.faces.length === 0) {
        alert("押し出す面を選択してください。");
        return;
      }

      const distance = Number(action.slice("extrude:".length));

      if (!Number.isFinite(distance)) {
        alert("正しい押し出し距離を入力してください。");
        return;
      }

      meshHistory.save();
      meshEditCommands.extrudeSelectedFaces(distance);
      return;
    }

    if (action === "extrude") {
      if (selection.faces.length === 0) {
        alert("押し出す面を選択してください。");
        return;
      }

      meshHistory.save();
      meshEditCommands.extrudeSelectedFaces(0.2);
      return;
    }

    if (action === "delete") {
      meshHistory.save();
      meshEditCommands.deleteSelection();
      return;
    }
  }

  return {
    handleAction
  };
}
