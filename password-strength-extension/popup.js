function generateStrongPassword(len = 16) {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const nums = "23456789";
  const syms = "!@#$%^&*()_+-=.,";
  const all = upper + lower + nums + syms;
  
  let pswd = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    nums[Math.floor(Math.random() * nums.length)],
    syms[Math.floor(Math.random() * syms.length)]
  ];
  
  for (let i = pswd.length; i < len; i++) {
    pswd.push(all[Math.floor(Math.random() * all.length)]);
  }
  
  return pswd.sort(() => Math.random() - 0.5).join('');
}

const passOutput = document.getElementById('pass-output');
const btnRefresh = document.getElementById('btn-refresh');
const btnCopy = document.getElementById('btn-copy');
const toast = document.getElementById('toast');
const toggle = document.getElementById('toggle-enabled');

function refreshPass() {
  passOutput.textContent = generateStrongPassword(16);
  toast.textContent = "";
}

// Load toggle preference
chrome.storage.sync.get({ enabled: true }, (data) => {
  toggle.checked = data.enabled;
});

toggle.addEventListener('change', () => {
  chrome.storage.sync.set({ enabled: toggle.checked });
});

btnRefresh.addEventListener('click', refreshPass);

btnCopy.addEventListener('click', () => {
  navigator.clipboard.writeText(passOutput.textContent).then(() => {
    toast.textContent = "Copied to clipboard!";
    setTimeout(() => { toast.textContent = ""; }, 2000);
  });
});

refreshPass();
