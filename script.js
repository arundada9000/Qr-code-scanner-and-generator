// Initialization
const typeSelect = document.getElementById("typeSelect");
const mainInput = document.getElementById("mainInput");
const ssidInput = document.getElementById("ssidInput");
const passInput = document.getElementById("passInput");
const canvasContainer = document.getElementById("canvasContainer");
const downloadBtn = document.getElementById("downloadBtn");
const historyList = document.getElementById("historyList");

const modal = document.getElementById("privacyModal");
const openBtn = document.getElementById("openPrivacy");
const closeBtn = document.querySelector(".close-modal");

// Add this inside your updateQR function after qrcode.makeCode(data);
function rotateLogo() {
  const logo = document.querySelector("header h1");
  logo.style.transition =
    "transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
  logo.style.transform = "rotate(360deg)";

  // Reset it after animation so it can spin again next time
  setTimeout(() => {
    logo.style.transition = "none";
    logo.style.transform = "rotate(0deg)";
  }, 600);
}

openBtn.onclick = (e) => {
  e.preventDefault();
  modal.style.display = "block";
};

closeBtn.onclick = () => {
  modal.style.display = "none";
};

window.onclick = (event) => {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

// Generator Instance
let qrcode = new QRCode(canvasContainer, {
  width: 200,
  height: 200,
  colorDark: "#000000",
  colorLight: "#ffffff",
  correctLevel: QRCode.CorrectLevel.H,
});

// 1. GENERATOR LOGIC
function updateQR() {
  let data = "";
  if (typeSelect.value === "wifi") {
    if (!ssidInput.value) return;
    data = `WIFI:S:${ssidInput.value};T:WPA;P:${passInput.value};;`;
  } else {
    data = mainInput.value.trim();
  }

  if (data) {
    qrcode.makeCode(data);
    downloadBtn.classList.remove("hidden");
  } else {
    downloadBtn.classList.add("hidden");
  }
}

typeSelect.onchange = () => {
  const isWifi = typeSelect.value === "wifi";
  document.getElementById("standardInputs").classList.toggle("hidden", isWifi);
  document.getElementById("wifiInputs").classList.toggle("hidden", !isWifi);
  updateQR();
};

[mainInput, ssidInput, passInput].forEach((input) => {
  input.oninput = updateQR;
});

downloadBtn.onclick = () => {
  // 1. Find the hidden canvas that qrcode.js uses
  const canvas = canvasContainer.querySelector("canvas");
  if (!canvas) {
    alert("QR Code not ready yet!");
    return;
  }

  // 2. Convert canvas to a high-quality PNG Blob
  canvas.toBlob(
    (blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "SajiloQR.png";

      // 3. Trigger download (Required for mobile browsers)
      document.body.appendChild(link);
      link.click();

      // 4. Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    },
    "image/png",
    1.0
  );

  // Save to History & Animation
  const currentData =
    typeSelect.value === "wifi" ? `WiFi: ${ssidInput.value}` : mainInput.value;
  saveToHistory(currentData);
  rotateLogo();
};

// 2. SCANNER LOGIC
const video = document.getElementById("scanVideo");
const toggleCamBtn = document.getElementById("toggleCamera");
const resultBox = document.getElementById("resultBox");
const resultText = document.getElementById("resultText");
const scanStatus = document.getElementById("scanStatus");
let stream = null;
let isScanning = false;

async function toggleCamera() {
  if (isScanning) {
    stopCamera();
  } else {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      video.srcObject = stream;
      video.play();
      isScanning = true;
      toggleCamBtn.innerText = "Stop Camera";
      document.getElementById("scannerLine").classList.remove("hidden");
      scanStatus.innerText = "Scanning...";
      requestAnimationFrame(scanLoop);
    } catch (err) {
      alert("Camera access denied or not found.");
    }
  }
}

function stopCamera() {
  if (stream) stream.getTracks().forEach((t) => t.stop());
  video.srcObject = null;
  isScanning = false;
  toggleCamBtn.innerText = "Start Camera";
  document.getElementById("scannerLine").classList.add("hidden");
  scanStatus.innerText = "Camera Offline";
}

function scanLoop() {
  if (!isScanning) return;
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, canvas.width, canvas.height);

    if (code) {
      showScanResult(code.data);
      saveToHistory(code.data);
      stopCamera();
      return; // Stop loop once found
    }
  }
  requestAnimationFrame(scanLoop);
}

// 3. UPLOAD LOGIC
document.getElementById("uploadInput").onchange = (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = (f) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const code = jsQR(
        ctx.getImageData(0, 0, canvas.width, canvas.height).data,
        canvas.width,
        canvas.height
      );
      if (code) showScanResult(code.data);
      else alert("No QR code detected in this image.");
    };
    img.src = f.target.result;
  };
  reader.readAsDataURL(file);
};

function showScanResult(data) {
  resultBox.classList.remove("hidden");
  resultText.innerText = data;
  saveToHistory(data);
}

document.getElementById("copyResult").onclick = () => {
  navigator.clipboard.writeText(resultText.innerText);
  alert("Copied!");
};
function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
}
// 4. HISTORY LOGIC
function saveToHistory(data) {
  let history = JSON.parse(localStorage.getItem("qr_logs") || "[]");
  if (history[0] === data) return; // Avoid spam
  history.unshift(data);
  localStorage.setItem("qr_logs", JSON.stringify(history.slice(0, 10)));
  renderHistory();
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem("qr_logs") || "[]");
  historyList.innerHTML = history.length
    ? history
        .map(
          (h) => `
        <div class="history-item">
            <span><i class="fas fa-history"></i> ${h.substring(0, 35)}${
            h.length > 35 ? "..." : ""
          }</span>
            <button class="btn-text" onclick="copyToClipboard('${h}')"><i class="fas fa-copy copy-btn"></i></button>
        </div>
    `
        )
        .join("")
    : '<p class="empty-text">No recent items</p>';
}

document.getElementById("clearHistory").onclick = () => {
  localStorage.removeItem("qr_logs");
  renderHistory();
};

// 5. THEME TOGGLE
document.getElementById("darkModeToggle").onclick = () => {
  document.body.classList.toggle("dark-mode");
};

toggleCamBtn.onclick = toggleCamera;
renderHistory();

mainInput.value = "I love you Pooju";
typeSelect.value = "text";
updateQR();
