import { Link } from "react-router-dom";
import "./Landing.css";

function Landing() {
  return (
    <div className="landing">
      <div className="landing-content">
        <h1>PKL Diseminasi</h1>
        <p>Cerita Perjalanan Pendataan Lapangan</p>
        <p className="date-range">14 Januari - 2 Februari 2026</p>

        <Link to="/journey" className="start-button">
          Let's Start the Journey
        </Link>
      </div>
    </div>
  );
}

export default Landing;
