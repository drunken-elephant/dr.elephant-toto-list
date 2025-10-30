import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyCXSXnJ4mlJsx2rbiVGXJObEy2IhfVc3kA",
  authDomain: "todo-backend-a0d94.firebaseapp.com",
  databaseURL: "https://todo-backend-a0d94-default-rtdb.firebaseio.com",
  projectId: "todo-backend-a0d94",
  storageBucket: "todo-backend-a0d94.firebasestorage.app",
  messagingSenderId: "314191984342",
  appId: "1:314191984342:web:33cb94cbf2e9906075bb77",
  databaseURL: "https://todo-backend-a0d94-default-rtdb.firebaseio.com/",
};

const app = initializeApp(firebaseConfig);

(function () {
  const STORAGE_KEY = "todo-items-v1";

  /** @type {{ id: string; title: string; completed: boolean; createdAt: number; }[]} */
  let items = [];
  let currentFilter = "all"; // all | active | completed

  // Elements
  const formEl = document.getElementById("todo-form");
  const inputEl = document.getElementById("todo-input");
  const listEl = document.getElementById("todo-list");
  const countActiveEl = document.getElementById("count-active");
  const clearCompletedEl = document.getElementById("clear-completed");
  const clearAllEl = document.getElementById("clear-all");
  const filterButtons = Array.from(document.querySelectorAll(".filter"));

  // Init
  load();
  render();

  // Events
  formEl.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = sanitize(inputEl.value.trim());
    if (!title) return;
    addItem(title);
    inputEl.value = "";
    inputEl.focus();
  });

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentFilter = btn.dataset.filter || "all";
      filterButtons.forEach((b) => b.classList.toggle("active", b === btn));
      render();
    });
  });

  clearCompletedEl.addEventListener("click", () => {
    items = items.filter((i) => !i.completed);
    save();
    render();
  });

  clearAllEl.addEventListener("click", () => {
    if (!items.length) return;
    if (confirm("전체 할 일을 삭제하시겠어요?")) {
      items = [];
      save();
      render();
    }
  });

  // CRUD
  function addItem(title) {
    const newItem = {
      id: String(Date.now()) + Math.random().toString(36).slice(2, 8),
      title,
      completed: false,
      createdAt: Date.now(),
    };
    items.unshift(newItem);
    save();
    render();
  }

  function updateItem(id, fields) {
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return;
    items[idx] = { ...items[idx], ...fields };
    save();
    render();
  }

  function deleteItem(id) {
    items = items.filter((i) => i.id !== id);
    save();
    render();
  }

  // Render
  function render() {
    const filtered = items.filter((i) => {
      if (currentFilter === "active") return !i.completed;
      if (currentFilter === "completed") return i.completed;
      return true;
    });

    listEl.innerHTML = "";
    for (const item of filtered) {
      const li = document.createElement("li");
      li.className = "todo-item";
      li.dataset.id = item.id;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = item.completed;
      checkbox.addEventListener("change", () => {
        updateItem(item.id, { completed: checkbox.checked });
      });

      const title = document.createElement("div");
      title.className = "todo-title" + (item.completed ? " completed" : "");
      title.textContent = item.title;

      // Double click to edit
      title.addEventListener("dblclick", () => beginEdit(li, item));

      const actions = document.createElement("div");
      actions.className = "actions";

      const editBtn = document.createElement("button");
      editBtn.className = "btn btn-ghost";
      editBtn.textContent = "수정";
      editBtn.addEventListener("click", () => beginEdit(li, item));

      const delBtn = document.createElement("button");
      delBtn.className = "btn btn-danger";
      delBtn.textContent = "삭제";
      delBtn.addEventListener("click", () => deleteItem(item.id));

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      li.appendChild(checkbox);
      li.appendChild(title);
      li.appendChild(actions);
      listEl.appendChild(li);
    }

    const activeCount = items.filter((i) => !i.completed).length;
    countActiveEl.textContent = String(activeCount);
  }

  // Edit inline
  function beginEdit(li, item) {
    const existingInput = li.querySelector(".todo-edit");
    if (existingInput) return;

    const titleEl = li.querySelector(".todo-title");
    const input = document.createElement("input");
    input.type = "text";
    input.value = item.title;
    input.className = "todo-edit";

    li.replaceChild(input, titleEl);
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

    const finish = (commit) => {
      const newTitle = sanitize(input.value.trim());
      if (commit && newTitle) {
        updateItem(item.id, { title: newTitle });
      } else {
        render();
      }
    };

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") finish(true);
      if (e.key === "Escape") finish(false);
    });
    input.addEventListener("blur", () => finish(true));
  }

  // Storage
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (_) {
      // ignore quota errors
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        items = parsed.filter(validItemShape).sort((a, b) => b.createdAt - a.createdAt);
      }
    } catch (_) {
      items = [];
    }
  }

  function validItemShape(x) {
    return x && typeof x.id === "string" && typeof x.title === "string" && typeof x.completed === "boolean" && typeof x.createdAt === "number";
  }

  // Utils
  function sanitize(text) {
    return text.replace(/[\u0000-\u001F\u007F]/g, "");
  }
})();


