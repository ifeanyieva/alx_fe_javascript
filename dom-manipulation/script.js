// ================== Local Storage & Quotes ==================
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The best way to predict the future is to invent it.", category: "Motivation" },
  { text: "Life is 10% what happens to us and 90% how we react to it.", category: "Life" },
  { text: "The journey of a thousand miles begins with one step.", category: "Wisdom" }
];

function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// ================== UI Helpers ==================
function showNotification(message, type = "info") {
  const container = document.getElementById("notifications");
  const alert = document.createElement("div");
  alert.className = `alert ${type}`;
  alert.textContent = message;
  container.appendChild(alert);

  setTimeout(() => {
    if (container.contains(alert)) container.removeChild(alert);
  }, 5000);
}

// ================== Quote Display ==================
function showRandomQuote() {
  const selectedCategory = localStorage.getItem("selectedCategory") || "all";
  let filtered = quotes;

  if (selectedCategory !== "all") {
    filtered = quotes.filter(q => q.category === selectedCategory);
  }

  if (filtered.length === 0) {
    document.getElementById("quoteDisplay").innerHTML = "<p>No quotes available for this category.</p>";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filtered.length);
  const quote = filtered[randomIndex];

  document.getElementById("quoteDisplay").innerHTML = `
    <p>"${quote.text}"</p>
    <small><em>Category: ${quote.category}</em></small>
  `;
}

// ================== Add Quote ==================
function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");

  const newText = textInput.value.trim();
  const newCategory = categoryInput.value.trim();

  if (!newText || !newCategory) {
    alert("Please enter both a quote and a category!");
    return;
  }

  const newQuote = { text: newText, category: newCategory, unsynced: true };

  quotes.push(newQuote);
  saveQuotes();
  populateCategoryFilter();

  textInput.value = "";
  categoryInput.value = "";
  showNotification("New quote added locally. Syncing…", "success");

  // Try syncing immediately
  syncQuotes();
}

// ================== Dynamic Form ==================
function createAddQuoteForm() {
  const formDiv = document.createElement("div");
  formDiv.className = "add-quote-form";

  const textInput = document.createElement("input");
  textInput.id = "newQuoteText";
  textInput.type = "text";
  textInput.placeholder = "Enter a new quote";

  const categoryInput = document.createElement("input");
  categoryInput.id = "newQuoteCategory";
  categoryInput.type = "text";
  categoryInput.placeholder = "Enter quote category";

  const addButton = document.createElement("button");
  addButton.textContent = "Add Quote";
  addButton.onclick = addQuote;

  formDiv.appendChild(textInput);
  formDiv.appendChild(categoryInput);
  formDiv.appendChild(addButton);

  document.body.appendChild(formDiv);
}

// ================== Category Filter ==================
function populateCategoryFilter() {
  const filter = document.getElementById("categoryFilter");
  const selectedCategory = localStorage.getItem("selectedCategory") || "all";

  const categories = ["all", ...new Set(quotes.map(q => q.category))];
  filter.innerHTML = "";

  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
    if (cat === selectedCategory) option.selected = true;
    filter.appendChild(option);
  });
}

function filterQuotes() {
  const filter = document.getElementById("categoryFilter");
  const selected = filter.value;

  localStorage.setItem("selectedCategory", selected);
  showRandomQuote();
}

// ================== Import / Export ==================
function exportQuotes() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (Array.isArray(importedQuotes)) {
        quotes.push(...importedQuotes.map(q => ({ ...q, unsynced: true })));
        saveQuotes();
        populateCategoryFilter();
        showNotification("Quotes imported successfully. Syncing…", "success");
        syncQuotes();
      } else {
        alert("Invalid file format. Please upload a JSON array.");
      }
    } catch (error) {
      alert("Error reading file: " + error.message);
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// ================== Server Sync ==================
async function fetchQuotesFromServer() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts");
    const data = await response.json();

    const serverQuotes = data.slice(0, 5).map(post => ({
      text: post.title,
      category: "Server"
    }));

    resolveConflicts(serverQuotes);
  } catch (error) {
    showNotification("Failed to fetch from server: " + error.message, "error");
  }
}

async function postQuoteToServer(quote) {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quote)
    });

    const result = await response.json();
    quote.unsynced = false; // mark as synced
    saveQuotes();
    showNotification("Quote synced to server: " + JSON.stringify(result), "success");
  } catch (error) {
    showNotification("Failed to sync quote: " + error.message, "error");
  }
}

// ================== Conflict Resolution ==================
function resolveConflicts(serverQuotes) {
  let conflicts = [];

  serverQuotes.forEach(serverQ => {
    const exists = quotes.some(localQ => localQ.text === serverQ.text);
    if (!exists) {
      conflicts.push(serverQ);
    }
  });

  if (conflicts.length > 0) {
    const container = document.getElementById("notifications");

    conflicts.forEach(conflict => {
      const box = document.createElement("div");
      box.className = "conflict-box";
      box.innerHTML = `
        <p>Conflict detected: "${conflict.text}" (Server)</p>
        <button class="accept-btn">Accept Server</button>
        <button class="ignore-btn">Ignore</button>
      `;

      box.querySelector(".accept-btn").onclick = () => {
        quotes.push(conflict);
        saveQuotes();
        populateCategoryFilter();
        container.removeChild(box);
        showNotification("Server quote accepted", "success");
      };

      box.querySelector(".ignore-btn").onclick = () => {
        container.removeChild(box);
        showNotification("Server quote ignored", "info");
      };

      container.appendChild(box);
    });
  } else {
    showNotification("No conflicts found. Data is up-to-date.", "info");
  }
}

// ================== NEW: Sync Manager ==================
async function syncQuotes() {
  // Step 1: Push unsynced local quotes
  const unsynced = quotes.filter(q => q.unsynced);
  for (const q of unsynced) {
    await postQuoteToServer(q);
  }

  // Step 2: Fetch server quotes and resolve conflicts
  await fetchQuotesFromServer();
}

// ================== Init ==================
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("newQuote").addEventListener("click", showRandomQuote);
  document.getElementById("exportQuotes").addEventListener("click", exportQuotes);

  createAddQuoteForm();
  populateCategoryFilter();
  showRandomQuote();

  // Periodic sync
  setInterval(syncQuotes, 30000);
});