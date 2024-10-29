import React from "react";
import { HashRouter as Router, Route, Routes, Link } from "react-router-dom";
import "./Styles/style.css";
import TextToSpeech from "./Components/TextToSpeech";
import Synthesizer from "./Components/Synthesizer";
import SpeechCommunicator from "./Components/SpeechCommunicator";
import Javier from "./Components/Javier";
import Temp from "./Components/temp";
import TextToSpeech_Downloader from "./Components/TextToSpeech_Downloader";

function App() {
  return (
    <Router>
      <div className="App" id="App-container">
        <Routes>
          <Route path="/text-to-speech" element={<TextToSpeech />} />
          <Route path="/synthesizer" element={<Synthesizer />} />
          <Route path="/speech-communicator" element={<SpeechCommunicator />} />
          <Route path="/Javier" element={<Javier />} />
          <Route path="/temp" element={<Temp />} />
          <Route
            path="/text-to-speech-downloader"
            element={<TextToSpeech_Downloader />}
          />
          <Route
            path="/"
            element={
              <>
                <h1>Welcome to Speech App</h1>
                <p>Please select a component below</p>
                <nav className="HomePage-button-container">
                  <Link to="/text-to-speech">
                    <button>Text to Speech</button>
                  </Link>
                  <Link to="/synthesizer">
                    <button>Synthesizer</button>
                  </Link>
                  <Link to="/speech-communicator">
                    <button>Speech Communicator</button>
                  </Link>
                  <Link to="/Javier">
                    <button>Javier</button>
                  </Link>
                  <Link to="/temp">
                    <button>Temp</button>
                  </Link>
                  <Link to="/text-to-speech-downloader">
                    <button>Text to Speech Downloader</button>
                  </Link>
                </nav>
              </>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
