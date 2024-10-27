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
import RequestHeader from "../Templates/RequestHeader.json";
import schema from "../Templates/schema.json";
import RequestFooter from "../Templates/RequestFooter.json";

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

const MAX_CHAT_HISTORY = 7;

const buildRequestPrompt = (
  messages,
  currentMessage,
  historyLength,
  resolveStep
) => {
  console.log("Messages before building chat history:", messages);
  const chatHistory = messages.reduce((history, message, index, array) => {
    if (index % 2 === 0 && index + 1 < array.length) {
      const userMessage = message;
      const javierMessage = array[index + 1];
      return (
        history +
        `-----\n` +
        `User: ${userMessage.content}\n` +
        `Javier: ${javierMessage.content}\n` +
        `TimeStamp: ${javierMessage.timestamp || "Unknown time"}\n` +
        `-----\n`
      );
    }
    return history;
  }, "");

  const footerExplanation = RequestFooter.map(
    (item) => `${item.name}: ${item.role}`
  ).join("\n");

  return `${RequestHeader}

### Chat history

${chatHistory}

CurrentRequest: ${currentMessage}
ResolveStep: ${resolveStep}

IMPORTANT: Your response must be a valid JSON object wrapped in triple backticks and 'json' keyword, like this:
\`\`\`json
${JSON.stringify(schema, null, 2)}
\`\`\`
Do not include any text outside of this JSON object.

### Explanation
${footerExplanation}`;
};

