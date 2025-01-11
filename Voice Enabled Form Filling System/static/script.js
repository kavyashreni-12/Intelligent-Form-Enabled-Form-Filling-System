const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const countryCodeSelect = document.getElementById("countryCode");
const recordBtn = document.getElementById("recordBtn");
const submitBtn = document.getElementById("submitBtn");
const toggleBtn = document.getElementById("toggleBtn");
const helpBtn = document.getElementById("helpBtn");
const saveBtn = document.getElementById("saveBtn");
const downloadBtn = document.getElementById("downloadBtn");

const nameError = document.getElementById("nameError");
const nameValid = document.getElementById("nameValid");
const emailError = document.getElementById("emailError");
const emailValid = document.getElementById("emailValid");
const phoneError = document.getElementById("phoneError");
const phoneValid = document.getElementById("phoneValid");

let step = 0; // Control the form fields
let isListening = false;
let timeoutId = null;
let isFormCompleted = false; // Track if the form is completed

// Initialize Speech Recognition (with polyfill for webkitSpeechRecognition support)
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = "en-US";
recognition.interimResults = false;

// Initialize Speech Synthesis (Text-to-Speech)
const synth = window.speechSynthesis;

// Function to capitalize the first letter of input
function capitalizeFirstLetter(text) {
  return text.charAt(0).toUpperCase() + text.slice(1).replace(/\.$/, ""); // Capitalize & remove period
}

// Function to speak text
function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.8; // Slower pace for better understanding
  synth.speak(utterance);
}

// Start voice recognition on button click
recordBtn.addEventListener("click", () => {
  if (isListening) {
    recognition.stop();
    recordBtn.textContent = "🎤 Start Voice Input";
    isListening = false;
  } else {
    recognition.start();
    recordBtn.textContent = "⏹ Stop Voice Input";
    isListening = true;
    step = 0; // Start from the first field
    isFormCompleted = false; // Reset form completion flag
    speakAndHighlightNextField();
  }
});

// Process speech input for filling the form
recognition.onresult = (event) => {
  let transcript = event.results[0][0].transcript.trim();
  transcript = capitalizeFirstLetter(transcript); // Capitalize and remove full stops

  clearTimeout(timeoutId); // Reset timeout when user provides input

  timeoutId = setTimeout(() => {
    if (!isFormCompleted) {
      speak("Please provide the input. You have been idle for a while.");
      speakAndHighlightNextField();
    }
  }, 15000); // 15 seconds timeout

  switch (step) {
    case 0:
      nameInput.value = transcript;
      validateField("name", transcript);
      break;
    case 1:
      emailInput.value = transcript;
      validateField("email", transcript);
      break;
    case 2:
      const countryCode = getCountryCodeFromSpeech(transcript);
      if (countryCode) {
        countryCodeSelect.value = countryCode;
        validateField("countryCode", countryCode);
      } else {
        speak("Sorry, country not recognized. Please say the name of your country again.");
      }
      break;
    case 3:
      phoneInput.value = transcript.replace(/\D/g, ""); // Remove non-digits
      validateField("phone", phoneInput.value);
      break;
  }
  step++;
  if (step < 4) {
    setTimeout(speakAndHighlightNextField, 50000); // Slight delay to prevent overlap
  } else {
    recognition.stop();
    recordBtn.textContent = "🎤 Start Voice Input";
    isFormCompleted = true; // Form is completed
    speak("Form is filled. Please review and click Submit.");
  }
};

recognition.onerror = (event) => {
  alert(`Error occurred in recognition: ${event.error}`);
};

recognition.onend = () => {
  // This ensures the form will continue even after recognition ends
  if (step < 4) {
    speakAndHighlightNextField();
  }
};

function speakAndHighlightNextField() {
  if (step === 0) {
    speak("Please enter your name.");
    nameInput.focus();
    highlightField("name");
  } else if (step === 1) {
    speak("Please enter your email.");
    emailInput.focus();
    highlightField("email");
  } else if (step === 2) {
    speak("Please select your country code.");
    countryCodeSelect.focus();
    highlightField("countryCode");
  } else if (step === 3) {
    speak("Please enter your phone number.");
    phoneInput.focus();
    highlightField("phone");
  }
  recognition.start(); // Reactivate speech recognition for the next field
}

