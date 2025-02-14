// JavaScript code for Voice Enabled Form Filling System
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const countryCodeSelect = document.getElementById("countryCode");
const recordBtn = document.getElementById("recordBtn");
const submitBtn = document.getElementById("submitBtn");
const clearFormBtn = document.getElementById("clearFormBtn");
const helpBtn = document.getElementById("helpBtn");
const saveBtn = document.getElementById("saveBtn");
const downloadBtn = document.getElementById("downloadBtn");

const nameError = document.getElementById("nameError");
const nameValid = document.getElementById("nameValid");
const emailError = document.getElementById("emailError");
const emailValid = document.getElementById("emailValid");
const phoneError = document.getElementById("phoneError");
const phoneValid = document.getElementById("phoneValid");

let step = 0;
let isListening = false;
let isFormCompleted = false;

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = "en-US";
recognition.interimResults = false;
recognition.continuous = true;
recognition.maxAlternatives = 1;

const synth = window.speechSynthesis;

function speak(text, delay = 1000) {
  setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    synth.speak(utterance);
  }, delay);
}

// Removes period at the end
function cleanVoiceInput(text) {
  return text.replace(/\.$/, ""); 
}

recordBtn.addEventListener("click", () => {
  if (isListening) {
    recognition.stop();
    synth.cancel(); // Stop any ongoing speech output
    recordBtn.textContent = "🎤 Start Voice Input";
    isListening = false;
  } else {
    isListening = true;
    recognition.start();
    recordBtn.textContent = "⏹ Stop Voice Input";

    // Find the next unfilled field
    step = findNextUnfilledField();
    
    isFormCompleted = false;
    speakAndHighlightNextField();
  }
});

// Function to find the next empty field
function findNextUnfilledField() {
  if (!nameInput.value.trim()) return 0;
  if (!emailInput.value.trim()) return 1;
  if (!countryCodeSelect.value.trim()) return 2;
  if (!phoneInput.value.trim()) return 3;
  return 4; // All fields filled
}


// Speech recognition result handling 
recognition.onresult = (event) => {
  let transcript = event.results[event.results.length - 1][0].transcript.trim();
  transcript = cleanVoiceInput(transcript); // Remove full stop

  switch (step) {
    case 0:
      nameInput.value = transcript;
      if (validateField("name", transcript)) {
        speak(`You have entered ${transcript} as your name.`);
        step++;
        setTimeout(speakAndHighlightNextField, 3000);
      }
      break;
    case 1:
      emailInput.value = transcript.toLowerCase();
      if (validateField("email", transcript.toLowerCase())) {
        speak(`You have entered ${transcript} as your email.`);
        step++;
        setTimeout(speakAndHighlightNextField, 3000);
      }
      break;
    case 2:
      const countryCode = getCountryCodeFromSpeech(transcript);
      if (countryCode) {
        countryCodeSelect.value = countryCode;
        speak(`You have selected ${transcript} as your country.`);
        step++;
        setTimeout(speakAndHighlightNextField, 3000);
      } else {
        speak("Sorry, country not recognized. Please try again.");
      }
      break;
    case 3:
      phoneInput.value = transcript.replace(/\D/g, "");
      if (validateField("phone", phoneInput.value)) {
        speak(`You have entered ${phoneInput.value} as your phone number.`);
        step++;
        if (step >= 4) {
          recognition.stop();
          isFormCompleted = true;
          speak("Form is filled. Please review and click Submit.");
        }
      }
      break;
  }
};

// Handle recognition errors
recognition.onerror = (event) => {
  speak("I didn't catch that. Please try again.");
};

// Speak next field prompt 
function speakAndHighlightNextField() {
  const fields = ["name", "email", "countryCode", "phone"];
  if (step < fields.length) {
    speak(`Please enter your ${fields[step]}.`, 3000);
    document.getElementById(fields[step]).focus();
  }
}

