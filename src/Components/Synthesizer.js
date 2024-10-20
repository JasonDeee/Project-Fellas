import React, { useState, useEffect, useRef, useCallback } from "react";
import "../Styles/style.css";

const Synthesizer = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptBuffer, setTranscriptBuffer] = useState("");
  const [responseCounter, setResponseCounter] = useState(0);
  const [speechCounter, setSpeechCounter] = useState(0);

  const recognition = useRef(null);

  const handleRecognitionResult = useCallback((event) => {
    const transcript = event.results[0][0].transcript;
    setTranscriptBuffer(transcript);
    setResponseCounter((prev) => prev + 1);

    if (event.results[0].isFinal) {
      setSpeechCounter((prev) => prev + 1);
    }
  }, []);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognition.current = new SpeechRecognition();
      recognition.current.interimResults = true;
      recognition.current.addEventListener("result", handleRecognitionResult);
    }

    return () => {
      if (recognition.current) {
        recognition.current.removeEventListener(
          "result",
          handleRecognitionResult
        );
        recognition.current.abort();
        recognition.current = null;
      }
    };
  }, [handleRecognitionResult]);

  const startRecording = () => {
    if (!isRecording && recognition.current) {
      setTranscriptBuffer("");
      recognition.current.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (isRecording && recognition.current) {
      recognition.current.stop();
      setIsRecording(false);
      setTranscriptBuffer("Contents Stopped");
    }
  };

  return (
    <div className="Synthesizer-container">
      <p>Counter: {responseCounter}</p>
      <p>Speech: {speechCounter}</p>

      <button onClick={startRecording}>Start Recording</button>
      <button onClick={stopRecording}>Stop Recording</button>
      <h1>{isRecording ? "Live Communicating" : "Communication's Status"}</h1>
      <p>
        {transcriptBuffer ||
          "Extract Contents Continuous Speech Counter Hey Hey!"}
      </p>
    </div>
  );
};

export default Synthesizer;