function highlightField(field) {
  if (field === "name") {
    nameInput.classList.add("highlight");
    emailInput.classList.remove("highlight");
    phoneInput.classList.remove("highlight");
    countryCodeSelect.classList.remove("highlight");
  } else if (field === "email") {
    emailInput.classList.add("highlight");
    nameInput.classList.remove("highlight");
    phoneInput.classList.remove("highlight");
    countryCodeSelect.classList.remove("highlight");
  } else if (field === "phone") {
    phoneInput.classList.add("highlight");
    nameInput.classList.remove("highlight");
    emailInput.classList.remove("highlight");
    countryCodeSelect.classList.remove("highlight");
  } else if (field === "countryCode") {
    countryCodeSelect.classList.add("highlight");
    nameInput.classList.remove("highlight");
    emailInput.classList.remove("highlight");
    phoneInput.classList.remove("highlight");
  }
}

function validateField(field, value) {
  if (field === "name") {
    if (!value.trim()) {
      nameError.style.display = "block";
      nameValid.style.display = "none";
      speak("Please enter your name again.");
    } else {
      nameError.style.display = "none";
      nameValid.style.display = "block";
    }
  } else if (field === "email") {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!value.match(emailRegex)) {
      emailError.style.display = "block";
      emailValid.style.display = "none";
      speak("Please enter a valid email address.");
    } else {
      emailError.style.display = "none";
      emailValid.style.display = "block";
    }
  } else if (field === "phone") {
    const phoneNumber = value;
    const countryCode = countryCodeSelect.value;

    // Validate phone number based on country code
    if (countryCode === "+91" && phoneNumber.length !== 10) {
      phoneError.style.display = "block";
      phoneValid.style.display = "none";
      speak("Please enter a 10-digit phone number for India.");
    } else if (phoneNumber.length < 10) {
      phoneError.style.display = "block";
      phoneValid.style.display = "none";
      speak("Please enter a valid phone number.");
    } else {
      phoneError.style.display = "none";
      phoneValid.style.display = "block";
    }
  }
}

function getCountryCodeFromSpeech(transcript) {
  const countryCodeMapping = {
    "united states": "+1",
    "america": "+1",
    "united kingdom": "+44",
    "uk": "+44",
    "australia": "+61",
    "japan": "+81",
    "india": "+91",
    "bharat": "+91",
  };
  return countryCodeMapping[transcript.toLowerCase()] || null;
}

// Submit form
/*submitBtn.addEventListener("click", () => {
  if (
    nameInput.value &&
    emailInput.value &&
    phoneInput.value &&
    countryCodeSelect.value
  ) {
    alert("Form submitted successfully!");*/

    /*// Reset the form fields
    document.getElementById("form").reset(); // Assuming the form has an ID 'form'

    // Reset validation messages and highlight
    nameError.style.display = "none";
    nameValid.style.display = "none";
    emailError.style.display = "none";
    emailValid.style.display = "none";
    phoneError.style.display = "none";
    phoneValid.style.display = "none";

    // Reset the country code selection
    countryCodeSelect.value = "+91"; // Default to India, or set to preferred default

    // Reset form state
    step = 0;
    isFormCompleted = false;
    speak("Form submitted successfully! You can start a new entry.");
  } else {
    speak("Please complete all fields before submitting.");
  }
});*/

submitBtn.addEventListener("click", async () => {
  const formData = {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    countryCode: document.getElementById("countryCode").value,
    phone: document.getElementById("phone").value,
  };

  const response = await fetch("/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });

  const result = await response.json();
  alert(result.message);
});

downloadBtn.addEventListener("click", async () => {
  const formData = {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    countryCode: document.getElementById("countryCode").value,
    phone: document.getElementById("phone").value,
  };

  const response = await fetch("/download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "form_data.txt";
  document.body.appendChild(a);
  a.click();
  a.remove();
});


// Handle toggle functionality
toggleBtn.addEventListener("click", () => {
  if (isListening) {
    recognition.stop();
    isListening = false;
  } else {
    recognition.start();
    isListening = true;
  }
});

// Help button for instructions
helpBtn.addEventListener("click", () => {
  speak("Say 'start' to begin filling the form.");
  speak("For each field, I will guide you to provide your input.");
  speak("You can also manually fill the fields if needed.");
});

// Save button to save progress
saveBtn.addEventListener("click", () => {
  speak("Saving your progress.");
});

// Download button for form data
downloadBtn.addEventListener("click", () => {
  speak("Downloading the form data.");
});

