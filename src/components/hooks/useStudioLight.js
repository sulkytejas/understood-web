import { useEffect, useRef } from 'react';

const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  void main() {
    gl_Position = vec4(a_position, 0, 1);
    v_texCoord = a_texCoord;
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D u_image;
  
  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    
    // Warm, soft lighting effect
    float brightness = 1.12;
    float warmth = 1.05;
    float softLight = 0.15;
    
    // Apply warm light
    vec3 warm = vec3(1.0, 0.95, 0.9);
    vec3 brightColor = color.rgb * brightness;
    vec3 warmColor = brightColor * warm;
    
    // Soft light blend
    vec3 softLightColor = mix(warmColor, vec3(1.0), softLight);
    
    gl_FragColor = vec4(softLightColor, color.a);
  }
`;

const useStudioLight = (videoRef, enabled = true) => {
  const glRef = useRef(null);
  const programRef = useRef(null);
  const textureRef = useRef(null);

  // Instead of creating a new canvas, use the existing video element
  const setupWebGL = () => {
    if (!videoRef.current) return;

    try {
      // Try to get WebGL context from the video element's parent canvas if it exists
      const canvas = videoRef.current.parentElement.querySelector('canvas');
      if (!canvas) return;

      // Initialize WebGL
      const gl = canvas.getContext('webgl', {
        preserveDrawingBuffer: true,
        antialias: true,
        premultipliedAlpha: false, // Important for video transparency
        alpha: true,
      });

      if (!gl) return;
      glRef.current = gl;

      // Create and compile shaders
      const vertexShader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vertexShader, vertexShaderSource);
      gl.compileShader(vertexShader);

      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fragmentShader, fragmentShaderSource);
      gl.compileShader(fragmentShader);

      // Create and link program
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      gl.useProgram(program);
      programRef.current = program;

      // Setup position buffer
      const positionBuffer = gl.createBuffer();
      const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

      const positionLocation = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      // Setup texture
      textureRef.current = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    } catch (error) {
      console.error('Error setting up WebGL:', error);
    }
  };

  const applyStudioLight = () => {
    if (!glRef.current || !videoRef.current || !enabled) return;

    const gl = glRef.current;

    try {
      // Update texture with current video frame
      gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        videoRef.current,
      );

      // Draw
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    } catch (error) {
      console.error('Error applying studio light:', error);
    }
  };

  useEffect(() => {
    if (!enabled) return;

    const handleVideoLoad = () => {
      setupWebGL();
    };

    // Wait for face tracking to setup its canvas
    const checkForCanvas = setInterval(() => {
      if (videoRef.current?.parentElement?.querySelector('canvas')) {
        clearInterval(checkForCanvas);
        handleVideoLoad();
      }
    }, 100);

    return () => {
      clearInterval(checkForCanvas);
      if (glRef.current) {
        const gl = glRef.current;
        gl.deleteProgram(programRef.current);
        gl.deleteTexture(textureRef.current);
      }
    };
  }, [enabled, videoRef.current]);

  // Instead of creating our own render loop, provide a method to apply the effect
  return {
    enabled,
    applyStudioLight,
  };
};

export default useStudioLight;
