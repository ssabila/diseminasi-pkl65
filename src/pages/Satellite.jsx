import { Link } from "react-router-dom";
import "./Story.css";

function Satellite() {
  return (
    <div className="story">
      <div className="story-content">
        <h1>Perbandingan Citra Satelit</h1>
        <p className="story-subtitle">Validasi Data dengan Teknologi</p>

        <div className="story-body">
          <p>Perbandingan data lapangan dengan citra satelit...</p>
          {/* Konten story 3 */}
        </div>

        <div className="story-navigation">
          <Link to="/findings" className="nav-button back">
            Sebelumnya
          </Link>
          <Link to="/" className="nav-button next">
            Selesai
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Satellite;
