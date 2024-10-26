document.getElementById("saveQrBtn").addEventListener("click", saveQRCode);

document.getElementById("generateBtn").addEventListener("click", function () {
  const type = document.getElementById("typeSelect").value;
  const inputValue = document.getElementById("inputValue").value;
  let qrData;

  if (!inputValue.trim()) {
    alert("Please enter a value.");
    return;
  }
  switch (type) {
    case "text":
      qrData = inputValue;
      break;
    case "url":
      qrData = inputValue.startsWith("http")
        ? inputValue
        : "http://" + inputValue;
      break;
    case "email":
      qrData = `mailto:${inputValue}`;
      break;
    case "phone":
      qrData = `tel:${inputValue}`;
      break;
    case "wifi":
      const [ssid, password] = inputValue.split(",");
      qrData = `WIFI:Type:WPA;SSID:${ssid};Password:${password};;`;
      break;
  }

  $("#qrCanvas").empty();
  $("#qrCanvas").qrcode({
    width: 200,
    height: 200,
    text: qrData,
  });
  document.getElementById("saveQrBtn").style.display = "inline-block";
});

// Scanner Logic
let video = document.getElementById("video");
let output = document.getElementById("output");
let startScanBtn = document.getElementById("startScanBtn");
let stopScanBtn = document.getElementById("stopScanBtn");
let fileInput = document.getElementById("fileInput");
let scanInterval;

startScanBtn.addEventListener("click", startScanner);
stopScanBtn.addEventListener("click", stopScanner);
document
  .getElementById("uploadBtn")
  .addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", handleFileSelect);

function scanQRCode() {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const qrCode = jsQR(imageData.data, canvas.width, canvas.height);

  if (qrCode) {
    output.innerText = `QR Code detected: ${qrCode.data}`;
    stopScanner();

    handleQRCodeData(qrCode.data);
  }
}

function handleQRCodeData(data) {
  if (data.startsWith("mailto:")) {
    window.location.href = data;
  } else if (data.startsWith("tel:")) {
    window.location.href = data;
  } else if (data.startsWith("WIFI:")) {
    output.innerText = `Wi-Fi QR Code detected: ${data}`;
  } else {
    output.innerText = `Scanned QR Code: ${data}`;
  }
}

document.getElementById("backBtn").addEventListener("click", function () {
  stopScanner();
});

function startScanner() {
  startScanBtn.disabled = true;
  stopScanBtn.style.display = "inline-block";
  backBtn.style.display = "none";
  startScanBtn.innerText = "Scanning...";
  output.innerText = "Scanning for QR code...";

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then(function (stream) {
        video.srcObject = stream;
        video.style.display = "block";
        video.play();
        scanInterval = setInterval(scanQRCode, 300);
        backBtn.style.display = "inline-block";
      })
      .catch(function (err) {
        console.error("Error accessing camera: ", err);
        output.innerText = "Error accessing camera";
      });
  } else {
    output.innerText = "Camera not supported";
  }
}

function stopScanner() {
  clearInterval(scanInterval);
  video.style.display = "none";
  startScanBtn.disabled = false;
  startScanBtn.innerText = "Start Scanning";
  stopScanBtn.style.display = "none";
  backBtn.style.display = "none";

  // Reset video styles
  video.style.position = "";
  video.style.width = "";
  video.style.height = "";
  video.style.zIndex = "";

  document.querySelector(".container").style.display = "block";

  if (video.srcObject) {
    let stream = video.srcObject;
    let tracks = stream.getTracks();
    tracks.forEach((track) => track.stop());
  }
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      context.drawImage(img, 0, 0);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const qrCode = jsQR(imageData.data, canvas.width, canvas.height);
      if (qrCode) {
        output.innerText = `QR Code detected: ${qrCode.data}`;
        handleQRCodeData(qrCode.data);
      } else {
        output.innerText = "No QR Code found.";
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function saveQRCode() {
  const qrCodeCanvas = document.querySelector("#qrCanvas canvas");

  if (qrCodeCanvas) {
    const qrImage = qrCodeCanvas.toDataURL("image/png");

    const downloadLink = document.createElement("a");
    downloadLink.href = qrImage;
    downloadLink.download = "qrcode.png";
    downloadLink.click();
  } else {
    alert("Generate a QR code first!");
  }
}
