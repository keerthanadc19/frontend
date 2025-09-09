const backendURL = "https://ssd-mobilenet-backend.onrender.com"; // <-- replace with your backend URL

// Start webcam
const video = document.getElementById("video");
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => video.srcObject = stream)
    .catch(err => alert("Error accessing webcam: " + err));

// Upload model
async function uploadModel() {
    const caffemodelFile = document.getElementById("caffemodel").files[0];
    const prototxtFile = document.getElementById("prototxt").files[0];
    if (!caffemodelFile || !prototxtFile) {
        alert("Select both files");
        return;
    }

    const formData = new FormData();
    formData.append("caffemodel", caffemodelFile);
    formData.append("prototxt", prototxtFile);

    try {
        const response = await fetch(`${backendURL}/upload_model`, { method: "POST", body: formData });
        const data = await response.json();
        document.getElementById("uploadStatus").innerText = data.status || "Error: " + data.error;
    } catch (err) {
        document.getElementById("uploadStatus").innerText = "Upload failed: " + err;
    }
}

// Send webcam frames to backend every second
setInterval(async () => {
    if (!video.srcObject) return;
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/jpeg").split(",")[1];

    try {
        const response = await fetch(`${backendURL}/detect`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: imageData })
        });
        const result = await response.json();
        const detDiv = document.getElementById("detections");
        detDiv.innerHTML = "";
        if (result.detections) {
            result.detections.forEach(det => {
                const p = document.createElement("p");
                p.innerText = `${det.label} (${Math.round(det.confidence*100)}%)`;
                detDiv.appendChild(p);
            });
        }
    } catch (err) {
        console.log("Detection error:", err);
    }
}, 1000);
