
export function renderCanvas(state) {
  const canvas = state.canvas;
  const context = state.context;

  if (!canvas || !context) {
    return;
  }

  const width = state.canvasWidth || canvas.clientWidth;
  const height = state.canvasHeight || canvas.clientHeight;

  // キャンバスをクリア
  context.clearRect(0, 0, width, height);

  // 背景
  drawBackground(context, width, height);

  // グリッド
  if (state.gridEnabled) {
    drawGrid(state, context, width, height);
  }

  // 画像・パーツ
  drawParts(state, context);

  // 選択中パーツ
  drawSelection(state, context);
}

function drawBackground(context, width, height) {
  context.save();

  context.fillStyle = "#151620";
  context.fillRect(0, 0, width, height);

  context.restore();
}

function drawGrid(state, context, width, height) {
  const gridSize = 24 * state.zoom;

  if (gridSize < 4) {
    return;
  }

  const offsetX = width / 2 + state.panX;
  const offsetY = height / 2 + state.panY;

  context.save();

  context.strokeStyle = "rgba(255,255,255,0.06)";
  context.lineWidth = 1;

  context.beginPath();

  const startX = ((offsetX % gridSize) + gridSize) % gridSize;
  const startY = ((offsetY % gridSize) + gridSize) % gridSize;

  for (let x = startX; x < width; x += gridSize) {
    context.moveTo(x, 0);
    context.lineTo(x, height);
  }

  for (let y = startY; y < height; y += gridSize) {
    context.moveTo(0, y);
    context.lineTo(width, y);
  }

  context.stroke();

  context.restore();
}

function drawParts(state, context) {
  context.save();

  for (const part of state.parts) {
    if (!part.visible || !part.image) {
      continue;
    }

    const scale = state.zoom || 1;

    const x = (part.x || 0) * scale + state.panX;
    const y = (part.y || 0) * scale + state.panY;

    const width = part.image.width * scale;
    const height = part.image.height * scale;

    context.drawImage(
      part.image,
      x,
      y,
      width,
      height
    );
  }

  context.restore();
}

function drawSelection(state, context) {
  const part = state.parts.find(
    item => item.id === state.selectedPartId
  );

  if (!part || !part.image) {
    return;
  }

  const scale = state.zoom || 1;

  const x = (part.x || 0) * scale + state.panX;
  const y = (part.y || 0) * scale + state.panY;

  const width = part.image.width * scale;
  const height = part.image.height * scale;

  context.save();

  context.strokeStyle = "#a78bfa";
  context.lineWidth = 2;
  context.setLineDash([6, 4]);

  context.strokeRect(x, y, width, height);

  context.restore();
}
