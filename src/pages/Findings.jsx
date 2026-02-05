import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { Heart, TrendingUp, Lightbulb, CheckCircle, Eye, Sparkles, BookOpen, BarChart3, Layers, MapPin, Users, Home } from "lucide-react";
import "./Findings.css";
import sumateraData from "../data/sumateraRegions.json";
import locationPinImage from "../assets/web-story-2/location.png";
import bencana1 from "../assets/web-story-2/bencana1.jpg";
import bencana2 from "../assets/web-story-2/bencana2.jpg";
import bencana3 from "../assets/web-story-2/bencana3.jpg";
import bencana4 from "../assets/web-story-2/bencana4.jpg";
import pengungsian from "../assets/web-story-2/pengungsian.jpg";
import relawan from "../assets/web-story-2/relawan.jpg";
import warga1 from "../assets/web-story-2/warga1.jpg";
import warga2 from "../assets/web-story-2/warga2.jpg";
import warga3 from "../assets/web-story-2/warga3.jpg";

// Helper function to load district GeoJSON from indonesia-district folder
const loadDistrictsData = async () => {
  try {
    // Define which district folders to load for each province
    const districts = [
      // Aceh districts - updated paths pointing directly to district GeoJSON files
      { path: "../../indonesia-district/id11_aceh/id1105_aceh_timur/id1105_aceh_timur.geojson", province: "Aceh", districtName: "Aceh Timur" },
      { path: "../../indonesia-district/id11_aceh/id1111_aceh_utara/id1111_aceh_utara.geojson", province: "Aceh", districtName: "Aceh Utara" },
      { path: "../../indonesia-district/id11_aceh/id1114_aceh_tamiang/id1114_aceh_tamiang.geojson", province: "Aceh", districtName: "Aceh Tamiang" },
      { path: "../../indonesia-district/id11_aceh/id1106_aceh_tengah/id1106_aceh_tengah.geojson", province: "Aceh", districtName: "Aceh Tengah" },
      { path: "../../indonesia-district/id11_aceh/id1113_gayo_lues/id1113_gayo_lues.geojson", province: "Aceh", districtName: "Gayo Lues" },
      { path: "../../indonesia-district/id11_aceh/id1117_bener_meriah/id1117_bener_meriah.geojson", province: "Aceh", districtName: "Bener Meriah" },
      { path: "../../indonesia-district/id11_aceh/id1118_pidie_jaya/id1118_pidie_jaya.geojson", province: "Aceh", districtName: "Pidie Jaya" },
      // Sumatera Utara districts
      { path: "../../indonesia-district/id12_sumatera_utara/id1203_tapanuli_selatan/id1203_tapanuli_selatan.geojson", province: "Sumatera Utara", districtName: "Tapanuli Selatan" },
      { path: "../../indonesia-district/id12_sumatera_utara/id1204_tapanuli_tengah/id1204_tapanuli_tengah.geojson", province: "Sumatera Utara", districtName: "Tapanuli Tengah" },
      { path: "../../indonesia-district/id12_sumatera_utara/id1205_tapanuli_utara/id1205_tapanuli_utara.geojson", province: "Sumatera Utara", districtName: "Tapanuli Utara" },
      { path: "../../indonesia-district/id12_sumatera_utara/id1202_mandailing_natal/id1202_mandailing_natal.geojson", province: "Sumatera Utara", districtName: "Mandailing Natal" },
      { path: "../../indonesia-district/id12_sumatera_utara/id1271_kota_sibolga/id1271_kota_sibolga.geojson", province: "Sumatera Utara", districtName: "Kota Sibolga" },
      // Sumatera Barat districts
      { path: "../../indonesia-district/id13_sumatera_barat/id1306_padang_pariaman/id1306_padang_pariaman.geojson", province: "Sumatera Barat", districtName: "Padang Pariaman" },
      { path: "../../indonesia-district/id13_sumatera_barat/id1305_tanah_datar/id1305_tanah_datar.geojson", province: "Sumatera Barat", districtName: "Tanah Datar" },
      { path: "../../indonesia-district/id13_sumatera_barat/id1307_agam/id1307_agam.geojson", province: "Sumatera Barat", districtName: "Agam" },
    ];
    
    const allFeatures = [];
    const loadedCount = { success: 0, failed: 0 };
    
    for (const dist of districts) {
      try {
        const response = await fetch(dist.path);
        if (!response.ok) {
          console.warn(`Failed to load ${dist.districtName}: ${response.statusText}`);
          loadedCount.failed++;
          continue;
        }
        
        const geojson = await response.json();
        
        if (geojson.features && Array.isArray(geojson.features)) {
          // Aggregate all features from this GeoJSON
          const features = geojson.features.map(f => ({
            ...f,
            properties: {
              ...f.properties,
              province: dist.province,
              districtName: dist.districtName
            }
          }));
          allFeatures.push(...features);
          loadedCount.success++;
          console.log(`✓ Loaded ${dist.districtName} (${features.length} features)`);
        }
      } catch (err) {
        console.warn(`Error loading district ${dist.districtName}:`, err.message);
        loadedCount.failed++;
      }
    }
    
    console.log(`Districts loading complete: ${loadedCount.success} loaded, ${loadedCount.failed} failed. Total features: ${allFeatures.length}`);
    
    return {
      type: "FeatureCollection",
      features: allFeatures
    };
  } catch (err) {
    console.error("Error loading districts data:", err);
    return { type: "FeatureCollection", features: [] };
  }
};

gsap.registerPlugin(ScrollTrigger);

// Helper function to calculate bounds of features
const calculateBounds = (features) => {
  if (!features || features.length === 0) return null;
  
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  
  features.forEach(feature => {
    const coords = feature.geometry.coordinates;
    const processCoords = (coords) => {
      if (typeof coords[0] === 'number') {
        // [lng, lat]
        const [lng, lat] = coords;
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
      } else {
        // nested array
        coords.forEach(processCoords);
      }
    };
    
    if (feature.geometry.type === 'Polygon') {
      feature.geometry.coordinates.forEach(ring => processCoords(ring));
    } else if (feature.geometry.type === 'MultiPolygon') {
      feature.geometry.coordinates.forEach(polygon => {
        polygon.forEach(ring => processCoords(ring));
      });
    }
  });
  
  return [[minLng, minLat], [maxLng, maxLat]];
};

