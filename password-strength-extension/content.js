let isEnabled = true;

// Check sync settings
chrome.storage.sync.get({ enabled: true }, (data) => {
  isEnabled = data.enabled;
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled) {
    isEnabled = changes.enabled.newValue;
    if (!isEnabled && popup) popup.style.display = "none";
  }
});

// Construct native-looking popup widget
const popup = document.createElement("div");
popup.id = "keyguard-popup";
popup.innerHTML = `
  <div class="kg-header">
    <div class="kg-brand">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
      KeyGuard
    </div>
    <span id="kg-status" class="kg-status" style="color: #64748b;">Evaluating</span>
  </div>
  <div class="kg-segments">
    <div class="kg-segment" id="seg-1"></div>
    <div class="kg-segment" id="seg-2"></div>
    <div class="kg-segment" id="seg-3"></div>
    <div class="kg-segment" id="seg-4"></div>
    <div class="kg-segment" id="seg-5"></div>
  </div>
  <div id="rule-len" class="kg-rule"><span class="kg-rule-icon">✓</span>6–20 characters</div>
  <div id="rule-low" class="kg-rule"><span class="kg-rule-icon">✓</span>Lowercase letter</div>
  <div id="rule-up" class="kg-rule"><span class="kg-rule-icon">✓</span>Uppercase letter</div>
  <div id="rule-num" class="kg-rule"><span class="kg-rule-icon">✓</span>Number (0–9)</div>
  <div id="rule-sym" class="kg-rule"><span class="kg-rule-icon">✓</span>Symbol (!@#$...)</div>
`;
document.body.appendChild(popup);

const statusEl = popup.querySelector("#kg-status");
const segments = [
  popup.querySelector("#seg-1"),
  popup.querySelector("#seg-2"),
  popup.querySelector("#seg-3"),
  popup.querySelector("#seg-4"),
  popup.querySelector("#seg-5")
];
const rules = {
  len: popup.querySelector("#rule-len"),
  low: popup.querySelector("#rule-low"),
  up: popup.querySelector("#rule-up"),
  num: popup.querySelector("#rule-num"),
  sym: popup.querySelector("#rule-sym")
};

function evaluate(val) {
  const checks = {
    len: val.length >= 6 && val.length <= 20,
    low: /[a-z]/.test(val),
    up: /[A-Z]/.test(val),
    num: /\d/.test(val),
    sym: /[!@#$%^&*(),.?":{}|<>]/.test(val)
  };
  const score = Object.values(checks).filter(Boolean).length;
  return { score, checks };
}

function updateView(val) {
  const { score, checks } = evaluate(val);

  for (const [key, passed] of Object.entries(checks)) {
    if (passed) {
      rules[key].classList.add("valid");
      rules[key].classList.remove("invalid");
    } else {
      rules[key].classList.remove("valid");
      rules[key].classList.add("invalid");
    }
  }

  // Segment colors
  let activeColor = "#ef4444"; // red
  let statusText = "Weak";

  if (score >= 5) {
    activeColor = "#10b981"; // emerald
    statusText = "Strong";
  } else if (score >= 3) {
    activeColor = "#f59e0b"; // amber
    statusText = "Moderate";
  }

  statusEl.textContent = val.length === 0 ? "Empty" : statusText;
  statusEl.style.color = val.length === 0 ? "#64748b" : activeColor;

  segments.forEach((seg, index) => {
    if (index < score && val.length > 0) {
      seg.style.backgroundColor = activeColor;
    } else {
      seg.style.backgroundColor = "#334155";
    }
  });
}

function positionPopup(target) {
  const rect = target.getBoundingClientRect();
  popup.style.top = `${rect.bottom + window.scrollY + 6}px`;
  popup.style.left = `${rect.left + window.scrollX}px`;
}

function attachInput(input) {
  if (input.dataset.keyguardActive) return;
  input.dataset.keyguardActive = "true";

  input.addEventListener("focus", () => {
    if (!isEnabled) return;
    positionPopup(input);
    popup.style.display = "block";
    updateView(input.value);
  });

  input.addEventListener("input", () => {
    if (!isEnabled) return;
    positionPopup(input);
    updateView(input.value);
  });

  input.addEventListener("blur", () => {
    popup.style.display = "none";
  });
}

document.querySelectorAll('input[type="password"]').forEach(attachInput);

const obs = new MutationObserver(() => {
  document.querySelectorAll('input[type="password"]').forEach(attachInput);
});
obs.observe(document.body, { childList: true, subtree: true });
