async function getCameras() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    const camera1Select = document.getElementById('camera1');
    const camera2Select = document.getElementById('camera2');
    videoDevices.forEach(device => {
        const option1 = document.createElement('option');
        option1.value = device.deviceId;
        option1.text = device.label;
        camera1Select.appendChild(option1);
        const option2 = document.createElement('option');
        option2.value = device.deviceId;
        option2.text = device.label;
        camera2Select.appendChild(option2);
    });
}

async function setupCamera(videoElement, deviceId) {
    const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } }
    });
    videoElement.srcObject = stream;
}

async function detectFaceOrientation(videoElement) {
    const canvas = document.getElementById('canvas');
    const displaySize = { width: videoElement.width, height: videoElement.height };
    faceapi.matchDimensions(canvas, displaySize);
    const detections = await faceapi.detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions());
    if (detections.length === 0) return null;
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    const face = resizedDetections.detection.box;
    const centerX = face.x + face.width / 2;
    const centerY = face.y + face.height / 2;
    return { centerX, centerY };
}

async function chooseBestFrame(video1, video2) {
    const orientation1 = await detectFaceOrientation(video1);
    const orientation2 = await detectFaceOrientation(video2);
    if (!orientation1 && !orientation2) return video1;
    if (!orientation1) return video2;
    if (!orientation2) return video1;
    const centerX1 = Math.abs(orientation1.centerX - video1.width / 2);
    const centerX2 = Math.abs(orientation2.centerX - video2.width / 2);
    return centerX1 < centerX2 ? video1 : video2;
}

async function startCameras() {
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    const video1 = document.getElementById('video1');
    const video2 = document.getElementById('video2');
    const camera1 = document.getElementById('camera1').value;
    const camera2 = document.getElementById('camera2').value;
    await setupCamera(video1, camera1);
    await setupCamera(video2, camera2);

    setInterval(async () => {
        const bestFrame = await chooseBestFrame(video1, video2);
        bestFrame.style.border = '5px solid green';
        if (bestFrame === video1) {
            video2.style.border = 'none';
        } else {
            video1.style.border = 'none';
        }
    }, 1000);
}

getCameras();
