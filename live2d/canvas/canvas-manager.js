
export function initializeCanvas(state) {
  const canvas = document.getElementById("live2dCanvas");

  if (!canvas) {
    throw new Error("Live2D canvas element was not found.");
  }

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not create 2D canvas context.");
  }

  state.canvas = canvas;
  state.context = context;

  // キャンバスのサイズを調整
  resizeCanvas(state);

  // ウィンドウサイズ変更時に再調整
  window.addEventListener("resize", () => {
    resizeCanvas(state);
  });

  // キャンバス領域のサイズ変更にも対応
  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(() => {
      resizeCanvas(state);
    });

    observer.observe(canvas);

    state.canvasResizeObserver = observer;
  }

  console.log("Canvas Manager: Ready");

  return canvas;
}

export function resizeCanvas(state) {
  const canvas = state.canvas;

  if (!canvas) {
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;

  const width = Math.max(1, Math.round(rect.width * pixelRatio));
  const height = Math.max(1, Math.round(rect.height * pixelRatio));

  // 表示サイズに合わせて内部解像度を設定
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  // 高解像度ディスプレイに対応
  state.context.setTransform(
    pixelRatio,
    0,
    0,
    pixelRatio,
    0,
    0
  );

  state.canvasWidth = rect.width;
  state.canvasHeight = rect.height;
}
