import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Journey from "./pages/Journey";
import Findings from "./pages/Findings";
import Satellite from "./pages/Satellite";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/journey" element={<Journey />} />
        <Route path="/findings" element={<Findings />} />
        <Route path="/satellite" element={<Satellite />} />
      </Routes>
    </Router>
  );
}

export default App;
