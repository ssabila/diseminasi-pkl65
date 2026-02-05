import { Link } from "react-router-dom";
import "./Story.css";

function Findings() {
  return (
    <div className="story">
      <div className="story-content">
        <h1>Hasil Pendataan</h1>
        <p className="story-subtitle">Temuan Lapangan & Data Terkumpul</p>

        <div className="story-body">
          <p>Data yang berhasil dikumpulkan...</p>
          {/* Konten story 2 */}
        </div>

        <div className="story-navigation">
          <Link to="/journey" className="nav-button back">
            Sebelumnya
          </Link>
          <Link to="/satellite" className="nav-button next">
            Selanjutnya
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Findings;
