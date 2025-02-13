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

let step = 0;
let isListening = false;
let isFormCompleted = false;

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = "en-US";
recognition.interimResults = false;
recognition.continuous = true; // Keeps recognition active
recognition.maxAlternatives = 1;

const synth = window.speechSynthesis;

// Function to speak with delay
function speak(text, delay = 2000) {
  setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    synth.speak(utterance);
  }, delay);
}

// Function to remove full stops from voice input
function cleanVoiceInput(text) {
  return text.replace(/\.$/, ""); // Removes period at the end
}

// Start/stop voice recognition
recordBtn.addEventListener("click", () => {
  if (isListening) {
    recognition.stop();
    recordBtn.textContent = "🎤 Start Voice Input";
    isListening = false;
  } else {
    isListening = true;
    recognition.start();
    recordBtn.textContent = "⏹ Stop Voice Input";
    step = 0;
    isFormCompleted = false;
    speakAndHighlightNextField();
  }
});

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
        setTimeout(speakAndHighlightNextField, 4000);
      }
      break;
    case 1:
      emailInput.value = transcript;
      if (validateField("email", transcript)) {
        speak(`You have entered ${transcript} as your email.`);
        step++;
        setTimeout(speakAndHighlightNextField, 4000);
      }
      break;
    case 2:
      const countryCode = getCountryCodeFromSpeech(transcript);
      if (countryCode) {
        countryCodeSelect.value = countryCode;
        speak(`You have selected ${transcript} as your country.`);
        step++;
        setTimeout(speakAndHighlightNextField, 4000);
      } else {
        speak("Sorry, country not recognized. Please try again.");
      }
      break;
    case 3:
      phoneInput.value = transcript.replace(/\D/g, ""); // Remove non-numeric characters
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

// Speak next field prompt & prevent repetition
function speakAndHighlightNextField() {
  const fields = ["name", "email", "countryCode", "phone"];
  if (step < fields.length) {
    speak(`Please enter your ${fields[step]}.`, 3000);
    document.getElementById(fields[step]).focus();
  }
}

// Validate user input
function validateField(field, value) {
  if (field === "name") {
    if (!/^[A-Za-z ]+$/.test(value)) {
      nameError.style.display = "block";
      nameValid.style.display = "none";
      speak("Name should only contain letters Please Enter your name again");
      return false;
    }
    nameError.style.display = "none";
    nameValid.style.display = "block";
    return true;
  }

  if (field === "email") {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(value)) {
      emailError.style.display = "block";
      emailValid.style.display = "none";
      speak("Please enter a valid email address Please make sure @ symbol is available");
      return false;
    }
    emailError.style.display = "none";
    emailValid.style.display = "block";
    return true;
  }

  if (field === "phone") {
    if (!/^[789]\d{9}$/.test(value)) {
      phoneError.style.display = "block";
      phoneValid.style.display = "none";
      speak("Phone number must start with 7, 8, or 9 and be exactly 10 digits.");
      return false;
    }
    phoneError.style.display = "none";
    phoneValid.style.display = "block";
    return true;
  }
}

// Convert spoken country name to country code
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
submitBtn.addEventListener("click", async () => {
  if (!isFormCompleted) {
    speak("Please complete all fields before submitting.");
    return;
  }

  const formData = {
    name: nameInput.value,
    email: emailInput.value,
    countryCode: countryCodeSelect.value,
    phone: phoneInput.value,
  };

  const response = await fetch("/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });

  const result = await response.json();
  alert(result.message);

  document.getElementById("form").reset();
  step = 0;
  isFormCompleted = false;
  speak("Form submitted successfully! Next user can start now.");
});

// Help button
helpBtn.addEventListener("click", () => {
  speak("Say 'start' to begin filling the form.");
  speak("I will guide you through each field.");
});

// Save progress
saveBtn.addEventListener("click", () => {
  speak("Saving your progress.");
});

// Download form data
downloadBtn.addEventListener("click", async () => {
  const formData = JSON.stringify({
    name: nameInput.value,
    email: emailInput.value,
    countryCode: countryCodeSelect.value,
    phone: phoneInput.value,
  });

  const blob = new Blob([formData], { type: "text/plain" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "form_data.txt";
  document.body.appendChild(a);
  a.click();
  a.remove();
});

// Toggle voice input
toggleBtn.addEventListener("click", () => {
  isListening ? recognition.stop() : recognition.start();
  isListening = !isListening;
});
