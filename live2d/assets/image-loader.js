
const SUPPORTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/bmp"
];

export function validateImageFile(file) {
  if (!file) {
    return {
      valid: false,
      message: "ファイルが選択されていません"
    };
  }

  if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      message: "対応していない画像形式です"
    };
  }

  return {
    valid: true,
    message: "画像形式を確認しました"
  };
}

export function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const validation = validateImageFile(file);

    if (!validation.valid) {
      reject(new Error(validation.message));
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(imageUrl);

      resolve({
        image,
        name: file.name,
        type: file.type,
        width: image.naturalWidth,
        height: image.naturalHeight,
        size: file.size,
        lastModified: file.lastModified
      });
    };

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);

      reject(
        new Error("画像を読み込めませんでした")
      );
    };

    image.src = imageUrl;
  });
}

export function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    if (typeof url !== "string" || !url.trim()) {
      reject(new Error("画像URLが正しくありません"));
      return;
    }

    const image = new Image();

    image.onload = () => {
      resolve({
        image,
        name: "External Image",
        type: "url",
        width: image.naturalWidth,
        height: image.naturalHeight
      });
    };

    image.onerror = () => {
      reject(
        new Error("URLから画像を読み込めませんでした")
      );
    };

    image.src = url;
  });
}
