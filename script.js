const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const restartBtn = document.getElementById("restart");
const themeToggleBtn = document.getElementById("themeToggle");
const appEl = document.querySelector(".app");

const cells = Array.from(boardEl.querySelectorAll(".cell"));

const THEME_STORAGE_KEY = "tic-tac-toe-theme";

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

let board = Array(9).fill(null);
let currentPlayer = "X";
let gameOver = false;
let winningLine = null;
let focusedIndex = 0;

function normalizeTheme(value) {
  return value === "dark" || value === "light" ? value : null;
}

function getStoredTheme() {
  try {
    return normalizeTheme(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return null;
  }
}

function storeTheme(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage failures (privacy mode, blocked storage, etc.).
  }
}

function getSystemTheme() {
  if (!window.matchMedia) return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function updateThemeToggleUi(theme) {
  if (!themeToggleBtn) return;

  const isDark = theme === "dark";
  themeToggleBtn.textContent = `Theme: ${isDark ? "Dark" : "Light"}`;
  themeToggleBtn.setAttribute("aria-pressed", String(isDark));
  themeToggleBtn.setAttribute(
    "aria-label",
    `Theme: ${isDark ? "Dark" : "Light"}. Activate to switch to ${isDark ? "Light" : "Dark"} mode.`,
  );
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  updateThemeToggleUi(theme);
}

function setTheme(theme, { persist } = { persist: true }) {
  applyTheme(theme);
  if (persist) storeTheme(theme);
}

function toggleTheme() {
  const current = normalizeTheme(document.documentElement.dataset.theme) ?? "dark";
  const next = current === "dark" ? "light" : "dark";
  setTheme(next);
}

function setStatus(message) {
  statusEl.textContent = message;
}

function cellLabel(index) {
  const row = Math.floor(index / 3) + 1;
  const col = (index % 3) + 1;
  const value = board[index];
  return value ? `Row ${row}, column ${col}, ${value}` : `Row ${row}, column ${col}, empty`;
}

function getWinner() {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { player: board[a], line };
    }
  }
  return null;
}

function setFocusedCell(nextIndex, { focus } = { focus: true }) {
  focusedIndex = nextIndex;
  for (let i = 0; i < cells.length; i += 1) {
    cells[i].tabIndex = i === nextIndex ? 0 : -1;
  }
  if (focus) {
    cells[nextIndex].focus({ preventScroll: true });
  }
}

function render() {
  for (let i = 0; i < cells.length; i += 1) {
    const value = board[i];
    const cell = cells[i];

    cell.textContent = value ?? "";
    cell.classList.toggle("is-x", value === "X");
    cell.classList.toggle("is-o", value === "O");
    cell.classList.toggle("is-win", Array.isArray(winningLine) && winningLine.includes(i));

    cell.setAttribute("aria-label", cellLabel(i));
    cell.setAttribute("aria-disabled", String(gameOver || Boolean(value)));
  }
}

function restartGame({ focusBoard } = { focusBoard: false }) {
  board = Array(9).fill(null);
  currentPlayer = "X";
  gameOver = false;
  winningLine = null;

  setStatus(`${currentPlayer}'s turn.`);
  render();

  if (focusBoard) {
    setFocusedCell(0, { focus: true });
  }
}

function tryPlayAt(index) {
  if (gameOver) {
    setStatus(`Game over. Press Restart to play again.`);
    return;
  }

  if (board[index]) {
    setStatus(`That cell is taken. ${currentPlayer}'s turn.`);
    return;
  }

  board[index] = currentPlayer;

  const winner = getWinner();
  if (winner) {
    gameOver = true;
    winningLine = winner.line;
    setStatus(`${winner.player} wins! Press Restart to play again.`);
    render();
    return;
  }

  const isDraw = board.every(Boolean);
  if (isDraw) {
    gameOver = true;
    winningLine = null;
    setStatus(`It's a draw. Press Restart to play again.`);
    render();
    return;
  }

  currentPlayer = currentPlayer === "X" ? "O" : "X";
  setStatus(`${currentPlayer}'s turn.`);
  render();
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function moveFocusBy(dx, dy) {
  const row = Math.floor(focusedIndex / 3);
  const col = focusedIndex % 3;

  const nextRow = clamp(row + dy, 0, 2);
  const nextCol = clamp(col + dx, 0, 2);
  const nextIndex = nextRow * 3 + nextCol;

  setFocusedCell(nextIndex, { focus: true });
}

boardEl.addEventListener("click", (event) => {
  const button = event.target.closest(".cell");
  if (!button) return;

  const index = Number.parseInt(button.dataset.index, 10);
  if (!Number.isFinite(index)) return;

  setFocusedCell(index, { focus: false });
  tryPlayAt(index);
});

boardEl.addEventListener("focusin", (event) => {
  const button = event.target.closest(".cell");
  if (!button) return;

  const index = Number.parseInt(button.dataset.index, 10);
  if (!Number.isFinite(index)) return;

  setFocusedCell(index, { focus: false });
});

boardEl.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "ArrowLeft":
      event.preventDefault();
      moveFocusBy(-1, 0);
      break;
    case "ArrowRight":
      event.preventDefault();
      moveFocusBy(1, 0);
      break;
    case "ArrowUp":
      event.preventDefault();
      moveFocusBy(0, -1);
      break;
    case "ArrowDown":
      event.preventDefault();
      moveFocusBy(0, 1);
      break;
    case "Home":
      event.preventDefault();
      setFocusedCell(0, { focus: true });
      break;
    case "End":
      event.preventDefault();
      setFocusedCell(8, { focus: true });
      break;
    default:
      break;
  }
});

if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    toggleTheme();
  });
}

document.addEventListener("keydown", (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;

  const active = document.activeElement;
  const appHasFocus =
    (appEl && appEl.contains(active)) || active === document.body || active === document.documentElement;

  if (!appHasFocus) return;

  if (event.key === "t" || event.key === "T") {
    event.preventDefault();
    toggleTheme();
    return;
  }

  if (event.key === "r" || event.key === "R") {
    event.preventDefault();
    restartGame({ focusBoard: true });
    return;
  }

  if (event.key >= "1" && event.key <= "9") {
    event.preventDefault();
    const index = Number.parseInt(event.key, 10) - 1;
    setFocusedCell(index, { focus: true });
    tryPlayAt(index);
  }
});

restartBtn.addEventListener("click", (event) => {
  const keyboardActivated = event.detail === 0;
  restartGame({ focusBoard: keyboardActivated });
});

const storedTheme = getStoredTheme();
const initialTheme = storedTheme ?? getSystemTheme();
setTheme(initialTheme, { persist: false });

if (!storedTheme && window.matchMedia) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = (event) => {
    setTheme(event.matches ? "dark" : "light", { persist: false });
  };

  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", handler);
  } else if (typeof media.addListener === "function") {
    media.addListener(handler);
  }
}

restartGame();
