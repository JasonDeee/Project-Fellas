import logo from "./logo.svg";
import "./Styles/style.css";

function App() {
  return (
    <div className="App">
      <input type="text" id="Gemini-Input" placeholder="Nhập prompt..." />
      <button id="Gemini-RequestButton">Execute Fixed</button>
      <select id="Voice-EngineSelect">
        <option value="web">Web Speech</option>
        <option value="google">Google Cloud Speech</option>
      </select>
      <p>
        Output: <span id="Gemini-ResponseContent"></span>
      </p>
      <audio id="audioPlayer" controls style="display: none"></audio>
    </div>
  );
}

export default App;
