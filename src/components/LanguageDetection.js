import React, { useEffect, useState, useRef } from "react";
import axios from 'axios';
import { debounce } from 'lodash';


const LanguageDetection = ({stream,onLanguageDetected, socket}) => {
    const [isDetecting, setIsDetecting] = useState(false);
    const [error,setError] = useState(null);
    const mediaRecorderRef = useRef(null);
    const detectionAttemptRef = useRef(false);

    const handleSpeechDetection = async (audioBlob) => {
        setIsDetecting(true);
        const audioContent = await blobToBase64(audioBlob);
        detectLanguage(audioContent);
    };

    const detectLanguage = debounce ((audioContent) => {
        if (detectionAttemptRef.current){
            return;
        }

        socket.emit('detectLanguage', {audioContent});

        socket.on('languageDetected', (detectLanguage) => {
            onLanguageDetected(detectLanguage);
            detectionAttemptRef.current = true;
            setIsDetecting(false);
        });

    },2000);

    const blobToBase64 = (blob) => {
        return new Promise((resolve,reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const base64data = reader.result.split(',')[1];
                resolve(base64data);
            };

            reader.onerror = error => reject(error);
        });
    }


    useEffect(() => {
        if (!stream) return;

        const audioTracks = stream.getAudioTracks();
        const audioStream = new MediaStream(audioTracks);
        const mediaRecorder = new MediaRecorder(audioStream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0){
                handleSpeechDetection(event.data);
            }
        };

        mediaRecorder.start();

        const timeoutId = setTimeout(() => {
            mediaRecorder.stop();
        }, 10000);

        return () => {
            if (mediaRecorder) {
                mediaRecorder.stop();
            }
            if (timeoutId) {
                clearTimeout(timeoutId); // Clear the timeout if the effect is cleaned up
            }     
        }
    },[stream]);


    return (
        <div>
            {isDetecting && <p>Detecting language...</p>}
            {error && <p>Error: {error}</p>}
        </div>
    )
}

export default LanguageDetection;