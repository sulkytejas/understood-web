import React, { useEffect, useState, useRef } from "react";
import axios from 'axios';



const LanguageDetection = ({stream,onLanguageDetected}) => {
    const [isDetecting, setIsDetecting] = useState(false);
    const [error,setError] = useState(null);
    const mediaRecorderRef = useRef(null);

    const handleSpeechDetection = async (audioBlob) => {
        setIsDetecting(true);

        try {
            const audioContent = await blobToBase64(audioBlob);
            // const response = await axios.post('http://localhost:5001/detectLanguage',{audioContent});
            const response = await axios.post('https://socket.platocity.com/detectLanguage',{audioContent});
            const detectedLanguage = response.data.language;
            onLanguageDetected(detectedLanguage);
        }catch(e){
            setError(e.message);
        }finally{
            setIsDetecting(false);
        }
    };

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

        setTimeout(() => {
            mediaRecorder.stop();
        }, 5000)
    },[stream]);


    return (
        <div>
            {isDetecting && <p>Detecting language...</p>}
            {error && <p>Error: {error}</p>}
        </div>
    )
}

export default LanguageDetection;