import React, { useState, useEffect, useRef } from "react";
import "../Styles/style.css";
import awaiterResponses from "../Templates/awaiter.json";
import BellIcon from "../Assets/Models=Bell, Size=24, Types=Outline.svg";
import SettingIcon from "../Assets/Models=Setting, Size=24, Types=Outline.svg";
import MessageIcon from "../Assets/Models=text fields, Size=24, Types=Outline.svg";
import ImageIcon from "../Assets/Models=image sending via chat, Size=24, Types=Outline.svg";
import AudioIcon from "../Assets/Models=Medium Volume, Size=24, Types=Outline.svg";
import PointerIcon from "../Assets/Models=pointer, Size=24, Types=Outline.svg";
import RecordIcon from "../Assets/Models=record-audio, Size=24, Types=Outline.svg";
import StopIcon from "../Assets/Models=Stop, Size=24, Types=Outline.svg";

const apiUrl =
  "https://script.google.com/macros/s/AKfycbyyC3vRj-4R-McevwWlLvq0aLM2jz_1VQ86u0O5l-bh80V021EYxhxgLrGnnCBsGjZ_hg/exec";
const apiKey = "AIzaSyDbbfqZ5VC6v4AdmugerAtMfNOg2YdD5Pg";
let isForceListeningOff = true;

const formatMessage = (content) => {
  return content
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Bold text
    .replace(/\*(.*?)\*/g, "<i>$1</i>") // Italic text
    .replace(/^(\s*)\*\s/gm, "$1• ") // Bullet points
    .replace(/\n/g, "<br>"); // Line breaks
};

