const backendURL = "https://ssd-mobilenet-backend.onrender.com"; // Replace with your backend URL

// Create hidden video element for capturing frames
const video = document.createElement("video");
video.width = 640;
video.height = 480;
video.autoplay = true;
video.style.display = "none";
document.body.appendChild(video);

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Flag to check if model is loaded
let modelLoaded = false;

// Start webcam
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        video.srcObject = stream;
        video.play();
    })
    .catch(err => alert("Error accessing webcam: " + err));

// Upload model function
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
        if (data.status) {
            document.getElementById("uploadStatus").innerText = data.status;
            modelLoaded = true; // ✅ Enable detection
        } else {
            document.getElementById("uploadStatus").innerText = "Error: " + data.error;
        }
    } catch (err) {
        document.getElementById("uploadStatus").innerText = "Upload failed: " + err;
    }
}

// Draw video + bounding boxes on canvas
function drawDetections(detections) {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    detections.forEach(det => {
        const [startX, startY, endX, endY] = det.box;
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.strokeRect(startX, startY, endX - startX, endY - startY);

        ctx.fillStyle = "red";
        ctx.font = "16px Arial";
        ctx.fillText(`${det.label} (${Math.round(det.confidence*100)}%)`, startX, startY - 5);
    });
}

// Send webcam frames to backend every 500ms only if model is loaded
setInterval(async () => {
    if (!video.srcObject || !modelLoaded) return; // ❌ Skip if model not uploaded

    const imageData = canvas.toDataURL("image/jpeg").split(",")[1];

    try {
        const response = await fetch(`${backendURL}/detect`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: imageData })
        });

        const result = await response.json();

        if (result.detections) {
            drawDetections(result.detections);

            // Show text list
            const detDiv = document.getElementById("detections");
            detDiv.innerHTML = "";
            result.detections.forEach(det => {
                const p = document.createElement("p");
                p.innerText = `${det.label} (${Math.round(det.confidence*100)}%)`;
                detDiv.appendChild(p);
            });
        }
    } catch (err) {
        console.log("Detection error:", err);
    }
}, 500);
