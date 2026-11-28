
import { initializeCanvas } from "../canvas/canvas-manager.js";
import { initializePartManager } from "../parts/part-manager.js";
import { initializeEditorEvents } from "./event-manager.js";

export function initializeEditor(state) {
  if (state.initialized) {
    return;
  }

  console.log("Inochi Live2D Editor: Initializing...");

  // キャンバス初期化
  initializeCanvas(state);

  // パーツ管理初期化
  initializePartManager(state);

  // イベント初期化
  initializeEditorEvents(state);

  // 初期化完了
  state.initialized = true;

  console.log("Inochi Live2D Editor: Ready");

  return state;
}