function Javier() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [transcript, setTranscript] = useState("");
  const audioPlayerRef = useRef(null);
  let isFocusing = false;
  let postPrompt = "";
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCallingJavier, setIsCallingJavier] = useState(false);

  const sendMessageToSheet = async (message, type = "text") => {
    const tempId = Date.now().toString();

    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: tempId,
        type: "received",
        content: (
          <lord-icon
            src="https://cdn.lordicon.com/lqxfrxad.json"
            colors="primary:#ffffff"
            trigger="loop"
            state="loop-scale"
            style={{ width: "64px", height: "32px" }}
          ></lord-icon>
        ),
        className: "ResponseAwaiting",
      },
    ]);

    try {
      // Gửi tin nhắn đến Gemini API
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pr-latest:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: message,
                  },
                ],
              },
            ],
          }),
        }
      );

      const geminiData = await geminiResponse.json();
      console.log("Gemini API response:", geminiData);

      const resolvedText = geminiData.candidates[0].content.parts[0].text;

      // Chuẩn bị dữ liệu để gửi đến Google Sheets
      const sheetData = {
        Request: message,
        ResolveA: resolvedText,
      };

      // Gửi dữ liệu đến Google Sheets
      const sheetResponse = await fetch(apiUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sheetData),
      });

      console.log("Google Sheets response:", await sheetResponse.text());

      // Cập nhật tin nhắn "đang chờ" với nội dung thực tế và xóa class tạm thời
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === tempId
            ? { ...msg, content: resolvedText, className: "" }
            : msg
        )
      );
    } catch (error) {
      console.error("Error in sendMessageToSheet:", error);
      // Cập nhật tin nhắn "đang chờ" với thông báo lỗi
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === tempId
            ? {
                ...msg,
                content: "Failed to process and send message",
                className: "",
              }
            : msg
        )
      );
    }
  };

  useEffect(() => {
    document.title = "Javier | Web";
    console.log("Use effect trigger");

    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(apiUrl);
        const data = await response.json();

        const fetchedMessages = data.reduce((acc, row, index) => {
          if (index === 0) {
            // Đối với hàng đầu tiên, thêm cả Request và ResolveA nếu chúng tồn tại
            if (row[0]) {
              acc.push({ type: "received", content: row[1] });
            }
            if (row[1]) {
              acc.push({ type: "sent", content: row[0] });
            }
          } else {
            acc.push({ type: "received", content: row[1] });
            // Đối với các hàng tiếp theo, thêm cả Request và ResolveA
            if (row[1]) {
              acc.push({ type: "sent", content: row[0] });
            }
          }
          return acc;
        }, []);

        setMessages(fetchedMessages.reverse());
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();

    // Speech Recognition setup
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);

        if (
          isFocusing === true &&
          event.results[current].isFinal &&
          transcriptText !== ""
        ) {
          postPrompt = transcriptText;
          console.log("PostPrompt:", postPrompt);
          isFocusing = false;
          // Send voice command to Google Sheets
          sendMessageToSheet(transcriptText, "voice");

          // Add voice command to messages
          setMessages((prevMessages) => [
            { type: "sent", content: `Voice: ${transcriptText}` },
            ...prevMessages,
          ]);

          // Remove the "OnCalling" class
          setIsCallingJavier(false);
        }
        if (
          isFocusing === true &&
          event.results[current].isFinal &&
          transcriptText === ""
        ) {
          console.log("I Can't Hear You, Boss");
          isFocusing = false;

          // Remove the "OnCalling" class
          setIsCallingJavier(false);
        }

        if (
          isFocusing === false &&
          transcriptText.toLowerCase().includes("javier") &&
          event.results[current].isFinal
        ) {
          AssistRequest(transcriptText);
          isFocusing = true;
          setIsCallingJavier(true); // Set the calling state to true
          console.log(isFocusing);

          // Set a timeout to reset the calling state after 5 seconds
          setTimeout(() => {
            setIsCallingJavier(false);
          }, 5000);
        }
      };

      recognition.onspeechend = () => {
        console.log("Speech has stopped being detected");
        recognition.abort();
      };
      recognition.onspeechstart = () => {
        console.log("Speech recognition service restarted");
      };
      recognition.onend = () => {
        if (isForceListeningOff == false) {
          recognition.start();
          console.log("Speech recognition service disconnected and restarted");
          console.log(isForceListeningOff);
        }
      };
      // recognition.start();
      console.log("Speech recognition service started first time");

      recognitionRef.current = recognition;

      return () => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      };
    } else {
      console.log("Trình duyệt của bạn không hỗ trợ Speech Recognition");
    }
  }, []);

  const speakText = async (text) => {
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
    speakText(randomResponse);
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && isInputFocused) {
      handleSendMessage();
    }
  };

  const handleInputFocus = () => {
    setIsInputFocused(true);
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() === "") return;

    // Add new message to the end of the array
    setMessages((prevMessages) => [
      ...prevMessages,
      { type: "sent", content: inputMessage },
    ]);
    setInputMessage("");

    // Use the sendMessageToSheet function
    await sendMessageToSheet(inputMessage);
  };

  const toggleListening = () => {
    if (isListening) {
      isForceListeningOff = true;

      setIsListening(false);
      recognitionRef.current.stop();
      console.log(isForceListeningOff);
    } else {
      if (isForceListeningOff == true) {
        isForceListeningOff = false;
      }
      recognitionRef.current.start();
      setIsListening(true);
      console.log(isForceListeningOff);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-left">
          <h1>Javier | Web</h1>
          <div className="status-dot"></div>
        </div>
        <div className="header-right">
          <button className="icon-button notification">
            <img
              className="notification-icon"
              src={BellIcon}
              alt="notification"
            />
          </button>
          <button className="icon-button settings">
            <img className="settings-icon" src={SettingIcon} alt="settings" />
          </button>
        </div>
      </header>

      <div className="two-column-layout">
        <div className="left-column">
          <h2 id="leftColumnTitle">Awaiting Config</h2>
          <div className="transcripts">
            <p>Transcripts:</p>
            <p>{transcript}</p>
          </div>
          <button
            id="record-button"
            onClick={toggleListening}
            className={`Synth ${isListening ? "Active" : ""} ${
              isCallingJavier ? "OnCalling" : ""
            }`}
          >
            <img src={isListening ? StopIcon : RecordIcon} alt="R" title="R" />
            {isListening ? "Stop Synth" : "Start Synth"}
          </button>
        </div>

        <div className="right-column">
          <div
            className={`messages-container ${
              isLoading ? "ContentAwaiting" : ""
            }`}
          >
            {isLoading ? (
              <lord-icon
                src="https://cdn.lordicon.com/gkryirhd.json"
                trigger="loop"
                state="loop-snake-alt"
                colors="primary:#ffffff"
                style={{ width: "78px", height: "78px" }}
              ></lord-icon>
            ) : (
              // Reverse the order of messages when rendering
              [...messages].reverse().map((message, index) => (
                <div
                  key={message.id || index}
                  className={`message ${message.type} ${
                    message.className || ""
                  }`}
                >
                  {typeof message.content === "string" ? (
                    <p
                      dangerouslySetInnerHTML={{
                        __html: formatMessage(message.content),
                      }}
                    />
                  ) : (
                    message.content
                  )}
                </div>
              ))
            )}
          </div>

          <div className="input-area" id="inputArea">
            <div className="input-container" id="inputContainer">
              <div className="text-input" id="textInput">
                <img
                  className="message-icon"
                  src={MessageIcon}
                  alt="message"
                  id="messageIcon"
                />
                <input
                  type="text"
                  placeholder="Enter Here..."
                  id="messageInputField"
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </div>
              <button className="media-button" id="imageButton">
                <img
                  className="image-icon"
                  src={ImageIcon}
                  alt="image"
                  id="imageIcon"
                />
              </button>
              <button className="media-button" id="audioButton">
                <img
                  className="audio-icon"
                  src={AudioIcon}
                  alt="audio"
                  id="audioIcon"
                />
              </button>
              <button
                className="send-button"
                id="sendButton"
                onClick={handleSendMessage}
              >
                <img
                  className="send-icon"
                  src={PointerIcon}
                  alt="send"
                  id="sendIcon"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
      <audio ref={audioPlayerRef} playsInline />
    </div>
  );
}

export default Javier;
