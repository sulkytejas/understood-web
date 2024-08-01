import { useEffect, useRef, useState } from "react";
import { translateText } from "../services/translateService";



const Translation = ({role, detectedLanguage, socket}) => {
    const [userSpeechToText,setUserSpeechToText] = useState('');
    const [recognizing, setRecognizing] = useState(false);
   

    const recognitionRef = useRef(null);
    const isRecongnitionActive = useRef(false);

    // Handle transcript results
    const handleResult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        const fullTranscript = finalTranscript || interimTranscript;
        setUserSpeechToText(fullTranscript);
        console.log("transcripts", fullTranscript);

        // Emit recognized text to the server
        socket.emit('userSpeechToText', fullTranscript);
    }

    // Initial speech instance
    const initializeRecognition = () => {
        const recognition =  new ( window.webkitSpeechRecognition ||  window.SpeechRecognition )();
        recognition.lang = detectedLanguage;
        recognition.interimResults = true;
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

    },[role, detectedLanguage])

    // useEffect(() => {
    //     if (userSpeechToText){
    //         socket.emit('userSpeechToText',userSpeechToText);
    //     }
    // },[userSpeechToText,socket]);

    return (
        <div className="subtitles">
          {recognizing && <p>Listening as ${role}...</p>}
        </div>
    );
}

export default Translation;