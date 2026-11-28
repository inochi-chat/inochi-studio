
export function createEditorState() {
  return {
    // エディター状態
    initialized: false,

    // キャンバス
    canvas: null,
    context: null,

    // 画像
    image: null,
    images: [],

    // パーツ
    parts: [],
    selectedPartId: null,

    // ツール
    activeTool: "select",

    // カメラ
    zoom: 1,
    panX: 0,
    panY: 0,

    // メッシュ
    meshes: [],

    // デフォーマ
    deformers: [],

    // パラメータ
    parameters: [],

    // アニメーション
    animations: [],
    currentAnimationId: null,

    // タイムライン
    currentFrame: 0,
    playback: false,

    // 編集履歴
    history: [],
    historyIndex: -1,

    // プロジェクト
    project: {
      name: "Untitled Model",
      version: 1,
      modified: false
    },

    // UI
    panels: {
      parts: true,
      properties: true,
      parameters: true,
      timeline: true
    }
  };
}