function Javier() {
  const [messages, setMessages] = useState([]);
  let MessageByPass = useRef([]);
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

  const updateMessages = (newMessage) => {
    const messageWithId = {
      ...newMessage,
      id:
        newMessage.id ||
        `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setMessages((prevMessages) => [...prevMessages, messageWithId]);
    MessageByPass.current = [...MessageByPass.current, messageWithId];
  };

  const sendMessageToSheet = async (
    message,
    type = "text",
    initialResolveStep = 0
  ) => {
    const tempId = Date.now().toString();
    console.log("Current MessageByPass state:", MessageByPass.current);

    const newMessage = {
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
    };

    updateMessages(newMessage);

    // Đợi một chút để đảm bảo state đã được cập nhật
    await new Promise((resolve) => setTimeout(resolve, 0));

    let tempSheetData = {
      Request: message,
      ResolveA: "",
      ResolveB: "",
      ResolveC: "",
      Concluded: "",
      isFinal: false,
      ResolveStep: initialResolveStep,
    };

    try {
      const RequestPrompt = buildRequestPrompt(
        MessageByPass.current,
        message,
        MAX_CHAT_HISTORY + initialResolveStep * 14,
        initialResolveStep
      );

      // Log RequestPrompt
      console.log("Full RequestPrompt:", RequestPrompt);

      // Gửi tin nhắn đến Gemini API
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: RequestPrompt }],
              },
            ],
          }),
        }
      );

      const geminiData = await geminiResponse.json();
      console.log("Gemini API response:", geminiData);

      // Xử lý phản hồi từ Gemini API
      const responseText = geminiData.candidates[0].content.parts[0].text;
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
      let resolvedText;

      if (jsonMatch && jsonMatch[1]) {
        try {
          resolvedText = JSON.parse(jsonMatch[1]);
        } catch (parseError) {
          console.error("Error parsing JSON from Gemini response:", parseError);
          console.log("Raw response:", responseText);
          throw new Error("Invalid JSON in Gemini response");
        }
      } else {
        console.error("No valid JSON found in Gemini response");
        console.log("Raw response:", responseText);
        throw new Error("No JSON found in Gemini response");
      }

      // Tiếp tục với phần code xử lý resolvedText
      if (resolvedText.isFinal) {
        // Xử lý khi isFinal = true
        console.log("Processing final response");
        await speakText(resolvedText.speech);
        // Chỉ cập nhật tin nhắn ở đây
        updateMessages({
          type: "received",
          content: resolvedText.contents,
          className: "",
        });

        // Cập nhật tempSheetData
        tempSheetData.isFinal = true;
        tempSheetData.ResolveA = resolvedText.contents;
        tempSheetData.Concluded = resolvedText.Concluded;

        tempSheetData.ResolveStep = resolvedText.ResolveStep;

        // Gửi dữ liệu đến Google Sheets
        const sheetResponse = await fetch(apiUrl, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(tempSheetData),
        });

        console.log("Google Sheets response:", await sheetResponse.text());
      } else {
        // Xử lý khi isFinal = false
        console.log("Processing intermediate response");
        await speakText(resolvedText.speech);
        // Chỉ cập nhật tin nhắn ở đây
        updateMessages({
          type: "received",
          content: resolvedText.speech,
          className: "",
        });

        // Cập nhật tempSheetData
        if (resolvedText.ResolveStep === 1)
          tempSheetData.ResolveA = resolvedText.speech;
        else if (resolvedText.ResolveStep === 2)
          tempSheetData.ResolveB = resolvedText.speech;
        else if (resolvedText.ResolveStep === 3)
          tempSheetData.ResolveC = resolvedText.speech;

        tempSheetData.ResolveStep = resolvedText.ResolveStep;

        // Tiếp tục gọi Gemini API nếu ResolveStep < 3
        if (resolvedText.ResolveStep < 3) {
          await sendMessageToSheet(message, type, resolvedText.ResolveStep);
        } else {
          // Khi ResolveStep = 3 nhưng vẫn chưa Final
          tempSheetData.ResolveC = "I cannot complete this task";
          updateMessages({
            type: "received",
            content: "I cannot complete this task",
          });

          // Gửi dữ liệu đến Google Sheets
          const sheetResponse = await fetch(apiUrl, {
            method: "POST",
            mode: "no-cors",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(tempSheetData),
          });

          console.log("Google Sheets response:", await sheetResponse.text());
        }
      }

      // Cập nhật tin nhắn "đang chờ" với nội dung thực tế và xóa class tạm thời
      updateMessages({
        ...MessageByPass.current.find((msg) => msg.id === tempId),
        content: resolvedText.contents,
        className: "",
      });
    } catch (error) {
      console.error("Error in sendMessageToSheet:", error);
      const errorMessage = {
        id: tempId,
        type: "received",
        content: "Failed to process and send message",
        className: "",
      };
      updateMessages(errorMessage);
    }
  };

  useEffect(() => {
    document.title = "Javier | Web";
    console.log("Use effect trigger");

    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${apiUrl}?pairs=10`);
        const data = await response.json();

        const reversedData = data.reverse();

        const fetchedMessages = reversedData.flatMap((item) => {
          const messages = [];
          messages.push({ type: "sent", content: item.Request });
          messages.push({
            type: "received",
            content: item.ResolveA,
            timestamp: item.TimeStamp,
          });
          if (item.ResolveB) {
            messages.push({ type: "sent", content: item.ResolveB });
            messages.push({
              type: "received",
              content: item.ResolveC || "No response",
              timestamp: item.TimeStamp,
            });
          }
          return messages;
        });

        setMessages(fetchedMessages);
        MessageByPass.current = fetchedMessages;
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

      recognition.onresult = async (event) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);
        console.log("Current messages state inside useEffect:", messages);

        if (
          isFocusing === true &&
          event.results[current].isFinal &&
          transcriptText != ""
        ) {
          postPrompt = transcriptText;
          console.log("PostPrompt:", postPrompt);
          isFocusing = false;

          // Add voice command to messages at the end of the array
          updateMessages({
            type: "sent",
            content: `Voice: ${transcriptText}`,
          });

          // Send voice command to Google Sheets and Gemini
          const voiceCommand = transcriptText.replace(/javier/i, "").trim();
          if (voiceCommand) {
            try {
              await sendMessageToSheet(voiceCommand, "voice");
            } catch (error) {
              console.error("Error sending voice command:", error);
            }
          }

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
          isFocusing = true;
          setIsCallingJavier(true); // Set the calling state to true
          console.log(isFocusing);

          const randomResponse =
            awaiterResponses[
              Math.floor(Math.random() * awaiterResponses.length)
            ];
          console.log("Javier responds:", randomResponse);
          speakText(randomResponse);

          // Set a timeout to reset the calling state after 5 seconds
          setIsCallingJavier(false);
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

  useEffect(() => {
    console.log("Messages updated:", messages);
  }, [messages]);

  const speakText = async (text) => {
    console.log("Attempting to speak text:", text);
    try {
      console.log("Sending request to Google Text-to-Speech API");
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

      console.log("Response status:", response.status);
      const responseData = await response.json();
      console.log("Response data:", responseData);

      if (responseData.audioContent) {
        console.log("Audio content received, attempting to play");
        if (audioPlayerRef.current) {
          audioPlayerRef.current.src = `data:audio/mp3;base64,${responseData.audioContent}`;
          audioPlayerRef.current
            .play()
            .then(() => {
              console.log("Audio playback started successfully");
            })
            .catch((error) => {
              console.error("Error during audio playback:", error);
            });
        } else {
          console.error("audioPlayerRef is not available");
        }
      } else {
        console.error("No audio content in the response");
      }
    } catch (error) {
      console.error("Error with text-to-speech:", error);
    }
  };

  const AssistRequest = (transcriptText) => {
    console.log("Javier được gọi với câu lệnh:", transcriptText);

    const voiceCommand = transcriptText.replace(/javier/i, "").trim();
    if (voiceCommand) {
      const newMessage = { type: "sent", content: `Voice: ${voiceCommand}` };
      updateMessages(newMessage);

      // Đợi một chút để đảm bảo state đã được cập nhật
      setTimeout(() => {
        sendMessageToSheet(voiceCommand, "voice");
      }, 0);
    }
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
    updateMessages({
      type: "sent",
      content: inputMessage,
    });
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
                  key={
                    message.id ||
                    `message-${index}-${Date.now()}-${Math.random()}`
                  }
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
