import { Link } from "react-router-dom";
import "./Story.css";

function Journey() {
  return (
    <div className="story">
      <div className="story-content">
        <h1>Proses & Perjuangan</h1>
        <p className="story-subtitle">14 Januari - 2 Februari 2026</p>

        <div className="story-body">
          <p>Mahasiswa di lapangan...</p>
          {/* Konten story 1 */}
        </div>

        <div className="story-navigation">
          <Link to="/" className="nav-button back">
            Kembali
          </Link>
          <Link to="/findings" className="nav-button next">
            Selanjutnya
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Journey;
