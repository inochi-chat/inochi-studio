
import { loadImageFile } from "../assets/image-loader.js";
import { registerImage } from "../assets/image-manager.js";
import { createPart } from "./part-manager.js";

export async function loadPartFromFile(state, file) {
  if (!file) {
    throw new Error("ファイルが選択されていません");
  }

  // 画像を読み込む
  const imageData = await loadImageFile(file);

  // 画像管理に登録
  const registeredImage = registerImage(state, imageData);

  // パーツを作成
  const part = createPart(state, {
    name: removeExtension(file.name),
    image: registeredImage.image,
    width: registeredImage.width,
    height: registeredImage.height,
    x: 0,
    y: 0
  });

  // 元画像との関連付け
  part.sourceImageId = registeredImage.id;

  return part;
}

export function loadPartFromImageData(state, imageData) {
  if (!imageData || !imageData.image) {
    throw new Error("画像データが正しくありません");
  }

  const registeredImage = registerImage(state, imageData);

  const part = createPart(state, {
    name: imageData.name || "新しいパーツ",
    image: registeredImage.image,
    width: registeredImage.width,
    height: registeredImage.height
  });

  part.sourceImageId = registeredImage.id;

  return part;
}

function removeExtension(fileName) {
  return fileName.replace(/\.[^/.]+$/, "");
}
