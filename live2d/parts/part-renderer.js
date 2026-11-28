
export function drawPart(state, part) {
  const context = state.context;

  if (!context || !part || !part.image || !part.visible) {
    return;
  }

  const zoom = state.zoom || 1;

  const width = part.width || part.image.naturalWidth;
  const height = part.height || part.image.naturalHeight;

  const x = (part.x || 0) * zoom + state.panX;
  const y = (part.y || 0) * zoom + state.panY;

  const scaledWidth = width * zoom * (part.scaleX ?? 1);
  const scaledHeight = height * zoom * (part.scaleY ?? 1);

  const centerX = x + scaledWidth / 2;
  const centerY = y + scaledHeight / 2;

  context.save();

  context.globalAlpha = Math.max(
    0,
    Math.min(1, part.opacity ?? 1)
  );

  // パーツの中心を基準に変形
  context.translate(centerX, centerY);

  context.rotate((part.rotation || 0) * Math.PI / 180);

  // 画像を描画
  context.drawImage(
    part.image,
    -scaledWidth / 2,
    -scaledHeight / 2,
    scaledWidth,
    scaledHeight
  );

  context.restore();
}

export function drawPartBounds(state, part, options = {}) {
  const context = state.context;

  if (!context || !part || !part.image) {
    return;
  }

  const zoom = state.zoom || 1;

  const width = (part.width || part.image.naturalWidth)
    * zoom * (part.scaleX ?? 1);

  const height = (part.height || part.image.naturalHeight)
    * zoom * (part.scaleY ?? 1);

  const x = (part.x || 0) * zoom + state.panX;
  const y = (part.y || 0) * zoom + state.panY;

  const centerX = x + width / 2;
  const centerY = y + height / 2;

  context.save();

  context.translate(centerX, centerY);
  context.rotate((part.rotation || 0) * Math.PI / 180);

  context.strokeStyle = options.color || "#a78bfa";
  context.lineWidth = options.lineWidth || 2;
  context.setLineDash(options.dashed ? [6, 4] : []);

  context.strokeRect(
    -width / 2,
    -height / 2,
    width,
    height
  );

  context.restore();
}

export function drawPartOrigin(state, part) {
  const context = state.context;

  if (!context || !part) {
    return;
  }

  const zoom = state.zoom || 1;

  const width = (part.width || 0) * zoom * (part.scaleX ?? 1);
  const height = (part.height || 0) * zoom * (part.scaleY ?? 1);

  const centerX = (part.x || 0) * zoom + state.panX + width / 2;
  const centerY = (part.y || 0) * zoom + state.panY + height / 2;

  context.save();

  context.fillStyle = "#ffffff";
  context.strokeStyle = "#8b72d8";
  context.lineWidth = 2;

  context.beginPath();
  context.arc(centerX, centerY, 4, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.restore();
}
