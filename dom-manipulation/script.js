// Array of quote objects
const quotes = [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Don't let yesterday take up too much of today.", category: "Inspiration" },
  { text: "It's not whether you get knocked down, it's whether you get up.", category: "Perseverance" }
];

// Get elements from DOM
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteButton = document.getElementById("newQuote");

// Function to show a random quote
function showRandomQuote() {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[randomIndex];
  quoteDisplay.innerHTML = `<p>${quote.text}</p><small>Category: ${quote.category}</small>`;
}

// Function to create a form to add new quotes
function createAddQuoteForm() {
  const form = document.createElement("form");

  // Input for quote text
  const textInput = document.createElement("input");
  textInput.type = "text";
  textInput.placeholder = "Enter quote text";
  textInput.required = true;

  // Input for category
  const categoryInput = document.createElement("input");
  categoryInput.type = "text";
  categoryInput.placeholder = "Enter quote category";
  categoryInput.required = true;

  // Submit button
  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.textContent = "Add Quote";

  // Append inputs and button to form
  form.appendChild(textInput);
  form.appendChild(categoryInput);
  form.appendChild(submitBtn);

  // Append form to body (or anywhere you want)
  document.body.appendChild(form);

  // Handle form submission
  form.addEventListener("submit", function (event) {
    event.preventDefault(); // stop page reload
    const newQuote = {
      text: textInput.value,
      category: categoryInput.value
    };
    quotes.push(newQuote); // add to array
    alert("Quote added successfully!");
    form.reset(); // clear inputs
  });
}

// Show one quote on page load
showRandomQuote();

// Event listeners
newQuoteButton.addEventListener("click", showRandomQuote);

// Call the function to create the form when page loads
createAddQuoteForm();