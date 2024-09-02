let videoStream;
let isRecognizing = false;

const videoElement = document.getElementById('video');
const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');
const outputElement = document.getElementById('output');
const textDisplayElement = document.getElementById('textDisplay');
let words = [];

const continueButton = document.getElementById('continue-button');
const welcomeSection = document.getElementById('welcome-section');
const interpreterSection = document.getElementById('interpreter-section');

continueButton.addEventListener('click', function() {
    welcomeSection.classList.add('hidden');
    interpreterSection.classList.remove('hidden');
});

async function sendFrameToServer(imageBlob) {
    const formData = new FormData();
    formData.append('file', imageBlob, 'frame.jpg');

    try {
        const response = await fetch('/predict', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to fetch prediction');
        }

        const result = await response.json();
        updateTextDisplay(result.prediction);
        outputElement.innerText = `Recognized sign: ${result.prediction}`;
    } catch (error) {
        outputElement.innerText = `Error: ${error.message}`;
    } finally {
        isRecognizing && requestAnimationFrame(() => recognizeSign(videoElement));
    }
}

async function recognizeSign(video) {
    if (!isRecognizing) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
        await sendFrameToServer(blob);
    }, 'image/jpeg');
}

function updateTextDisplay(word) {
    words.push(word);
    textDisplayElement.innerText = words.join(' ');
}

startButton.addEventListener('click', function() {
    if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
        .then(function(stream) {
            videoStream = stream;
            videoElement.srcObject = stream;
            outputElement.innerText = 'Video started. Recognizing signs...';
            isRecognizing = true;
            recognizeSign(videoElement);
        })
        .catch(function(error) {
            outputElement.innerText = `Error accessing the camera: ${error.message}`;
        });
    } else {
        outputElement.innerText = 'Sorry, your browser does not support getUserMedia';
    }
});

stopButton.addEventListener('click', function() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
        outputElement.innerText = 'Video stopped.';
        isRecognizing = false;
        words = [];  // Clear the words array
        textDisplayElement.innerText = '';  // Clear the text display
    }
});