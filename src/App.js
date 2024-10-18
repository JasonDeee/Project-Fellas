import React, { useState, useEffect, useRef } from "react";
import logo from "./logo.svg";
import "./Styles/style.css";
import { TextToSpeechClient } from "@google-cloud/text-to-speech/build/src/v1";
// import { fs } from "fs";
// import { util } from "util";

function App() {
  // Imports the Google Cloud client library

  const [promptText, setPromptText] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [selectedEngine, setSelectedEngine] = useState("web"); // Mặc định là Web Speech
  const audioPlayerRef = useRef(null); // Tham chiếu đến thẻ <audio>

  const apiKey = "AIzaSyDbbfqZ5VC6v4AdmugerAtMfNOg2YdD5Pg"; // Thay thế bằng API key của bạn
  // Khởi tạo TextToSpeechClient
  const textToSpeechClient = new TextToSpeechClient({
    apiKey: apiKey,
  });
  // Hàm xử lý thay đổi input prompt
  const handlePromptChange = (event) => {
    setPromptText(event.target.value);
  };

  // Hàm xử lý thay đổi dropdown
  const handleEngineChange = (event) => {
    setSelectedEngine(event.target.value);
  };

  // Hàm xử lý request đến API Gemini
  const handleExecute = async () => {
    const data = {
      contents: [
        {
          parts: [
            {
              text: promptText,
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
    }
  };

  // Hàm xử lý kết quả từ API Gemini
  const handleGeminiResponse = (data) => {
    console.log(data);
    const newGeneratedText =
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content.parts[0].text;
    setGeneratedText(newGeneratedText || "Không có kết quả.");

    if (newGeneratedText) {
      speakText(newGeneratedText);
    }
  };

  // Hàm chuyển text sang giọng nói (đã cập nhật)
  const speakText = async (text) => {
    if (selectedEngine === "web") {
      console.log("Web Speech Exec");
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text);
      synth.speak(utterance);
      // ... (Sử dụng Web Speech API - giữ nguyên)
    } else if (selectedEngine === "google") {
      try {
        const request = {
          input: { text: text },
          voice: { languageCode: "vi-VN", name: "vi-VN-Wavenet-A" },
          audioConfig: { audioEncoding: "MP3" },
        };

        const [response] = await textToSpeechClient.synthesizeSpeech(request);
        const audioContent = response.audioContent;

        // Phát audio bằng thẻ <audio>
        const audioBlob = new Blob([audioContent], { type: "audio/mp3" });
        const audioUrl = URL.createObjectURL(audioBlob);
        audioPlayerRef.current.src = audioUrl;
        audioPlayerRef.current.style.display = "block";
        audioPlayerRef.current.play();
      } catch (error) {
        console.error("Lỗi khi gọi Google Cloud Text-to-Speech:", error);
        setGeneratedText("Lỗi khi phát âm thanh.");
      }
    }
  };

  // Sử dụng useEffect để xử lý sự kiện keyup (Enter) cho input
  useEffect(() => {
    const handleKeyUp = (event) => {
      if (event.key === "Enter") {
        handleExecute();
      }
    };

    inputElement.current.addEventListener("keyup", handleKeyUp);

    // Cleanup: Xóa event listener khi component unmount
    return () => {
      inputElement.current.removeEventListener("keyup", handleKeyUp);
    };
  }, []); // Chỉ chạy useEffect một lần khi component mount

  const inputElement = useRef(null); // Tham chiếu đến input field

  return (
    <div className="App">
      <input
        type="text"
        id="Gemini-Input"
        placeholder="Nhập prompt..."
        value={promptText} // Sử dụng state
        onChange={handlePromptChange} // Gán event handler
        ref={inputElement} // Gán ref cho input
      />
      <button id="Gemini-RequestButton" onClick={handleExecute}>
        Execute Fixed
      </button>
      <select
        id="Voice-EngineSelect"
        value={selectedEngine} // Sử dụng state
        onChange={handleEngineChange} // Gán event handler
      >
        <option value="web">Web Speech</option>
        <option value="google">Google Cloud Speech</option>
      </select>
      <p>
        Output: <span id="Gemini-ResponseContent">{generatedText}</span>
      </p>
      <audio
        id="audioPlayer"
        controls
        style={{ display: "none" }}
        ref={audioPlayerRef} // Gán ref cho audio player
      ></audio>
    </div>
  );
}

export default App;
