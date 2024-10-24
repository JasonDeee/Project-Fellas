import React, { useEffect, useState } from "react";
import "../Styles/style.css";
import awaiterResponses from "../Templates/awaiter.json";
// import confirmerResponses from "../Templates/confirmer.json";

function Javier() {
  const [transcript, setTranscript] = useState("");
  let isFocusing = false;
  let postPrompt = "";
  const audioPlayerRef = React.useRef(null); // Thêm ref cho audio player

  const speakText = async (text) => {
    const apiKey = "AIzaSyDbbfqZ5VC6v4AdmugerAtMfNOg2YdD5Pg";
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

      const { audioContent } = await response.json();
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = `data:audio/mp3;base64,${audioContent}`;
        audioPlayerRef.current.play();
      }
    } catch (error) {
      console.error("Error with text-to-speech:", error);
    }
  };

  const AssistRequest = (transcriptText) => {
    console.log("Javier được gọi với câu lệnh:", transcriptText);
    const randomResponse =
      awaiterResponses[Math.floor(Math.random() * awaiterResponses.length)];
    console.log("Javier responds:", randomResponse);
    speakText(randomResponse); // Phát âm câu trả lời ngẫu nhiên
  };

  useEffect(() => {
    document.title = "Javier | Web";
    console.log("Use effect trigger");

    // Kiểm tra xem trình duyệt có hỗ trợ Speech Recognition không
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US"; // Đổi từ 'vi-VN' sang 'en-US'

      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);

        if (
          isFocusing === true &&
          event.results[current].isFinal &&
          transcriptText != ""
        ) {
          postPrompt = transcriptText;
          console.log("PostPrompt:", postPrompt);

          // const randomConfirm =
          //   confirmerResponses[
          //     Math.floor(Math.random() * confirmerResponses.length)
          //   ];
          // console.log("Javier confirms:", randomConfirm);
          // speakText(randomConfirm); // Phát âm câu xác nhận ngẫu nhiên
          isFocusing = false;
        }
        if (
          isFocusing === true &&
          event.results[current].isFinal &&
          transcriptText == ""
        ) {
          console.log("I Can't Hear You, Boss");
          isFocusing = false;
        }
        if (
          transcriptText.toLowerCase().includes("javier") &&
          event.results[current].isFinal
        ) {
          AssistRequest(transcriptText);
          isFocusing = true;
          console.log(isFocusing);
        }
      };
      // Xử lý khi không có tiếng nói
      recognition.onspeechend = () => {
        console.log("Speech has stopped being detected");
        recognition.abort();
      };
      recognition.onspeechstart = () => {
        console.log("Speech recognition service restarted");
      };
      recognition.onend = () => {
        console.log("Speech recognition service disconnected and restarted");
        recognition.start();
      };
      recognition.start();
      console.log("Speech recognition service started first time");

      // Cleanup function khi component unmount
      return () => {
        recognition.stop();
      };
    } else {
      console.log("Trình duyệt của bạn không hỗ trợ Speech Recognition");
    }
  }, []);

  return (
    <div>
      <h1>Trang Web của Javier</h1>
      <p>{transcript}</p>
      {/* <button onClick={() => speakText("Test audio")}>Test Audio</button> */}
      <audio ref={audioPlayerRef} playsInline />
    </div>
  );
}

export default Javier;
