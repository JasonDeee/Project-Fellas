import React, { useState, useEffect } from "react";
import BellIcon from "../Assets/Models=Bell, Size=24, Types=Outline.svg";
import SettingIcon from "../Assets/Models=Setting, Size=24, Types=Outline.svg";
import MessageIcon from "../Assets/Models=text fields, Size=24, Types=Outline.svg";
import ImageIcon from "../Assets/Models=image sending via chat, Size=24, Types=Outline.svg";
import AudioIcon from "../Assets/Models=Medium Volume, Size=24, Types=Outline.svg";
import SendIcon from "../Assets/Models=approve chat, Size=24, Types=Outline.svg";

const apiUrl =
  "https://script.google.com/macros/s/AKfycbyyC3vRj-4R-McevwWlLvq0aLM2jz_1VQ86u0O5l-bh80V021EYxhxgLrGnnCBsGjZ_hg/exec";

const Temp = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
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
  }, []);

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

    // Add sent message to UI at the beginning of the array
    setMessages((prevMessages) => [
      { type: "sent", content: inputMessage },
      ...prevMessages,
    ]);

    // Clear input field
    setInputMessage("");

    // Send message to Google Sheets
    try {
      await fetch(apiUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: inputMessage }),
      });

      console.log("Request sent to Google Sheets");

      // Add received message to UI at the beginning of the array
      setMessages((prevMessages) => [
        {
          type: "received",
          content: "Message sent (no confirmation available)",
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

  return (
    <div className="app-container">
      {/* Header */}
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

      {/* Two Column Layout */}
      <div className="two-column-layout">
        {/* Left Column */}
        <div className="left-column">
          <h2>Awating Config</h2>
        </div>

        {/* Right Column */}
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
    </div>
  );
};

export default Temp;
