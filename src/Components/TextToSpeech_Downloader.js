import React, { useState, useRef } from "react";
import "../Styles/style.css";

const apiKey = "AIzaSyDbbfqZ5VC6v4AdmugerAtMfNOg2YdD5Pg"; // Thay thế bằng API key của bạn

function TextToSpeech_Downloader() {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const audioPlayerRef = useRef(null);

  const handleTextChange = (event) => {
    setInputText(event.target.value);
  };

  const handleSpeechGeneration = async () => {
    if (!inputText.trim()) {
      alert("Vui lòng nhập văn bản");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            audioConfig: {
              audioEncoding: "LINEAR16",
              effectsProfileId: ["small-bluetooth-speaker-class-device"],
              pitch: -3.2,
              speakingRate: 1,
            },
            input: {
              text: inputText,
            },
            voice: {
              languageCode: "vi-VN",
              name: "vi-VN-Wavenet-B",
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const audioContent = result.audioContent;

      // Tạo và phát audio
      const audioBlob = new Blob(
        [Uint8Array.from(atob(audioContent), (c) => c.charCodeAt(0))],
        { type: "audio/wav" }
      );
      const audioUrl = URL.createObjectURL(audioBlob);

      // Hiển thị audio player
      audioPlayerRef.current.src = audioUrl;
      audioPlayerRef.current.style.display = "block";

      // Tạo link download
      const downloadLink = document.createElement("a");
      downloadLink.href = audioUrl;
      downloadLink.download = "speech.wav";
      downloadLink.click();
    } catch (error) {
      console.error("Lỗi khi tạo giọng nói:", error);
      alert("Có lỗi xảy ra khi tạo giọng nói");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="TextToSpeech_Downloader">
      <textarea
        placeholder="Nhập văn bản cần chuyển thành giọng nói..."
        value={inputText}
        onChange={handleTextChange}
        rows={5}
      />
      <button
        onClick={handleSpeechGeneration}
        disabled={isLoading}
        style={{ margin: "10px" }}
      >
        {isLoading ? "Đang xử lý..." : "Tạo giọng nói"}
      </button>
      <audio ref={audioPlayerRef} controls style={{ margin: "20px" }} />
    </div>
  );
}

export default TextToSpeech_Downloader;