function Findings() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const impactMapContainer = useRef(null);
  const impactMap = useRef(null);
  const mainContainer = useRef(null);
  const heroSection = useRef(null);
  const factsSection = useRef(null);
  const mapSection = useRef(null);
  const impactSection = useRef(null);
  const evacuationSection = useRef(null);
  const titleRef = useRef(null);
  const decorElements = useRef({});
  const disasterCards = useRef([]);
  const [activeRegion, setActiveRegion] = useState(0);
  const [activeImpactRegion, setActiveImpactRegion] = useState(0);
  const [viewMode, setViewMode] = useState('points'); // 'points', 'districts', or 'damage'
  const [districtsData, setDistrictsData] = useState(null); // Store loaded districts data
  const cardsRef = useRef({});

  // Facts data
  const factsData = [
    {
      id: 1,
      title: "Dampak Bencana di Wilayah Sumatera",
      image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=400&fit=crop",
      content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
    },
    {
      id: 2,
      title: "Upaya Pemulihan dan Pembangunan Kembali",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop",
      content: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
    },
    {
      id: 3,
      title: "Komunitas Lokal dan Ketangguhan Sosial",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop",
      content: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo."
    }
  ];

  // Disaster/Impact data - Continuous flow of disaster impact
  const disasterData = [
    {
      id: 1,
      title: "Banjir Bandang",
      image: bencana1,
      description: "Kerusakan Hunian",
      story: "Banjir bandang menyapu area permukiman dengan kecepatan tinggi, menyebabkan kerusakan berat pada infrastruktur hunian. Rumah-rumah tergerus arus deras, struktur bangunan roboh, dan tiang penyangga hancur total.",
      stats: [
        { label: "Rumah Rusak Berat", value: "2,450", suffix: "unit", color: "#FF6B6B" },
        { label: "Rumah Rusak Sedang", value: "1,820", suffix: "unit", color: "#FFA500" },
        { label: "Rumah Rusak Ringan", value: "3,580", suffix: "unit", color: "#FFD166" }
      ],
      impact: "Lebih dari 8,000 keluarga kehilangan tempat tinggal."
    },
    {
      id: 2,
      title: "Gempa Bumi",
      image: bencana2,
      description: "Banyak Rumah Butuh Perbaikan",
      story: "Gempa berkekuatan tinggi menggetarkan wilayah dengan intensitas yang merusak. Dinding retak, atap jebol, dan banyak rumah mengalami kerusakan struktural yang memerlukan perbaikan intensif.",
      stats: [
        { label: "Rumah Rusak Berat", value: "1,950", suffix: "unit", color: "#FF6B6B" },
        { label: "Rumah Rusak Sedang", value: "2,340", suffix: "unit", color: "#FFA500" },
        { label: "Rumah Butuh Renovasi", value: "4,200", suffix: "unit", color: "#FFD166" }
      ],
      impact: "Proses pemulihan memerlukan materi konstruksi dan tenaga kerja besar."
    },
    {
      id: 3,
      title: "Longsor Lahan",
      image: bencana3,
      description: "Dampak Hunian Permanen",
      story: "Longsor menghancurkan area hunian di lereng bukit dengan daya rusak yang sangat besar. Memporak-porandakan rumah dan membuat lahan tidak layak untuk permukiman.",
      stats: [
        { label: "Rumah Hilang Total", value: "1,200", suffix: "unit", color: "#FF6B6B" },
        { label: "Lahan Tak Layak Pakai", value: "125", suffix: "hektar", color: "#FFA500" },
        { label: "Keluarga Relokasi", value: "3,650", suffix: "keluarga", color: "#FFD166" }
      ],
      impact: "Diperlukan relokasi dan pembangunan hunian baru di lokasi aman."
    }
  ];

  // Evacuation/Emergency Condition Data
  const evacuationData = [
    {
      id: 1,
      title: "Titik Evakuasi Utama",
      image: pengungsian,
      stats: [
        { label: "Lokasi Evakuasi", value: "24", suffix: "titik", icon: MapPin, color: "#FF6B6B" },
        { label: "Pengungsi", value: "12,450", suffix: "orang", icon: Users, color: "#FFA500" },
        { label: "Keluarga Terdampak", value: "3,580", suffix: "keluarga", icon: Home, color: "#FFD166" }
      ]
    },
    {
      id: 2,
      title: "Hunian Darurat",
      image: relawan,
      stats: [
        { label: "Huntara Berdiri", value: "18", suffix: "unit", icon: Home, color: "#FF6B6B" },
        { label: "Kapasitas Penampung", value: "8,900", suffix: "orang", icon: Users, color: "#FFA500" },
        { label: "Ketersediaan Tempat", value: "65%", suffix: "terisi", icon: BarChart3, color: "#FFD166" }
      ]
    }
  ];

  // Regional data with coordinates for card positioning
  const regionsData = [
    {
      id: 0,
      name: "Aceh",
      coordinates: [95.2, 4.7],
      cardPosition: { top: "5%", right: "30px" },
      icon: Eye,
      buildings: 2145,
      people: 8932,
      cities: ["Banda Aceh", "Lhokseumawe"],
      stats: [
        { label: "PCL", value: "300 unit" },
        { label: "PML", value: "30 unit" },
        { label: "Infrastruktur Rusak", value: "23 km jalan" }
      ],
      damage: [
        { type: "Berat", count: 1200 },
        { type: "Sedang", count: 650 },
        { type: "Ringan", count: 295 }
      ],
      damageDetails: [
        { icon: "🏠", label: "Hunian Rusak Total", value: "1,200" },
        { icon: "🏢", label: "Bangunan Publik", value: "45" },
        { icon: "🛣️", label: "Jalan Rusak", value: "23 km" },
        { icon: "💧", label: "Sumber Air Tercemar", value: "8" }
      ],
      photo: bencana1,
      photoCaption: "Kondisi banjir bandang di Aceh - dampak bencana alam yang signifikan",
      facilities: ["Sekolah", "Rumah Sakit", "Puskesmas"],
      stories: "Komunitas Aceh telah menunjukkan ketangguhan luar biasa dalam pemulihan.",
      needs: ["Shelter", "Makanan", "Obat-obatan", "Air Bersih"],
      progress: 65
    },
    {
      id: 1,
      name: "Sumatera Utara",
      coordinates: [100.0, 1.5],
      cardPosition: { top: "50%", left: "30px" },
      icon: BarChart3,
      buildings: 3421,
      people: 15678,
      cities: ["Medan", "Binjai", "Pematangsiantar"],
      stats: [
        { label: "PCL", value: "180 unit" },
        { label: "PML", value: "18 unit" },
        { label: "Infrastruktur Rusak", value: "42 km jalan" }
      ],
      damage: [
        { type: "Berat", count: 1950 },
        { type: "Sedang", count: 980 },
        { type: "Ringan", count: 491 }
      ],
      damageDetails: [
        { icon: "🏠", label: "Hunian Rusak Total", value: "1,950" },
        { icon: "🏢", label: "Bangunan Publik", value: "62" },
        { icon: "🛣️", label: "Jalan Rusak", value: "42 km" },
        { icon: "🌊", label: "Luas Banjir", value: "156 hektar" }
      ],
      photo: bencana2,
      photoCaption: "Dampak gempa bumi di Sumatera Utara - kerusakan struktur bangunan",
      facilities: ["Sekolah", "Rumah Sakit", "Pasar", "Kantor Pemerintah"],
      stories: "Sumatera Utara memperlihatkan semangat gotong royong yang kuat.",
      needs: ["Shelter", "Logistik", "Alat Berat", "Dukungan Psikologis"],
      progress: 58
    },
    {
      id: 2,
      name: "Sumatera Barat",
      coordinates: [101.0, 0.5],
      cardPosition: { bottom: "40px", right: "30px"},
      icon: Layers,
      buildings: 2876,
      people: 12456,
      cities: ["Padang", "Bukittinggi", "Payakumbuh"],
      stats: [
        { label: "PCL", value: "30 unit" },
        { label: "PML", value: "3 unit" },
        { label: "Infrastruktur Rusak", value: "35 km jalan" }
      ],
      damage: [
        { type: "Berat", count: 1650 },
        { type: "Sedang", count: 820 },
        { type: "Ringan", count: 406 }
      ],
      damageDetails: [
        { icon: "🏠", label: "Hunian Rusak Total", value: "1,650" },
        { icon: "🏢", label: "Bangunan Publik", value: "38" },
        { icon: "🛣️", label: "Jalan Rusak", value: "35 km" },
        { icon: "⛰️", label: "Area Longsor", value: "78 hektar" }
      ],
      photo: bencana3,
      photoCaption: "Bencana longsor lahan di Sumatera Barat - ancaman bagi pemukiman",
      facilities: ["Sekolah", "Klinik", "Balai Kesehatan"],
      stories: "Masyarakat Sumatera Barat terus berjuang untuk bangkit.",
      needs: ["Shelter", "Makanan", "Tenaga Medis", "Peralatan"],
      progress: 72
    }
  ];

  // Register GSAP plugins and initialize ScrollSmoother
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
    
    // Initialize ScrollSmoother for smooth scrolling
    const smoother = ScrollSmoother.create({
      smooth: 2,
      effects: true,
    });

    return () => {
      // Cleanup on unmount
      smoother?.kill();
    };
  }, []);

  // Load districts data from indonesia-district folder
  useEffect(() => {
    let isMounted = true;
    
    const loadDistricts = async () => {
      const data = await loadDistrictsData();
      if (isMounted) {
        setDistrictsData(data);
        console.log('Districts data loaded:', data.features.length, 'features');
      }
    };
    
    loadDistricts();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize Impact Map
  useEffect(() => {
    // Only run once
    if (impactMap.current) return;

    const timer = setTimeout(() => {
      if (!impactMapContainer.current) {
        console.log('Impact map container not found');
        return;
      }

      console.log('Initializing impact map...');

      try {
        const mapInstance = new maplibregl.Map({
          container: impactMapContainer.current,
          style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
          center: [95.5, 3.5],
          zoom: 6.5,
          attributionControl: false,
          scrollZoom: true,
          antialias: true
        });

        impactMap.current = mapInstance;

        mapInstance.on('load', () => {
          console.log('Impact map fully loaded');

          // Add Sumatera regions source and layers
          if (!mapInstance.getSource('sumatera-regions-impact')) {
            mapInstance.addSource('sumatera-regions-impact', {
              type: 'geojson',
              data: sumateraData
            });

            mapInstance.addLayer({
              id: 'sumatera-fill-impact',
              type: 'fill',
              source: 'sumatera-regions-impact',
              paint: {
                'fill-color': '#003631',
                'fill-opacity': 0.2,
              }
            });

            mapInstance.addLayer({
              id: 'sumatera-stroke-impact',
              type: 'line',
              source: 'sumatera-regions-impact',
              paint: {
                'line-color': '#FFEA8A',
                'line-width': 2,
              }
            });
          }

          // Add districts source and layers for impact map
          if (!mapInstance.getSource('indonesia-districts-impact')) {
            mapInstance.addSource('indonesia-districts-impact', {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: []
              }
            });

            mapInstance.addLayer({
              id: 'districts-fill-impact',
              type: 'fill',
              source: 'indonesia-districts-impact',
              paint: {
                'fill-color': [
                  'case',
                  ['boolean', ['feature-state', 'hover'], false],
                  '#FFD700',
                  '#FFEA8A'
                ],
                'fill-opacity': [
                  'case',
                  ['boolean', ['feature-state', 'hover'], false],
                  0.6,
                  0.35
                ]
              }
            });

            mapInstance.addLayer({
              id: 'districts-stroke-impact',
              type: 'line',
              source: 'indonesia-districts-impact',
              paint: {
                'line-color': [
                  'case',
                  ['boolean', ['feature-state', 'hover'], false],
                  '#003631',
                  '#003631'
                ],
                'line-width': [
                  'case',
                  ['boolean', ['feature-state', 'hover'], false],
                  3.5,
                  2.5
                ],
                'line-opacity': 0.8
              }
            });
          }
        });

        mapInstance.on('error', (e) => {
          console.error('Impact map error:', e.error);
        });
      } catch (err) {
        console.error('Failed to initialize impact map:', err);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Initialize Map with Point Markers - Fresh Approach
  useEffect(() => {
    // Only run once
    if (map.current) return;
    
    // Wait a tiny bit to ensure DOM is ready
    const timer = setTimeout(() => {
      if (!mapContainer.current) {
        console.log('Map container not found');
        return;
      }
      
      console.log('Initializing map...');
      
      try {
        const mapInstance = new maplibregl.Map({
          container: mapContainer.current,
          style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
          center: [100.0, 2.0],
          zoom: 6.5,
          attributionControl: false,
          scrollZoom: false,
          antialias: true
        });
        
        map.current = mapInstance;
        mapInstance.on('style.load', () => {
          console.log('Map style loaded');
        });

        mapInstance.on('load', () => {
          console.log('Map fully loaded');
          
          // Add sources and layers
          if (!mapInstance.getSource('sumatera-regions')) {
            mapInstance.addSource('sumatera-regions', {
              type: 'geojson',
              data: sumateraData
            });
          }

          if (!mapInstance.getLayer('sumatera-fill')) {
            mapInstance.addLayer({
              id: 'sumatera-fill',
              type: 'fill',
              source: 'sumatera-regions',
              paint: {
                'fill-color': '#003631',
                'fill-opacity': 0.2,
              }
            });

            mapInstance.addLayer({
              id: 'sumatera-stroke',
              type: 'line',
              source: 'sumatera-regions',
              paint: {
                'line-color': '#FFEA8A',
                'line-width': 2,
              }
            });
          }

          // Add district source and layers
          if (!mapInstance.getSource('indonesia-districts')) {
            mapInstance.addSource('indonesia-districts', {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: []
              }
            });

            // Add district fill layer - start hidden with better styling
            mapInstance.addLayer({
              id: 'districts-fill',
              type: 'fill',
              source: 'indonesia-districts',
              paint: {
                'fill-color': [
                  'case',
                  ['boolean', ['feature-state', 'hover'], false],
                  '#FFD700',
                  '#FFEA8A'
                ],
                'fill-opacity': [
                  'case',
                  ['boolean', ['feature-state', 'hover'], false],
                  0.6,
                  0.35
                ]
              }
            });

            // Add district stroke layer - start hidden with better styling
            mapInstance.addLayer({
              id: 'districts-stroke',
              type: 'line',
              source: 'indonesia-districts',
              paint: {
                'line-color': [
                  'case',
                  ['boolean', ['feature-state', 'hover'], false],
                  '#003631',
                  '#003631'
                ],
                'line-width': [
                  'case',
                  ['boolean', ['feature-state', 'hover'], false],
                  3.5,
                  2.5
                ],
                'line-opacity': 0.8
              }
            });
            
            // Hide both layers initially
            mapInstance.setLayoutProperty('districts-fill', 'visibility', 'none');
            mapInstance.setLayoutProperty('districts-stroke', 'visibility', 'none');
            console.log('District layers created and hidden');
          }

          // Add markers
          regionsData.forEach((region, idx) => {
            const pmlValue = region.stats[1]?.value?.split(' ')[0] || '0';
            const pclValue = region.stats[0]?.value?.split(' ')[0] || '0';

            const markerDiv = document.createElement('div');
            markerDiv.className = 'point-marker';
            markerDiv.setAttribute('data-region', region.name);
            markerDiv.style.animation = `popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 0.15}s both`;
            markerDiv.innerHTML = `
              <div class="marker-label-top">
                <div class="region-name">${region.name}</div>
                <div class="pml-pcl-info">
                  <span class="pml-badge">${pmlValue} PML</span>
                  <span class="pcl-badge">${pclValue} PCL</span>
                </div>
              </div>
              <div class="marker-pin">
                <img src="${locationPinImage}" alt="location" />
              </div>
            `;

            new maplibregl.Marker({ element: markerDiv, anchor: 'center' })
              .setLngLat(region.coordinates)
              .addTo(mapInstance);
          });
        });

        mapInstance.on('error', (e) => {
          console.error('Map error:', e.error);
        });
      } catch (err) {
        console.error('Failed to initialize map:', err);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle scroll to navigate regions and view modes
  useEffect(() => {
    let scrollTimeout;
    let lastScrollTime = 0;

    const handleScroll = (e) => {
      // Only handle scroll if we're in the map section
      if (!mapContainer.current) return;
      
      const rect = mapContainer.current.getBoundingClientRect();
      const isInMapSection = rect.top < window.innerHeight && rect.bottom > 0;
      
      if (!isInMapSection) return;

      const currentTime = Date.now();
      if (currentTime - lastScrollTime < 800) return;
      lastScrollTime = currentTime;

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const direction = e.deltaY > 0 ? 1 : -1;
        
        if (direction > 0) {
          // Scroll down: points → districts → damage → next region
          if (viewMode === 'points') {
            setViewMode('districts');
          } else if (viewMode === 'districts') {
            setViewMode('damage');
          } else if (viewMode === 'damage') {
            setViewMode('points');
            const nextRegion = (activeRegion + 1) % regionsData.length;
            setActiveRegion(nextRegion);
          }
        } else {
          // Scroll up: points ← districts ← damage ← prev region
          if (viewMode === 'damage') {
            setViewMode('districts');
          } else if (viewMode === 'districts') {
            setViewMode('points');
          } else if (viewMode === 'points') {
            setViewMode('damage');
            const prevRegion = activeRegion === 0 ? regionsData.length - 1 : activeRegion - 1;
            setActiveRegion(prevRegion);
          }
        }
      }, 50);
    };

    if (mapContainer.current) {
      mapContainer.current.addEventListener('wheel', handleScroll, { passive: true });
    }

    return () => {
      if (mapContainer.current) {
        mapContainer.current.removeEventListener('wheel', handleScroll);
      }
      clearTimeout(scrollTimeout);
    };
  }, [activeRegion, viewMode, regionsData.length]);

  // Animate facts section
  useEffect(() => {
    const factCards = factsSection.current?.querySelectorAll('.fact-card');
    if (!factCards) return;

    factCards.forEach((card, index) => {
      gsap.fromTo(
        card,
        {
          opacity: 0,
          y: 50,
          scale: 0.9
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          delay: index * 0.2,
          ease: 'back.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 80%',
            end: 'top 30%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    });
  }, []);

  // Animate card entrance and fly to region
  useEffect(() => {
    const activeCard = cardsRef.current[activeRegion];
    if (!activeCard) return;

    // Get the target position transform
    const region = regionsData[activeRegion];
    const targetTransform = region.cardPosition.transform || "rotate(0deg)";

    // Animate card entrance with position and rotation changes
    gsap.fromTo(
      activeCard,
      {
        opacity: 0,
        y: 50,
        scale: 0.8,
        rotation: -10
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        rotation: 0,
        duration: 0.8,
        ease: 'back.out',
        onComplete: () => {
          // Apply the scrapbook rotation after entrance animation
          gsap.to(activeCard, {
            rotation: parseInt(targetTransform.match(/\d+/)?.[0] || 0) * (targetTransform.includes('-') ? -1 : 1),
            duration: 0.4,
            ease: 'back.out'
          });
        }
      }
    );

    // Fly to region
    if (map.current && map.current.loaded()) {
      map.current.flyTo({
        center: region.coordinates,
        zoom: 8,
        duration: 1500,
        essential: true
      });
    }
  }, [activeRegion, regionsData]);

  // Toggle between points and districts view with animation
  useEffect(() => {
    if (!map.current || !map.current.loaded()) {
      console.log('Map not loaded yet');
      return;
    }

    const region = regionsData[activeRegion];
    console.log('=== VIEW TOGGLE ===');
    console.log('View mode:', viewMode, '| Region:', region.name, '| Region ID:', activeRegion);
    
    // Toggle marker visibility - only show markers for active region in points view
    const markers = document.querySelectorAll('.point-marker');
    console.log('Markers found:', markers.length);
    markers.forEach((marker, i) => {
      const markerRegion = marker.getAttribute('data-region');
      const isActiveRegion = markerRegion === region.name;
      const shouldDisplay = viewMode === 'points' && isActiveRegion;
      
      gsap.to(marker, {
        opacity: shouldDisplay ? 1 : 0,
        pointerEvents: shouldDisplay ? 'auto' : 'none',
        duration: 0.3,
        ease: 'power2.inOut'
      });
      
      if (i === 0) {
        console.log(`Marker for ${markerRegion}: ${shouldDisplay ? 'visible' : 'hidden'}`);
      }
    });

    // Get source to verify it exists
    const source = map.current.getSource('indonesia-districts');
    if (!source) {
      console.error('ERROR: district source not found!');
      return;
    }

    // Check if districts data is loaded
    if (!districtsData) {
      console.log('Districts data not loaded yet');
      return;
    }

    // Toggle district layers
    if (viewMode === 'districts') {
      console.log('>>> Showing districts for', region.name);
      
      // Filter districts for current region
      const regionDistricts = districtsData.features.filter(
        d => {
          const matches = d.properties.province === region.name;
          return matches;
        }
      );
      
      console.log('Filtered districts count:', regionDistricts.length);
      console.log('Districts:', regionDistricts.map(d => d.properties.districtName || d.properties.name || 'Unknown').join(', '));

      // Update district source with filtered features
      if (regionDistricts.length > 0) {
        try {
          source.setData({
            type: 'FeatureCollection',
            features: regionDistricts
          });
          console.log('✓ District source data updated');

          // Calculate bounds and fly to districts
          const bounds = calculateBounds(regionDistricts);
          if (bounds) {
            console.log('Bounds calculated:', bounds);
            map.current.fitBounds(bounds, {
              padding: 50,
              duration: 1500,
              essential: true
            });
          }
        } catch (e) {
          console.error('Error updating source:', e);
        }
      }

      // Show district layers with animation
      try {
        const fillLayer = map.current.getLayer('districts-fill');
        const strokeLayer = map.current.getLayer('districts-stroke');
        
        if (fillLayer) {
          map.current.setLayoutProperty('districts-fill', 'visibility', 'visible');
          gsap.to({opacity: 0}, {
            opacity: 1,
            duration: 0.6,
            ease: 'power2.inOut',
            onUpdate: function() {
              const opacity = this.targets()[0].opacity;
              map.current.setPaintProperty('districts-fill', 'fill-opacity', 0.35 * opacity);
            }
          });
          console.log('✓ Districts fill visibility set to VISIBLE');
        }
        if (strokeLayer) {
          map.current.setLayoutProperty('districts-stroke', 'visibility', 'visible');
          console.log('✓ Districts stroke visibility set to VISIBLE');
        }
      } catch (e) {
        console.error('Error setting visibility:', e);
      }
    } else {
      console.log('<<< Hiding districts');
      
      // Hide district layers with animation
      try {
        if (map.current.getLayer('districts-fill')) {
          gsap.to({opacity: 1}, {
            opacity: 0,
            duration: 0.4,
            ease: 'power2.inOut',
            onUpdate: function() {
              const opacity = this.targets()[0].opacity;
              map.current.setPaintProperty('districts-fill', 'fill-opacity', 0.35 * opacity);
            },
            onComplete: () => {
              if (map.current.getLayer('districts-fill')) {
                map.current.setLayoutProperty('districts-fill', 'visibility', 'none');
              }
            }
          });
          console.log('✓ Districts fill visibility animating out');
        }
        if (map.current.getLayer('districts-stroke')) {
          map.current.setLayoutProperty('districts-stroke', 'visibility', 'none');
          console.log('✓ Districts stroke visibility set to NONE');
        }
      } catch (e) {
        console.error('Error hiding layers:', e);
      }
    }
  }, [viewMode, activeRegion, regionsData, districtsData]);

  // Hero Section Animations
  useEffect(() => {
    if (!titleRef.current) return;

    // Animate title with scrapbook style
    gsap.fromTo(
      titleRef.current,
      {
        opacity: 0,
        scale: 0.8,
        rotation: -5,
        y: 50
      },
      {
        opacity: 1,
        scale: 1,
        rotation: 0,
        y: 0,
        duration: 1.2,
        ease: 'back.out',
        delay: 0.3,
        scrollTrigger: {
          trigger: heroSection.current,
          start: 'top center',
          toggleActions: 'play none none reverse'
        }
      }
    );

    // Animate decorative elements with stop-motion effect
    Object.entries(decorElements.current).forEach(([key, el], index) => {
      if (!el) return;
      
      const randomRotation = Math.random() * 8 - 4;
      const randomScale = 0.8 + Math.random() * 0.4;
      
      gsap.fromTo(
        el,
        {
          opacity: 0,
          scale: 0.5,
          rotation: randomRotation - 15,
          x: Math.random() * 100 - 50,
          y: Math.random() * 100 - 50
        },
        {
          opacity: 0.7,
          scale: randomScale,
          rotation: randomRotation,
          x: 0,
          y: 0,
          duration: 1.5,
          delay: 0.1 + index * 0.15,
          ease: 'elastic.out(1, 0.6)',
          scrollTrigger: {
            trigger: heroSection.current,
            start: 'top center',
            toggleActions: 'play none none reverse'
          }
        }
      );
    });
  }, []);

  // Facts Section Animations - Scrapbook style
  useEffect(() => {
    const factCards = factsSection.current?.querySelectorAll('.fact-card');
    if (!factCards) return;

    factCards.forEach((card, index) => {
      const randomRotation = Math.random() * 6 - 3;
      const randomSkew = Math.random() * 4 - 2;

      gsap.fromTo(
        card,
        {
          opacity: 0,
          y: 80,
          scale: 0.85,
          rotation: randomRotation - 10,
          skewY: randomSkew
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          rotation: randomRotation,
          skewY: randomSkew,
          duration: 1,
          delay: index * 0.25,
          ease: 'back.out(2)',
          scrollTrigger: {
            trigger: card,
            start: 'top 80%',
            end: 'top 30%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      // Image animation on hover - stop motion style
      const img = card.querySelector('.fact-image img');
      if (img) {
        card.addEventListener('mouseenter', () => {
          gsap.to(img, {
            scale: 1.1,
            duration: 0.4,
            ease: 'back.out'
          });
        });
        
        card.addEventListener('mouseleave', () => {
          gsap.to(img, {
            scale: 1,
            duration: 0.4,
            ease: 'back.out'
          });
        });
      }
    });
  }, []);

  // Impact Section Animations with Scroll Trigger
  useEffect(() => {
    if (!impactSection.current) return;

    // Single trigger to update region based on scroll progress
    const mainTrigger = gsap.timeline({
      scrollTrigger: {
        trigger: impactSection.current,
        start: 'top center',
        end: 'bottom center',
        markers: false,
        onUpdate: (self) => {
          // Calculate region based on scroll progress through section
          const progress = self.progress;
          const regionIndex = Math.floor(progress * regionsData.length);
          const nextRegion = Math.min(regionIndex, regionsData.length - 1);
          
          if (activeImpactRegion !== nextRegion) {
            setActiveImpactRegion(nextRegion);
          }
        }
      }
    });

    return () => {
      if (mainTrigger && mainTrigger.scrollTrigger) {
        mainTrigger.scrollTrigger.kill();
      }
    };
  }, []);

  // Handle Impact Map Updates when region changes
  useEffect(() => {
    const region = regionsData[activeImpactRegion];
    if (!impactMap.current || !impactMap.current.loaded()) return;

    console.log('Flying to impact region:', region.name);

    // Fly to region
    impactMap.current.flyTo({
      center: region.coordinates,
      zoom: 8,
      duration: 1500,
      essential: true
    });

    // Update districts layer
    if (districtsData) {
      const regionDistricts = districtsData.features.filter(
        d => d.properties.province === region.name
      );

      const source = impactMap.current.getSource('indonesia-districts-impact');
      if (source && regionDistricts.length > 0) {
        source.setData({
          type: 'FeatureCollection',
          features: regionDistricts
        });

        const bounds = calculateBounds(regionDistricts);
        if (bounds) {
          impactMap.current.fitBounds(bounds, {
            padding: 50,
            duration: 1500,
            essential: true
          });
        }
      }
    }
  }, [activeImpactRegion, districtsData]);

  // Animate floating cards entrance
  useEffect(() => {
    if (!impactSection.current) return;

    const statsCard = impactSection.current.querySelector('.stats-card-floating');
    const photoCard = impactSection.current.querySelector('.photo-card-floating');

    if (statsCard) {
      gsap.fromTo(
        statsCard,
        {
          opacity: 0,
          x: -100,
          scale: 0.9
        },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.8,
          ease: 'back.out(1.2)',
          scrollTrigger: {
            trigger: impactSection.current,
            start: 'top 60%',
            end: 'top 40%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }

    if (photoCard) {
      gsap.fromTo(
        photoCard,
        {
          opacity: 0,
          x: 100,
          scale: 0.9
        },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.8,
          delay: 0.2,
          ease: 'back.out(1.2)',
          scrollTrigger: {
            trigger: impactSection.current,
            start: 'top 60%',
            end: 'top 40%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }

    return () => {
      // Cleanup scroll triggers
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.vars.trigger === impactSection.current) {
          trigger.kill();
        }
      });
    };
  }, []);

  // Impact Section Animations - Scroll trigger with alternating layout
  useEffect(() => {
    const cards = disasterCards.current;
    if (!cards || cards.length === 0) return;

    cards.forEach((card, index) => {
      if (!card) return;

      const isLeftLayout = index % 2 === 0;
      const imageContainer = card.querySelector('.impact-image-container');
      const contentContainer = card.querySelector('.impact-content-container');
      const closingSection = card.querySelector('.impact-closing-section');

      // Closing section animation
      if (closingSection) {
        gsap.fromTo(
          closingSection,
          {
            opacity: 0,
            y: 60
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 70%',
              end: 'top 20%',
              toggleActions: 'play none none reverse'
            }
          }
        );
        return;
      }

      // Image animation - slides from opposite sides
      if (imageContainer) {
        gsap.fromTo(
          imageContainer,
          {
            opacity: 0,
            x: isLeftLayout ? -80 : 80,
            scale: 0.85
          },
          {
            opacity: 1,
            x: 0,
            scale: 1,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 70%',
              end: 'top 30%',
              toggleActions: 'play none none reverse'
            }
          }
        );

        // Hover effect
        imageContainer.addEventListener('mouseenter', () => {
          gsap.to(imageContainer.querySelector('.impact-image'), {
            scale: 1.1,
            duration: 0.5,
            ease: 'power2.out'
          });
        });

        imageContainer.addEventListener('mouseleave', () => {
          gsap.to(imageContainer.querySelector('.impact-image'), {
            scale: 1,
            duration: 0.5,
            ease: 'power2.out'
          });
        });
      }

      // Content animation - slides from opposite sides
      if (contentContainer) {
        gsap.fromTo(
          contentContainer,
          {
            opacity: 0,
            x: isLeftLayout ? 80 : -80,
            y: 30
          },
          {
            opacity: 1,
            x: 0,
            y: 0,
            duration: 0.8,
            delay: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 70%',
              end: 'top 30%',
              toggleActions: 'play none none reverse'
            }
          }
        );

        // Animate individual content elements
        const description = contentContainer.querySelector('.content-description');
        const story = contentContainer.querySelector('.content-story');
        const stats = contentContainer.querySelectorAll('.stat-item');
        const impactBox = contentContainer.querySelector('.content-impact');

        if (description) {
          gsap.fromTo(
            description,
            { opacity: 0, y: 20 },
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              delay: 0.2,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: card,
                start: 'top 70%',
                end: 'top 30%',
                toggleActions: 'play none none reverse'
              }
            }
          );
        }

        if (story) {
          gsap.fromTo(
            story,
            { opacity: 0, y: 20 },
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              delay: 0.3,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: card,
                start: 'top 70%',
                end: 'top 30%',
                toggleActions: 'play none none reverse'
              }
            }
          );
        }

        if (stats && stats.length > 0) {
          gsap.fromTo(
            stats,
            { opacity: 0, scale: 0.8 },
            {
              opacity: 1,
              scale: 1,
              duration: 0.5,
              stagger: 0.08,
              delay: 0.4,
              ease: 'back.out(1.5)',
              scrollTrigger: {
                trigger: card,
                start: 'top 70%',
                end: 'top 30%',
                toggleActions: 'play none none reverse'
              }
            }
          );
        }

        if (impactBox) {
          gsap.fromTo(
            impactBox,
            { opacity: 0, x: isLeftLayout ? 20 : -20 },
            {
              opacity: 1,
              x: 0,
              duration: 0.5,
              delay: 0.5,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: card,
                start: 'top 70%',
                end: 'top 30%',
                toggleActions: 'play none none reverse'
              }
            }
          );
        }
      }
    });
  }, []);

  // Evacuation Section Animations
  useEffect(() => {
    if (!evacuationSection.current) return;

    // Animate header
    const header = evacuationSection.current?.querySelector('.evacuation-header');
    if (header) {
      gsap.fromTo(
        header,
        {
          opacity: 0,
          y: -30
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: evacuationSection.current,
            start: 'top 70%',
            end: 'top 30%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }

    // Animate cards
    const cards = evacuationSection.current?.querySelectorAll('.evacuation-card');
    if (cards) {
      cards.forEach((card, index) => {
        gsap.fromTo(
          card,
          {
            opacity: 0,
            y: 50,
            scale: 0.9
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            delay: index * 0.2,
            ease: 'back.out(1.2)',
            scrollTrigger: {
              trigger: evacuationSection.current,
              start: 'top 70%',
              end: 'top 20%',
              toggleActions: 'play none none reverse'
            }
          }
        );
      });
    }

    // Animate info box
    const infoBox = evacuationSection.current?.querySelector('.evacuation-info-box');
    if (infoBox) {
      gsap.fromTo(
        infoBox,
        {
          opacity: 0,
          x: -30
        },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          delay: 0.4,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: evacuationSection.current,
            start: 'bottom 80%',
            end: 'bottom 30%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }
  }, []);

  const region = regionsData[activeRegion];

  return (
    <div id="smooth-wrapper">
      <div id="smooth-content" ref={mainContainer} className="findings-wrapper">
        {/* HERO SECTION */}
      <section ref={heroSection} className="hero-section">
        <div className="hero-content">
          <div className="hero-title-wrapper">
            <h1 ref={titleRef} className="hero-title">
              <span className="title-word">Temuan</span>
              <span className="title-word">Kegiatan</span>
              <span className="title-word prayog">PKL 65</span>
            </h1>
          </div>

          {/* Decorative Elements */}
          <div className="hero-decorations">
            <div ref={(el) => (decorElements.current[0] = el)} className="decor-element decor-1">
              <BookOpen size={48} />
            </div>
            <div ref={(el) => (decorElements.current[1] = el)} className="decor-element decor-2">
              <Sparkles size={48} />
            </div>
            <div ref={(el) => (decorElements.current[2] = el)} className="decor-element decor-3">
              <Eye size={48} />
            </div>
            <div ref={(el) => (decorElements.current[3] = el)} className="decor-element decor-4">
              <Heart size={48} />
            </div>
          </div>

          <p className="hero-subtitle">Proses Pemulihan Bencana di Wilayah Sumatera</p>
        </div>
      </section>

      {/* FACTS SECTION */}
      <section ref={factsSection} className="facts-section">
        <div className="facts-container">
          <div className="facts-header">
            <h1>Fakta Dibalik Pemulihan Bencana</h1>
            <p className="section-subtitle">Memahami dampak dan proses pemulihan di wilayah terdampak</p>
          </div>

          <div className="facts-grid">
            {factsData.map((fact) => (
              <div key={fact.id} className="fact-card">
                <div className="fact-image">
                  <img src={fact.image} alt={fact.title} />
                </div>
                <div className="fact-content">
                  <h3>{fact.title}</h3>
                  <p>{fact.content}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="scroll-indicator">
            <p>Scroll untuk melihat peta interaktif</p>
            <div className="scroll-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* MAP SECTION */}
      <section ref={mapSection} className="findings-container">
        {/* Map Container */}
        <div ref={mapContainer} className="map-fullscreen" />

        {/* Floating Navigation */}
        <nav className="step-navigation">
          <div className="steps-container">
            {regionsData.map((reg, index) => {
              const Icon = reg.icon;
              return (
                <button
                  key={index}
                  className={`step-dot ${activeRegion === index ? 'active' : ''}`}
                  onClick={() => setActiveRegion(index)}
                  title={reg.name}
                >
                  <Icon size={18} />
                </button>
              );
            })}
          </div>
        </nav>

        {/* Damage Cards - Displayed when viewMode is 'damage' */}
        {viewMode === 'damage' && (
          <div className="damage-cards-container">
            {/* Damage Statistics Card */}
            <div className="damage-card damage-stats-card">
              <div className="damage-card-header">
                <h3 className="damage-card-title">Statistik Kerusakan</h3>
                <p className="damage-card-region">{regionsData[activeRegion].name}</p>
              </div>

              <div className="damage-card-content">
                <div className="damage-grid">
                  {regionsData[activeRegion].damageDetails.map((detail, idx) => (
                    <div key={idx} className="damage-item">
                      <div className="damage-item-icon">{detail.icon}</div>
                      <div className="damage-item-info">
                        <div className="damage-item-value">{detail.value}</div>
                        <div className="damage-item-label">{detail.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="damage-summary">
                  <div className="summary-item">
                    <span className="summary-label">Total Hunian Rusak</span>
                    <span className="summary-value">
                      {regionsData[activeRegion].damage.reduce((acc, d) => acc + d.count, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="summary-breakdown">
                    {regionsData[activeRegion].damage.map((item, idx) => (
                      <div key={idx} className="breakdown-item">
                        <span className="breakdown-type">{item.type}</span>
                        <span className="breakdown-count">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="damage-card-footer">
                <p className="scroll-hint">Scroll untuk kembali atau lanjut</p>
              </div>
            </div>

            {/* Photo Condition Card */}
            <div className="damage-card photo-condition-card">
              <div className="photo-card-header">
                <h3 className="photo-card-title">Kondisi Lapangan</h3>
              </div>

              <div className="photo-card-content">
                <img 
                  src={regionsData[activeRegion].photo} 
                  alt={regionsData[activeRegion].photoCaption}
                  className="condition-photo"
                />
                <p className="photo-caption">{regionsData[activeRegion].photoCaption}</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* IMPACT SECTION - Dampak Utama dengan Peta Interaktif Scroll-Triggered */}
      <section ref={impactSection} className="impact-section">
        <div className="impact-container">
          <div className="impact-header">
            <h2 className="impact-title">Dampak Utama</h2>
            <p className="impact-subtitle">Kerusakan Hunian dan Kebutuhan Rehabilitasi</p>
          </div>

          {/* Interactive Map with Floating Cards */}
          <div className="impact-interactive-wrapper">
            {/* Map Container */}
            <div className="impact-map-full-width">
              <div ref={impactMapContainer} className="impact-map-container" />
            </div>

            {/* Floating Cards Container */}
            <div className="impact-floating-cards-wrapper">
              {/* Stats Card */}
              <div className="impact-floating-card stats-card-floating">
                <div className="card-inner">
                  <div className="stats-card-header">
                    <h3 className="stats-region-title">{regionsData[activeImpactRegion].name}</h3>
                    <p className="stats-region-subtitle">Statistik Kerusakan Hunian</p>
                  </div>

                  {/* Damage Statistics */}
                  <div className="damage-stats-wrapper">
                    <div className="damage-stats-title">Kerusakan Hunian</div>
                    <div className="damage-stats-grid">
                      {regionsData[activeImpactRegion].damage.map((item, idx) => (
                        <div key={idx} className="damage-stat-box">
                          <div className="damage-stat-count">{item.count}</div>
                          <div className="damage-stat-type">{item.type}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Infrastructure Stats */}
                  <div className="infra-stats-wrapper">
                    <div className="infra-stats-title">Status Infra</div>
                    <div className="infra-stats-list">
                      {regionsData[activeImpactRegion].stats.map((stat, idx) => (
                        <div key={idx} className="infra-stat-item">
                          <span className="infra-stat-label">{stat.label}</span>
                          <span className="infra-stat-value">{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Facilities */}
                  <div className="facilities-wrapper">
                    <div className="facilities-title">Fasilitas Publik</div>
                    <div className="facilities-list">
                      {regionsData[activeImpactRegion].facilities.map((facility, idx) => (
                        <div key={idx} className="facility-tag">{facility}</div>
                      ))}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="progress-wrapper">
                    <div className="progress-label">
                      <span>Kemajuan Pemulihan</span>
                      <span className="progress-value">{regionsData[activeImpactRegion].progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{width: `${regionsData[activeImpactRegion].progress}%`}}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="stats-description">
                    <p>{regionsData[activeImpactRegion].stories}</p>
                  </div>

                  {/* Needs */}
                  <div className="needs-wrapper">
                    <div className="needs-title">Kebutuhan Utama</div>
                    <div className="needs-list">
                      {regionsData[activeImpactRegion].needs.map((need, idx) => (
                        <div key={idx} className="need-tag">
                          <span className="need-icon">→</span>
                          <span>{need}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Photo Card */}
              <div className="impact-floating-card photo-card-floating">
                <div className="card-inner">
                  <div className="photo-card-header">
                    <h3 className="photo-title">Kondisi Lapangan</h3>
                  </div>
                  <div className="photo-card-content">
                    {activeImpactRegion === 0 && <img src={bencana1} alt="Banjir Bandang" />}
                    {activeImpactRegion === 1 && <img src={bencana2} alt="Gempa Bumi" />}
                    {activeImpactRegion === 2 && <img src={bencana3} alt="Longsor Lahan" />}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alternating Impact Items */}
          <div className="impact-flow-wrapper">
            {disasterData.map((disaster, index) => (
              <div
                key={disaster.id}
                ref={(el) => (disasterCards.current[index] = el)}
                className={`impact-row ${index % 2 === 0 ? 'layout-left' : 'layout-right'}`}
              >
                {/* Image Container */}
                <div className="impact-image-container">
                  <img src={disaster.image} alt={disaster.title} className="impact-image" />
                  <div className="image-overlay">
                    <h4 className="image-title">{disaster.title}</h4>
                  </div>
                </div>

                {/* Content Container */}
                <div className="impact-content-container">
                  <h3 className="content-description">{disaster.description}</h3>
                  <p className="content-story">{disaster.story}</p>

                  {/* Stats */}
                  <div className="content-stats">
                    {disaster.stats.map((stat, idx) => (
                      <div key={idx} className="stat-item">
                        <div className="stat-value" style={{ color: stat.color }}>
                          {stat.value}
                        </div>
                        <div className="stat-unit">{stat.suffix}</div>
                        <div className="stat-label">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Impact Box */}
                  <div className="content-impact">
                    <span>💡</span>
                    <p>{disaster.impact}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Closing Section */}
            <div ref={(el) => (disasterCards.current[3] = el)} className="impact-closing-section">
              <h3>Momentum Pemulihan Bersama</h3>
              <p>
                Upaya pemulihan memerlukan kolaborasi dari semua pihak - pemerintah, komunitas, dan
                relawan. Setiap langkah pemulihan hunian adalah investasi untuk masa depan yang lebih
                baik.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* EVACUATION/EMERGENCY CONDITION SECTION */}
      <section ref={evacuationSection} className="evacuation-section">
        <div className="evacuation-container">
          <div className="evacuation-header">
            <h2 className="evacuation-title">Kondisi Darurat</h2>
            <p className="evacuation-subtitle">Titik Pengungsian dan Hunian Darurat</p>
          </div>

          {/* Evacuation Grid */}
          <div className="evacuation-grid">
            {evacuationData.map((item, index) => (
              <div key={item.id} className={`evacuation-card evacuation-card-${index + 1}`}>
                {/* Image */}
                <div className="evacuation-image-wrapper">
                  <img src={item.image} alt={item.title} className="evacuation-image" />
                  <div className="evacuation-image-overlay">
                    <h3>{item.title}</h3>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="evacuation-stats">
                  {item.stats.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                      <div key={idx} className="evacuation-stat-box">
                        <div className="stat-icon" style={{ color: stat.color }}>
                          <Icon size={28} />
                        </div>
                        <div className="stat-content">
                          <div className="stat-value" style={{ color: stat.color }}>
                            {stat.value}
                          </div>
                          <div className="stat-unit">{stat.suffix}</div>
                          <div className="stat-description">{stat.label}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Info Box */}
          <div className="evacuation-info-box">
            <div className="info-icon">⚠️</div>
            <div className="info-content">
              <h4>Status Darurat Aktif</h4>
              <p>Warga tinggal sementara di hunian darurat sambil menunggu proses pemulihan hunian permanen. Kebutuhan logistik, kesehatan, dan dukungan psikologis terus dipenuhi untuk menjaga kesejahteraan pengungsi.</p>
            </div>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}

export default Findings;
