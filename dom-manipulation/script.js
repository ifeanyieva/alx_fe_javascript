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

// Show notification messages
function showNotification(message, type = "info") {
  const notificationsDiv = document.getElementById("notifications");
  const alert = document.createElement("div");
  alert.className = `alert ${type}`;
  alert.textContent = message;
  notificationsDiv.appendChild(alert);

  setTimeout(() => {
    notificationsDiv.removeChild(alert);
  }, 4000);
}

// Display a random quote (filtered if applicable)
function showRandomQuote() {
  const categoryFilter = localStorage.getItem("selectedCategory") || "all";
  let filteredQuotes =
    categoryFilter === "all"
      ? quotes
      : quotes.filter((q) => q.category === categoryFilter);

  if (filteredQuotes.length === 0) {
    document.getElementById("quoteDisplay").innerHTML = "<p>No quotes available.</p>";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const quote = filteredQuotes[randomIndex];

  const displayDiv = document.getElementById("quoteDisplay");
  displayDiv.innerHTML = `
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

  if (newText === "" || newCategory === "") {
    alert("Please enter both a quote and a category!");
    return;
  }

  quotes.push({ text: newText, category: newCategory });
  saveQuotes();
  populateCategoryFilter();

  textInput.value = "";
  categoryInput.value = "";

  showNotification("New quote added successfully!", "success");

  // Post new quote to server
  postQuoteToServer({ text: newText, category: newCategory });
}

// Create Add Quote form
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

// Export quotes
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

// Import quotes
function importFromJsonFile(event) {
  const fileReader = new FileReader();

  fileReader.onload = function (e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);

      if (Array.isArray(importedQuotes)) {
        quotes.push(...importedQuotes);
        saveQuotes();
        populateCategoryFilter();
        showNotification("Quotes imported successfully!", "success");
      } else {
        showNotification("Invalid file format.", "error");
      }
    } catch (error) {
      showNotification("Error reading file: " + error.message, "error");
    }
  };

  fileReader.readAsText(event.target.files[0]);
}

// Populate category dropdown
function populateCategoryFilter() {
  const categoryFilter = document.getElementById("categoryFilter");
  const categories = [...new Set(quotes.map((q) => q.category))];

  const currentSelection = categoryFilter.value || localStorage.getItem("selectedCategory") || "all";
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';

  categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    if (cat === currentSelection) option.selected = true;
    categoryFilter.appendChild(option);
  });

  localStorage.setItem("selectedCategory", currentSelection);
}

// Handle category filter change
function filterQuotes() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  localStorage.setItem("selectedCategory", selectedCategory);
  showRandomQuote();
}

// -------------------- SERVER SYNC --------------------

// Fetch quotes from server
async function fetchQuotesFromServer() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts");
    const data = await response.json();

    // Simulated server quotes
    const serverQuotes = data.slice(0, 5).map((item, index) => ({
      text: item.title,
      category: ["Motivation", "Life", "Wisdom"][index % 3],
    }));

    return serverQuotes;
  } catch (error) {
    showNotification("Error fetching from server: " + error.message, "error");
    return [];
  }
}

// Post new quote to server
async function postQuoteToServer(quote) {
  try {
    await fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quote),
    });
  } catch (error) {
    showNotification("Error posting to server: " + error.message, "error");
  }
}

// Sync local + server quotes with conflict resolution
async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();

  if (serverQuotes.length === 0) return;

  const localTexts = new Set(quotes.map((q) => q.text));
  const serverTexts = new Set(serverQuotes.map((q) => q.text));

  let conflicts = quotes.filter((q) => serverTexts.has(q.text));

  if (conflicts.length > 0) {
    const notificationsDiv = document.getElementById("notifications");
    conflicts.forEach((conflict) => {
      const conflictBox = document.createElement("div");
      conflictBox.className = "conflict-box";
      conflictBox.innerHTML = `
        <p>Conflict detected for quote: "${conflict.text}"</p>
        <button class="use-server">Use Server</button>
        <button class="keep-local">Keep Local</button>
      `;

      conflictBox.querySelector(".use-server").onclick = () => {
        // Keep server version only
        quotes = serverQuotes;
        saveQuotes();
        populateCategoryFilter();
        showNotification("Server version kept for conflicts", "info");
        notificationsDiv.removeChild(conflictBox);
      };

      conflictBox.querySelector(".keep-local").onclick = () => {
        // Keep local version
        saveQuotes();
        showNotification("Local version kept for conflicts", "info");
        notificationsDiv.removeChild(conflictBox);
      };

      notificationsDiv.appendChild(conflictBox);
    });
  } else {
    // Default strategy: server takes precedence
    quotes = [...quotes, ...serverQuotes.filter((sq) => !localTexts.has(sq.text))];
    saveQuotes();
    populateCategoryFilter();
    showNotification("Quotes synced with server!", "success");
  }
}

// -------------------- DOM LOADED --------------------
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("newQuote").addEventListener("click", showRandomQuote);
  document.getElementById("exportQuotes").addEventListener("click", exportQuotes);
  document.getElementById("syncQuotes").addEventListener("click", syncQuotes);

  createAddQuoteForm();
  populateCategoryFilter();

  const savedFilter = localStorage.getItem("selectedCategory");
  if (savedFilter) {
    document.getElementById("categoryFilter").value = savedFilter;
    filterQuotes();
  } else {
    showRandomQuote();
  }

  // Periodic sync every 30 seconds
  setInterval(syncQuotes, 30000);
});