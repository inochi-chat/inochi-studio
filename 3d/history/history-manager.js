
export function createHistoryManager(limit = 100) {
  const undoStack = [];
  const redoStack = [];

  // 履歴を実行して保存
  function execute(command) {
    if (
      !command ||
      typeof command.undo !== "function" ||
      typeof command.redo !== "function"
    ) {
      throw new Error("無効な履歴コマンドです");
    }

    command.redo();

    undoStack.push(command);

    // 新しい操作をしたらRedo履歴を消す
    redoStack.length = 0;

    // 履歴数の上限
    if (undoStack.length > limit) {
      undoStack.shift();
    }
  }

  // 一つ前の操作に戻す
  function undo() {
    if (undoStack.length === 0) return false;

    const command = undoStack.pop();

    command.undo();
    redoStack.push(command);

    return true;
  }

  // 戻した操作をやり直す
  function redo() {
    if (redoStack.length === 0) return false;

    const command = redoStack.pop();

    command.redo();
    undoStack.push(command);

    return true;
  }

  // 履歴をすべて消去
  function clear() {
    undoStack.length = 0;
    redoStack.length = 0;
  }

  return {
    execute,
    undo,
    redo,
    clear,

    get canUndo() {
      return undoStack.length > 0;
    },

    get canRedo() {
      return redoStack.length > 0;
    },

    get undoCount() {
      return undoStack.length;
    },

    get redoCount() {
      return redoStack.length;
    }
  };
}
