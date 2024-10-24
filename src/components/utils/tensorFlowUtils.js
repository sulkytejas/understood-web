import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as blazeface from '@tensorflow-models/blazeface';

let model = null;

async function initializeTensorFlowBackend() {
  await tf.setBackend('webgl');
  await tf.ready();
}

async function loadBlazeFace() {
  if (!model) {
    model = await blazeface.load();
    console.log('BlazeFace model loaded');
  }

  return model;
}

async function initializeTensorFlow() {
  await initializeTensorFlowBackend();
  await loadBlazeFace();
}

async function processFrame(videoElement, canvas, ctx) {
  if (videoElement.readyState >= 2) {
    const predictions = await model.estimateFaces(videoElement);

    if (predictions.length > 0) {
      const face = predictions[0];

      // Get the bounding box of the face
      const { topLeft, bottomRight } = face;
      const [x1, y1] = topLeft;
      const [x2, y2] = bottomRight;

      console.log('Original Face Coordinates:', x1, y1, x2, y2);
      console.log(
        'Video Element Dimensions:',
        videoElement.videoWidth,
        videoElement.videoHeight,
      );

      // Calculate the center of the face
      const faceCenterX = (x1 + x2) / 2;
      const faceCenterY = (y1 + y2) / 2;

      // Desired output dimensions (same as canvas dimensions)
      const desiredWidth = canvas.width;
      const desiredHeight = canvas.height;

      // Adjust the frame to center the face
      let sourceX = faceCenterX - desiredWidth / 2;
      let sourceY = faceCenterY - desiredHeight / 2;

      // Ensure the source coordinates are within bounds
      sourceX = Math.max(
        0,
        Math.min(sourceX, videoElement.videoWidth - desiredWidth),
      );
      sourceY = Math.max(
        0,
        Math.min(sourceY, videoElement.videoHeight - desiredHeight),
      );

      // Clear the canvas and draw the adjusted frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        videoElement,
        sourceX, // Source X
        sourceY, // Source Y
        desiredWidth, // Source Width
        desiredHeight, // Source Height
        0, // Destination X
        0, // Destination Y
        desiredWidth, // Destination Width
        desiredHeight, // Destination Height
      );

      // Adjust the bounding box coordinates relative to the cropped frame
      const adjustedX1 = x1 - sourceX;
      const adjustedY1 = y1 - sourceY;
      const boxWidth = x2 - x1;
      const boxHeight = y2 - y1;

      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        adjustedX1, // x-coordinate of the top-left corner
        adjustedY1, // y-coordinate of the top-left corner
        boxWidth, // width of the bounding box
        boxHeight, // height of the bounding box
      );

      console.log('Face detected, bounding box drawn:', x1, y1, x2, y2);
    } else {
      console.log('No face detected');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      console.log('No face detected.');
    }
  }
}

async function generateProcessedStream(videoElement, stream, canvas) {
  // Create a hidden video element to play the original stream

  if (!model) {
    await initializeTensorFlow();
  }

  console.log('Generating processed stream', videoElement, stream);

  // if (!videoElement) {
  //   console.error('Video element is required');
  //   return stream;
  // }

  // videoElement.srcObject = stream;
  // videoElement.muted = true;
  // videoElement.play();

  // // Wait until the video metadata is loaded
  // await new Promise((resolve) => {
  //   videoElement.onloadedmetadata = () => {
  //     resolve();
  //   };
  // });

  // Assign the stream to the video element if not already assigned
  if (!videoElement.srcObject) {
    videoElement.srcObject = stream;
  }
  videoElement.muted = true;

  // Play the video element if not already playing
  if (videoElement.paused) {
    await videoElement.play();
  }

  // Create a canvas to process the frames
  // const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Set canvas dimensions to match video dimensions
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  console.log(
    'Canvas dimensions:',
    canvas.width,
    canvas.height,
    videoElement.videoWidth,
    videoElement.videoHeight,
  );

  // Start capturing the canvas as a video stream
  const processedStream = canvas.captureStream(
    stream.getVideoTracks()[0].getSettings().frameRate || 30,
  );

  async function process() {
    await processFrame(videoElement, canvas, ctx);
    // Schedule the next frame
    requestAnimationFrame(process);
  }

  // Start processing frames
  requestAnimationFrame(process);

  // Return the processed stream
  return processedStream;
}

const detectFace = async (video, model) => {
  const predictions = await model.estimateFaces(video, false);

  if (predictions.length > 0) {
    // Get the bounding box of the face
    const face = predictions[0];
    const { topLeft, bottomRight } = face;

    // Calculate center of the face
    const faceCenterX = (topLeft[0] + bottomRight[0]) / 2;
    const faceCenterY = (topLeft[1] + bottomRight[1]) / 2;

    return { faceCenterX, faceCenterY };
  }
  return null;
};

// const scaleFaceCoordinates = (faceCenterX, faceCenterY, scale) => {
//   // Scale the face center coordinates based on the scale factor
//   const scaledFaceCenterX = faceCenterX * scale;
//   const scaledFaceCenterY = faceCenterY * scale;

//   return { scaledFaceCenterX, scaledFaceCenterY };
// };
let lastFaceCenterX = null;
let lastFaceCenterY = null;
let faceOutOfFrame = false;

