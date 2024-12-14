import { useEffect, useRef } from 'react';
const useStreamAttachment = (videoRef, stream, onError) => {
  //   useEffect(() => {
  //     if (!videoRef.current.videoWidth && !videoRef.current.videoHeight) {
  //       onError?.('Video connection error');
  //     }
  //   }, [videoRef.current, onError]);

  // Keep track of the latest play request
  const playRequestRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current || !stream) return;

    const attachStream = async () => {
      try {
        // Cancel any pending play request
        if (playRequestRef.current) {
          playRequestRef.current.abort();
        }

        // Clear existing stream
        if (videoRef.current.srcObject) {
          const oldStream = videoRef.current.srcObject;
          oldStream.getTracks().forEach((track) => track.stop());
          videoRef.current.srcObject = null;
        }

        // Wait for any pending operations to clear
        await new Promise((r) => setTimeout(r, 50));

        videoRef.current.srcObject = stream;

        // Create new AbortController for this play request
        const abortController = new AbortController();
        playRequestRef.current = abortController;

        const startPlayback = async (attempts = 0) => {
          try {
            // Pass the signal to play()
            await videoRef.current.play();
            // Clear the reference if successful
            playRequestRef.current = null;
          } catch (error) {
            // Ignore aborted requests
            if (error.name === 'AbortError') {
              return;
            }

            if (error.name === 'NotAllowedError' && attempts < 3) {
              await new Promise((r) =>
                setTimeout(r, Math.pow(2, attempts) * 100),
              );
              return startPlayback(attempts + 1);
            }
            onError?.(error);
          }
        };

        await startPlayback();
      } catch (error) {
        if (error.name !== 'AbortError') {
          onError?.(error);
        }
      }
    };

    attachStream();

    // Cleanup function
    return () => {
      if (playRequestRef.current) {
        playRequestRef.current.abort();
        playRequestRef.current = null;
      }
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject = null;
      }
    };
  }, [stream, videoRef, onError]);
};

export default useStreamAttachment;
