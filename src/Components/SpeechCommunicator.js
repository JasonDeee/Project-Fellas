import React, { useState, useEffect, useRef, useCallback } from "react";
import "../Styles/style.css";

const SpeechCommunicator = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptBuffer, setTranscriptBuffer] = useState("");
  const [responseCounter, setResponseCounter] = useState(0);
  const [speechCounter, setSpeechCounter] = useState(0);
  const [generatedText, setGeneratedText] = useState("");
  const [, forceUpdate] = useState();
  const [transcriptHistory, setTranscriptHistory] = useState("");

  const recognition = useRef(null);
  const audioPlayerRef = useRef(null);
  const selectedEngineRef = useRef("web");
  const lastProcessedTranscriptRef = useRef("");
  const pendingRequestRef = useRef(null);

  const apiKey = "AIzaSyDbbfqZ5VC6v4AdmugerAtMfNOg2YdD5Pg"; // Thay thế bằng API key của bạn

  const handleRecognitionResult = useCallback((event) => {
    const results = event.results;
    let finalTranscript = "";

    for (let i = 0; i < results.length; i++) {
      if (results[i].isFinal) {
        finalTranscript += results[i][0].transcript;
      }
    }

    if (finalTranscript) {
      setTranscriptBuffer(finalTranscript);
      setResponseCounter((prev) => prev + 1);
      setSpeechCounter((prev) => prev + 1);

      // Chỉ xử lý nếu transcript mới khác với transcript cuối cùng đã xử lý
      if (finalTranscript !== lastProcessedTranscriptRef.current) {
        lastProcessedTranscriptRef.current = finalTranscript;
        console.log("Final Transcript:", finalTranscript);

        // Cập nhật lịch sử transcript và gọi Gemini API trong callback
        setTranscriptHistory((prev) => {
          const newHistory = prev
            ? `${prev}\n${finalTranscript}`
            : finalTranscript;
          console.log("Updated Transcript History:", newHistory);
          // Sử dụng setTimeout để đảm bảo chỉ gọi API một lần sau khi state đã được cập nhật
          setTimeout(() => handleGeminiRequest(newHistory), 0);
          return newHistory;
        });
      }
    }
  }, []);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognition.current = new SpeechRecognition();
      recognition.current.interimResults = true;
      recognition.current.continuous = true;
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
      // Không reset transcriptHistory ở đây nữa
      lastProcessedTranscriptRef.current = "";
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

  // Thêm hàm mới để reset transcripts
  const resetTranscripts = () => {
    setTranscriptHistory("");
    setTranscriptBuffer("");
    lastProcessedTranscriptRef.current = "";
    setGeneratedText("");
    console.log("Transcripts reset executed!");
  };

  const handleGeminiRequest = useCallback(
    async (text) => {
      // Hủy yêu cầu trước đó nếu có
      if (pendingRequestRef.current) {
        clearTimeout(pendingRequestRef.current);
      }

      // Đặt một yêu cầu mới
      pendingRequestRef.current = setTimeout(async () => {
        const data = {
          contents: [
            {
              parts: [
                {
                  text: text,
                },
              ],
            },
          ],
        };

        try {
          const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" +
              apiKey,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(data),
            }
          );

          const responseData = await response.json();
          handleGeminiResponse(responseData);
        } catch (error) {
          console.error("Lỗi khi gọi API:", error);
          setGeneratedText("Lỗi khi xử lý yêu cầu.");
        } finally {
          pendingRequestRef.current = null;
        }
      }, 100); // Đợi 100ms trước khi gửi yêu cầu
    },
    [apiKey]
  );

  const handleGeminiResponse = useCallback((data) => {
    console.log(data);
    const newGeneratedText =
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content.parts[0].text;

    if (newGeneratedText) {
      // Loại bỏ tất cả các ký tự * từ văn bản
      const cleanedText = newGeneratedText.replace(/\*/g, "");

      // Sử dụng cleanedText cho cả phần hiển thị và text-to-speech
      setGeneratedText(cleanedText);
      speakText(cleanedText);
    } else {
      setGeneratedText("Không có kết quả.");
    }
  }, []);

  const speakText = useCallback(
    async (text) => {
      console.log("Selected Engine:", selectedEngineRef.current);
      if (selectedEngineRef.current === "web") {
        console.log("Web Speech Exec: " + text);
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);
        synth.speak(utterance);
      } else if (selectedEngineRef.current === "google") {
        console.log("Google Cloud Speech Exec");
        try {
          const response = await fetch(
            `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                input: { text: text },
                voice: { languageCode: "en-US", name: "en-US-Journey-F" },
                audioConfig: { audioEncoding: "MP3" },
              }),
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          const audioContent = result.audioContent;

          const audioBlob = new Blob(
            [Uint8Array.from(atob(audioContent), (c) => c.charCodeAt(0))],
            { type: "audio/mp3" }
          );
          const audioUrl = URL.createObjectURL(audioBlob);
          audioPlayerRef.current.src = audioUrl;
          audioPlayerRef.current.style.display = "block";
          audioPlayerRef.current.play();
          console.log("Audio played: " + text);
        } catch (error) {
          console.error("Lỗi khi gọi Google Cloud Text-to-Speech:", error);
          setGeneratedText("Lỗi khi phát âm thanh.");
        }
      }
    },
    [apiKey]
  );

  const handleEngineChange = (e) => {
    selectedEngineRef.current = e.target.value;
    console.log("Engine changed to:", selectedEngineRef.current);
    forceUpdate({}); // This will trigger a re-render
  };

  return (
    <div className="SpeechCommunicator-container">
      <header className="header">
        <h1>Communicator P1</h1>
        <p>Communication's Status</p>
      </header>
      <div className="content-wrapper">
        <main className="main-content">
          <div className="top-bar">
            <select
              value={selectedEngineRef.current}
              onChange={handleEngineChange}
            >
              <option value="web">Web Speech API</option>
              <option value="google">Google Cloud Speech</option>
            </select>
            <div className="counters">
              <span className="counter">Counter: {responseCounter}</span>
              <span className="counter">Speech: {speechCounter}</span>
            </div>
          </div>
          <div className="recognized-text">
            <strong>Recognized:</strong> {transcriptBuffer}
          </div>
          <div className="generated-text">
            <strong>Generated:</strong> {generatedText}
          </div>
        </main>
        <div className="controls">
          <button className="start-recording" onClick={startRecording}>
            Start Recording
          </button>
          <button className="stop-recording" onClick={stopRecording}>
            Stop Recording
          </button>
          <button className="reset" onClick={resetTranscripts}>
            Reset
          </button>
          <audio ref={audioPlayerRef} controls />
        </div>
      </div>
    </div>
  );
};

export default SpeechCommunicator;
