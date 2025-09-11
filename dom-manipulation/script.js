// Load quotes from localStorage or fallback to defaults
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The best way to predict the future is to invent it.", category: "Motivation" },
  { text: "Life is 10% what happens to us and 90% how we react to it.", category: "Life" },
  { text: "The journey of a thousand miles begins with one step.", category: "Wisdom" }
];

// Save quotes to localStorage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Notifications
function showNotification(message, type = "info") {
  const container = document.getElementById("notifications");
  const div = document.createElement("div");
  div.className = `alert ${type}`;
  div.textContent = message;
  container.appendChild(div);
  setTimeout(() => div.remove(), 4000);
}

// Display a random quote
function showRandomQuote() {
  if (quotes.length === 0) {
    document.getElementById("quoteDisplay").innerHTML = "<p>No quotes available.</p>";
    return;
  }

  const selectedCategory = localStorage.getItem("selectedCategory") || "all";
  let filtered = selectedCategory === "all" ? quotes : quotes.filter(q => q.category === selectedCategory);

  if (filtered.length === 0) filtered = quotes; // fallback if no match

  const randomIndex = Math.floor(Math.random() * filtered.length);
  const quote = filtered[randomIndex];

  document.getElementById("quoteDisplay").innerHTML = `
    <p>"${quote.text}"</p>
    <small><em>Category: ${quote.category}</em></small>
  `;
}

// Add new quote
function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");

  const newText = textInput.value.trim();
  const newCategory = categoryInput.value.trim();

  if (!newText || !newCategory) {
    alert("Please enter both a quote and a category!");
    return;
  }

  quotes.push({ text: newText, category: newCategory });
  saveQuotes();
  populateCategoryFilter();

  textInput.value = "";
  categoryInput.value = "";
  showNotification("New quote added successfully!", "success");
}

// Create Add Quote form dynamically
function createAddQuoteForm() {
  const formDiv = document.createElement("div");
  formDiv.className = "add-quote-form";
  formDiv.id = "addQuoteForm";

  formDiv.innerHTML = `
    <input id="newQuoteText" type="text" placeholder="Enter a new quote" />
    <input id="newQuoteCategory" type="text" placeholder="Enter quote category" />
    <button onclick="addQuote()">Add Quote</button>
  `;

  document.body.insertBefore(formDiv, document.getElementById("notifications"));
}

// Export quotes to JSON
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

// Import quotes from JSON file
function importFromJsonFile(event) {
  const fileReader = new FileReader();

  fileReader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);

      if (Array.isArray(importedQuotes)) {
        quotes.push(...importedQuotes);
        saveQuotes();
        populateCategoryFilter();
        showNotification("Quotes imported successfully!", "success");
      } else {
        alert("Invalid file format. Please upload a JSON file with an array of quotes.");
      }
    } catch (error) {
      alert("Error reading file: " + error.message);
    }
  };

  fileReader.readAsText(event.target.files[0]);
}

// Populate category dropdown
function populateCategoryFilter() {
  const select = document.getElementById("categoryFilter");
  const current = select.value;
  select.innerHTML = `<option value="all">All Categories</option>`;

  const categories = [...new Set(quotes.map(q => q.category))];
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });

  const savedCategory = localStorage.getItem("selectedCategory") || "all";
  select.value = savedCategory;
}

// Apply category filter
function filterQuotes() {
  const selected = document.getElementById("categoryFilter").value;
  localStorage.setItem("selectedCategory", selected);
  showRandomQuote();
}

// -------------------- SERVER SYNC --------------------

// Simulated server fetch (JSONPlaceholder used for demo)
async function fetchQuotesFromServer() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5");
    const data = await response.json();

    const serverQuotes = data.map(post => ({
      text: post.title,
      category: "Server"
    }));

    resolveConflicts(serverQuotes);
  } catch (error) {
    showNotification("Failed to fetch server quotes: " + error.message, "error");
  }
}

// Conflict resolution
function resolveConflicts(serverQuotes) {
  const conflicts = [];

  serverQuotes.forEach(serverQuote => {
    const match = quotes.find(localQuote => localQuote.text === serverQuote.text);
    if (!match) {
      quotes.push(serverQuote);
    } else if (match.category !== serverQuote.category) {
      conflicts.push({ local: match, server: serverQuote });
    }
  });

  if (conflicts.length > 0) {
    showNotification("Conflicts detected! Server version will be used.", "warning");
    conflicts.forEach(conflict => {
      conflict.local.category = conflict.server.category;
      showConflictResolution(conflict);
    });
  }

  saveQuotes();
  populateCategoryFilter();
  showNotification("Quotes synced with server!", "success");
}

// UI for manual conflict resolution
function showConflictResolution(conflict) {
  const container = document.getElementById("notifications");
  const div = document.createElement("div");
  div.className = "conflict-box";
  div.innerHTML = `
    <p><strong>Conflict:</strong> "${conflict.local.text}"</p>
    <p>Local: ${conflict.local.category} | Server: ${conflict.server.category}</p>
    <button onclick="acceptLocal('${conflict.local.text}')">Keep Local</button>
    <button onclick="acceptServer('${conflict.local.text}', '${conflict.server.category}')">Use Server</button>
  `;
  container.appendChild(div);
}

function acceptLocal(text) {
  showNotification(`Kept local version for: "${text}"`, "info");
  saveQuotes();
  populateCategoryFilter();
}

function acceptServer(text, serverCategory) {
  const quote = quotes.find(q => q.text === text);
  if (quote) {
    quote.category = serverCategory;
    showNotification(`Accepted server version for: "${text}"`, "success");
    saveQuotes();
    populateCategoryFilter();
  }
}

// -------------------- INIT --------------------
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("newQuote").addEventListener("click", showRandomQuote);
  document.getElementById("exportQuotes").addEventListener("click", exportQuotes);

  createAddQuoteForm();
  populateCategoryFilter();
  showRandomQuote();

  // Load last filter
  const savedCategory = localStorage.getItem("selectedCategory") || "all";
  document.getElementById("categoryFilter").value = savedCategory;

  // Periodic sync
  fetchQuotesFromServer();
  setInterval(fetchQuotesFromServer, 30000); // every 30s
});