//  Validate user input 
function validateField(field, value) {
  if (field === "name") {
    if (!/^[A-Za-z ]+$/.test(value.trim())) {
      nameError.style.display = "block";
      nameError.textContent = "❌ Name should contain only letters.";
      nameValid.style.display = "none";
      speak("Error! Name should only contain letters. Please enter your name again.");
      return false;
    }
    nameError.style.display = "none";
    nameValid.style.display = "block";
    nameValid.textContent = "✔ Name entered correctly.";
    return true;
  }

  if (field === "email") {
    const emailRegex = /^[a-z][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.com$/;

    if (!emailRegex.test(value.trim())) {
      emailError.style.display = "block";
      emailError.textContent = "❌ Please enter a valid email address with @ symbol and ending with .com ";
      emailValid.style.display = "none";
      speak("Please enter a valid email address with @ symbol and ending with dot com.");
      return false;
    }
    emailError.style.display = "none";
    emailValid.style.display = "block";
    emailValid.textContent = "✔ Email entered correctly.";
    return true;
  }

  if (field === "phone") {
    if (!/^[789]\d{9}$/.test(value.trim())) {
      phoneError.style.display = "block";
      phoneError.textContent = "❌ Please Enter a Phone number starts with 7, 8, or 9 and be exactly 10 digits. ";
      phoneValid.style.display = "none";
      speak("Please Enter a Phone number starts with 7, 8, or 9 and be exactly 10 digits.");
      return false;
    }
    phoneError.style.display = "none";
    phoneValid.style.display = "block";
    phoneValid.textContent = "✔ Phone number entered correctly.";
    return true;
  }
}

// Country Code Mapping
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

nameInput.addEventListener("blur", () => validateField("name", nameInput.value));
emailInput.addEventListener("blur", () => validateField("email", emailInput.value));
phoneInput.addEventListener("blur", () => validateField("phone", phoneInput.value));

//  Submit form only when all fields are valid 
submitBtn.addEventListener("click", async () => {
  if (
    !validateField("name", nameInput.value) ||
    !validateField("email", emailInput.value) ||
    !validateField("phone", phoneInput.value)
  ) {
    speak("Please ensure all fields are filled correctly before submitting.");
    return;
  }

  const formData = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    countryCode: countryCodeSelect.value.trim(),
    phone: phoneInput.value.trim(),
  };

  const response = await fetch("/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });

  const result = await response.json();
  alert(result.message);

  speak("Form submitted successfully! Next user can start now.");
  clearForm(); // Reset form after submission
});

// Clear Form Function
function clearForm() {
  nameInput.value = "";
  emailInput.value = "";
  phoneInput.value = "";
  countryCodeSelect.value = "+91"; // Default to India

  // Hide validation messages
  nameError.style.display = "none";
  nameValid.style.display = "none";
  emailError.style.display = "none";
  emailValid.style.display = "none";
  phoneError.style.display = "none";
  phoneValid.style.display = "none";

  // Reset form tracking variables
  step = 0;
  isFormCompleted = false;

  speak("Form cleared.");
}

// ** Attach Clear Form Function to the Button **
clearFormBtn.addEventListener("click", clearForm);

//  Help Button Functionality
helpBtn.addEventListener("click", () => {
  speak("Welcome to the voice-enabled form.");
  speak("Click 'Start Voice Input' to fill the form using your voice.");
  speak("You can also type manually, and I will validate your input.");
  speak("Click 'Submit' when you're done.");
});

// Save progress
saveBtn.addEventListener("click", () => {
  speak("Saving your progress.");
});

// ** Update isFormCompleted when all fields are filled & valid **
function checkFormCompletion() {
  if (
    validateField("name", nameInput.value) &&
    validateField("email", emailInput.value) &&
    validateField("phone", phoneInput.value)
  ) {
    isFormCompleted = true;
  } else {
    isFormCompleted = false;
  }
}

//  Form Downloading
downloadBtn.addEventListener("click", () => {
  checkFormCompletion(); // Ensure latest form completion check

  if (!isFormCompleted) {
    speak("Form is incomplete to download.");
    return; // Stop execution if form is incomplete
  }

  const formData = {
    name: nameInput.value,
    email: emailInput.value,
    countryCode: countryCodeSelect.value,
    phone: phoneInput.value,
  };

  const blob = new Blob([JSON.stringify(formData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "form_data.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  speak("Form data has been successfully downloaded.");
});

// Stop speech synthesis when the page is refreshed
window.addEventListener("beforeunload", () => {
  synth.cancel(); // Stop speech immediately
});

// Stop speech synthesis when the Clear button is clicked
clearFormBtn.addEventListener("click", () => {
  synth.cancel(); // Stop any ongoing speech
});

