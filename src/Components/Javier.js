import React, { useState, useEffect, useRef } from "react";
import "../Styles/style.css";
import awaiterResponses from "../Templates/awaiter.json";
import BellIcon from "../Assets/Models=Bell, Size=24, Types=Outline.svg";
import SettingIcon from "../Assets/Models=Setting, Size=24, Types=Outline.svg";
import MessageIcon from "../Assets/Models=text fields, Size=24, Types=Outline.svg";
import ImageIcon from "../Assets/Models=image sending via chat, Size=24, Types=Outline.svg";
import AudioIcon from "../Assets/Models=Medium Volume, Size=24, Types=Outline.svg";
import SendIcon from "../Assets/Models=approve chat, Size=24, Types=Outline.svg";

const apiUrl =
  "https://script.google.com/macros/s/AKfycbyyC3vRj-4R-McevwWlLvq0aLM2jz_1VQ86u0O5l-bh80V021EYxhxgLrGnnCBsGjZ_hg/exec";
const apiKey = "AIzaSyDbbfqZ5VC6v4AdmugerAtMfNOg2YdD5Pg";

function Javier() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [transcript, setTranscript] = useState("");
  const audioPlayerRef = useRef(null);
  let isFocusing = false;
  let postPrompt = "";

  const sendMessageToSheet = async (message, type = "text") => {
    try {
      await fetch(apiUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, type }),
      })
        .then((response) => console.log("Request sent:", response))
        .catch((error) => console.error("Error sending request:", error));

      console.log("Request sent to Google Sheets");

      setMessages((prevMessages) => [
        {
          type: "received",
          content: `${
            type === "voice" ? "Voice command" : "Message"
          } sent (no confirmation available)`,
        },
        ...prevMessages,
      ]);
    } catch (error) {
      console.error("Error sending request:", error);
      setMessages((prevMessages) => [
        { type: "received", content: "Failed to send message" },
        ...prevMessages,
      ]);
    }
  };

  useEffect(() => {
    document.title = "Javier | Web";
    console.log("Use effect trigger");

    const fetchMessages = async () => {
      try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        const fetchedMessages = data
          .map((row) => [
            { type: "sent", content: row[0] },
            { type: "received", content: row[1] },
          ])
          .flat();

        setMessages(fetchedMessages);
      } catch (error) {
        console.error("Error fetching messages:", error);
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
        }
        if (
          isFocusing === true &&
          event.results[current].isFinal &&
          transcriptText === ""
        ) {
          console.log("I Can't Hear You, Boss");
          isFocusing = false;
        }

        if (
          isFocusing === false &&
          transcriptText.toLowerCase().includes("javier") &&
          event.results[current].isFinal
        ) {
          AssistRequest(transcriptText);
          isFocusing = true;
          console.log(isFocusing);
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
        console.log("Speech recognition service disconnected and restarted");
        recognition.start();
      };
      recognition.start();
      console.log("Speech recognition service started first time");

      return () => {
        recognition.stop();
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

    setMessages((prevMessages) => [
      { type: "sent", content: inputMessage },
      ...prevMessages,
    ]);
    setInputMessage("");

    // Use the new sendMessageToSheet function
    await sendMessageToSheet(inputMessage);
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
          <h2>Awaiting Config</h2>
          <p>{transcript}</p>
        </div>

        <div className="right-column">
          <div className="messages-container">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.type}`}>
                <p>{message.content}</p>
              </div>
            ))}
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
                  src={SendIcon}
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
