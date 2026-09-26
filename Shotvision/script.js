// ==========================================
// AI CAMERA SHOT DETECTOR
// ==========================================

// HTML elements
const video = document.getElementById("video");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

const shotType = document.getElementById("shotType");
const subjectSize = document.getElementById("subjectSize");
const statusText = document.getElementById("status");
const positionText = document.getElementById("Position");


// Camera stream
let cameraStream = null;


// ==========================================
// MEDIAPIPE POSE
// ==========================================

const pose = new Pose({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
    }
});


// Basic settings
pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.4,
    minTrackingConfidence: 0.4
});

// Get MediaPipe result
pose.onResults(onResults);


// ==========================================
// START CAMERA
// ==========================================

async function startCamera() {

    try {

        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });

        video.srcObject = cameraStream;

        statusText.textContent = "Camera ON";

        startBtn.disabled = true;

        processCamera();

    } catch (error) {

        console.error(error);

        statusText.textContent = "Camera OFF";

        alert("Please allow camera permission.");

    }
}


// ==========================================
// PROCESS CAMERA
// ==========================================

async function processCamera() {

    if (!cameraStream) {
        return;
    }

    try {

        if (video.readyState >= 2) {

            await pose.send({
                image: video
            });

        }

    } catch (error) {

        console.error("Detection Error:", error);

    }

    // Continue detection
    if (cameraStream) {

        requestAnimationFrame(processCamera);

    }
}

// ==========================================
// STOP CAMERA
// ==========================================

function stopCamera() {

    if (cameraStream) {

        cameraStream.getTracks().forEach(track => {
            track.stop();
        });

        cameraStream = null;
    }

    video.srcObject = null;

    shotType.textContent = "Camera Off";

    subjectSize.textContent = "0%";

    positionText.textContent = "-";

    startBtn.disabled = false;
}


// ==========================================
// MEDIAPIPE RESULT
// ==========================================

function onResults(results) {

    // ======================================
    // NO PERSON DETECTED
    // ======================================

    if (!results.poseLandmarks) {

        shotType.textContent = "No Person";

        subjectSize.textContent = "0%";

        positionText.textContent = "-";

        return;
    }


    // ======================================
    // GET LANDMARKS
    // ======================================

    const landmarks = results.poseLandmarks;


    // ======================================
    // BODY SIZE
    // ======================================

    let minY = 1;
    let maxY = 0;


    // ======================================
    // BODY POSITION
    // ======================================

    let minX = 1;
    let maxX = 0;


    // ======================================
    // CLARITY
    // ======================================

    let totalVisibility = 0;
    let visiblePoints = 0;


    // ======================================
    // READ LANDMARKS
    // ======================================

    landmarks.forEach(point => {

        if (point.visibility > 0.5) {

            // Y position
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);

            // X position
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);

            // Visibility
            totalVisibility += point.visibility;

            visiblePoints++;

        }

    });


    // ======================================
    // BODY HEIGHT
    // ======================================

    const bodyHeight = maxY - minY;

    const sizePercentage = bodyHeight * 100;


    // ======================================
    // CLARITY
    // ======================================

    let clarity = 0;

    if (visiblePoints > 0) {

        clarity =
            (totalVisibility / visiblePoints) * 100;

    }

    subjectSize.textContent =
        Math.round(clarity) + "%";


    // ======================================
    // PERSON CENTER
    // ======================================

    if (visiblePoints > 0) {

        const centerX = (minX + maxX) / 2;

        const centerY = (minY + maxY) / 2;

        detectPosition(centerX, centerY);

    }


    // ======================================
    // CAMERA SHOT
    // ======================================

    detectShot(sizePercentage);

}

// ==========================================
// POSITION DETECTION
// ==========================================

function detectPosition(x, y) {

    // Distance from center
    const xDistance = Math.abs(x - 0.5);
    const yDistance = Math.abs(y - 0.5);


    // ======================================
    // CENTER
    // ======================================

    if (xDistance < 0.15 && yDistance < 0.15) {

        positionText.textContent = "CENTER";

        return;
    }


    // ======================================
    // LEFT / RIGHT
    // ======================================

    if (xDistance > yDistance) {

        if (x < 0.5) {

            positionText.textContent = "LEFT";

        } else {

            positionText.textContent = "RIGHT";

        }

        return;
    }


    // ======================================
    // UP / DOWN
    // ======================================

    if (y < 0.5) {

        positionText.textContent = "UP";

    } else {

        positionText.textContent = "DOWN";

    }

}

// ==========================================
// CAMERA SHOT DETECTION
// ==========================================

function detectShot(size) {

    if (size < 20) {

        shotType.textContent =
            "EXTREME WIDE SHOT";

    }

    else if (size < 40) {

        shotType.textContent =
            "WIDE SHOT";

    }

    else if (size < 70) {

        shotType.textContent =
            "MEDIUM SHOT";

    }

    else {

        shotType.textContent =
            "CLOSE-UP";

    }

}


// ==========================================
// BUTTONS
// ==========================================

startBtn.addEventListener(
    "click",
    startCamera
);

stopBtn.addEventListener(
    "click",
    stopCamera
);