// Adjust video position to keep the face centered
const adjustVideoPosition = (
  videoElement,
  faceCenterX,
  faceCenterY,
  videoWidth,
  videoHeight,
  containerWidth,
  containerHeight,
  streamWidth,
  streamHeight,
) => {
  if (
    videoWidth <= 0 ||
    videoHeight <= 0 ||
    containerWidth <= 0 ||
    containerHeight <= 0
  ) {
    console.error(
      'Invalid dimensions: Video or container dimensions must be greater than zero.',
    );
    return;
  }

  if (faceOutOfFrame) {
    if (
      faceCenterX >= 0 &&
      faceCenterX <= streamWidth &&
      faceCenterY >= 0 &&
      faceCenterY <= streamHeight
    ) {
      console.log('Face is back in frame, resetting tracking.');
      faceOutOfFrame = false; // Reset the out-of-frame flag
      lastFaceCenterX = null; // Reset previous face position
      lastFaceCenterY = null;
    } else {
      console.log('Face still out of frame, skipping update.');
      return; // Skip updates until face returns
    }
  }

  // Calculate how much we need to scale (avoid division by zero)
  const scaleX = containerWidth / streamWidth; // How much to scale in X axis
  const scaleY = containerHeight / streamHeight; // How much to scale in Y axis
  const scale = Math.max(scaleX, scaleY); // Use the smaller scale to maintain aspect ratio

  // const { scaledFaceCenterX, scaledFaceCenterY } = scaleFaceCoordinates(
  //   faceCenterX,
  //   faceCenterY,
  //   scale,
  // );

  const scaledStreamWidth = streamWidth * scale;
  const scaledStreamHeight = streamHeight * scale;

  // Step 3: Scale the face center coordinates (in the scaled video)
  const scaledFaceCenterX = faceCenterX * scale;
  const scaledFaceCenterY = faceCenterY * scale;

  // Step 4: Check if the face has moved out of the container bounds
  if (
    scaledFaceCenterX < 0 ||
    scaledFaceCenterX > scaledStreamWidth ||
    scaledFaceCenterY < 0 ||
    scaledFaceCenterY > scaledStreamHeight
  ) {
    faceOutOfFrame = true;
    console.log('Face is out of frame.');
    return; // Stop updating if face is out of frame
  } else {
    faceOutOfFrame = false;
  }

  const threshold = 65; // Minimum movement to trigger updates
  if (
    lastFaceCenterX !== null &&
    lastFaceCenterY !== null &&
    Math.abs(scaledFaceCenterX - lastFaceCenterX) < threshold &&
    Math.abs(scaledFaceCenterY - lastFaceCenterY) < threshold
  ) {
    return; // Skip update if movement is too small
  }

  // Update last known face position
  lastFaceCenterX = scaledFaceCenterX;
  lastFaceCenterY = scaledFaceCenterY;

  // Calculate the cropped area
  // const cropWidth = containerWidth; // We want to crop to the container size
  // const cropHeight = containerHeight;

  // const cropX = Math.max(
  //   0,
  //   Math.min(
  //     scaledFaceCenterX - cropWidth / 2,
  //     streamWidth * scale - cropWidth,
  //   ),
  // );
  // const cropY = Math.max(
  //   0,
  //   Math.min(
  //     scaledFaceCenterY - cropHeight / 2,
  //     streamHeight * scale - cropHeight,
  //   ),
  // );

  // const centerX = containerWidth / 2; // Center of the container in X
  // const centerY = containerHeight / 2;

  const cropWidth = containerWidth; // Crop to the container's width
  const cropHeight = containerHeight; // Crop to the container's height

  // Crop from the center of the face
  const cropX = Math.max(
    0,
    Math.min(scaledFaceCenterX - cropWidth / 2, scaledStreamWidth - cropWidth),
  );
  const cropY = Math.max(
    0,
    Math.min(
      scaledFaceCenterY - cropHeight / 2,
      scaledStreamHeight - cropHeight,
    ),
  );

  // console.log(
  //   'Transforms:',
  //   transformX,
  //   transformY,
  //   'scale:',
  //   scale,
  //   'scaledFaceCenter:',
  //   scaledFaceCenterX,
  //   scaledFaceCenterY,
  //   'center:',
  //   centerX,
  //   centerY,
  // );

  videoElement.style.width = `${scaledStreamWidth}px`;
  videoElement.style.height = `${scaledStreamHeight}px`;
  videoElement.style.transition = 'transform 0.4s ease';
  // Apply the cropping and scaling using CSS transformations
  // Step 5: Apply the translation first
  videoElement.style.transform = `translate(${-cropX}px, ${-cropY}px)`;

  // Step 6: Apply the scaling separately after translation
  // videoElement.style.transform += ` scale(${scale})`;

  videoElement.style.transformOrigin = 'top left'; // Ensure transformations are relative to the top-left corner
};

async function trackFace(videoElement, container, stream) {
  if (!model) {
    await initializeTensorFlow();
  }

  const streamWidth = stream.getVideoTracks()[0].getSettings().width; // Actual video width (e.g., 640px)
  const streamHeight = stream.getVideoTracks()[0].getSettings().height;

  console.log(
    'Stream dimensions:',
    streamWidth,
    streamHeight,
    container.videoWidth,
    container.videoHeight,
  );

  const renderFrame = async () => {
    const face = await detectFace(videoElement, model);

    if (face) {
      adjustVideoPosition(
        videoElement,
        face.faceCenterX,
        face.faceCenterY,
        videoElement.videoWidth,
        videoElement.videoHeight,
        container.clientWidth,
        container.clientHeight,
        streamWidth,
        streamHeight,
      );
    }
    requestAnimationFrame(renderFrame);
  };

  renderFrame();
}

export {
  generateProcessedStream,
  processFrame,
  initializeTensorFlow,
  trackFace,
};
