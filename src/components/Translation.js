import { useEffect, useRef, useState } from "react";
import { translateText } from "../services/translateService";



const Translation = ({role, targetLanguage, socket}) => {
    const [translation,setTranslation] = useState('');
    const [recognizing, setRecognizing] = useState(false);
   

    const recognitionRef = useRef(null);
    const isRecongnitionActive = useRef(false);

    // Handle transcript results
    const handleResult = async (event) => {
        console.log(event);
        const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');


        try {
            const translation = await translateText(transcript,targetLanguage);
            console.log(`[${role}] Translated text:`, translation);
            setTranslation(translation);
        }catch (e){
            console.error(`[${role}] Translation error:`, e);
        }
    }

    // Initial speech instance
    const initializeRecognition = () => {
        const recognition =  new ( window.webkitSpeechRecognition ||  window.SpeechRecognition )();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.continous = true;

       

        recognition.onstart = () => {
            setRecognizing(true);
            isRecongnitionActive.current = true;
           
            console.log(`[${role}] Speech recognition started.`);
        };

        recognition.onend = () => {
            if (isRecongnitionActive.current) {
                recognition.start();
            } else {
                setRecognizing(false);
            }
           
        };

        recognition.onresult = handleResult;

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event);

             // Handle 'not-allowed' error specifically
            if (event.error === 'not-allowed') {
                alert('Microphone access is not allowed. Please enable the microphone permissions.');
                recognition.stop();
            }
            // Restart recognition on other errors
            if (event.error === 'aborted' || event.error === 'network') {
                recognition.stop();
                if (isRecongnitionActive.current) {
                    recognition.start();
                }
            }
        };

        recognitionRef.current = recognition;
    }

    useEffect(() => { 
        initializeRecognition();
        // Request microphone permissions
        navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
            console.log(isRecongnitionActive.current)
            if ( !isRecongnitionActive.current){
                recognitionRef.current.start();
                isRecongnitionActive.current = true;
            }
        })
        .catch((err) => {
            console.error(`[${role}] Microphone access denied`, err);
            alert('Microphone access is required for speech recognition. Please enable the microphone permissions.');
        });

        return () => {
           if (recognitionRef.current){
            recognitionRef.current.stop();
            isRecongnitionActive.current = false;
           }
            
          };

    },[role, targetLanguage])

    useEffect(() => {
        if (translation){
            socket.emit('translations',translation);
        }
    },[translation,socket]);

    return (
        <div className="subtitles">
          {recognizing && <p>Listening as ${role}...</p>}
        </div>
    );
}

export default Translation;