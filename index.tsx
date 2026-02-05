
import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import L from 'leaflet';
import 'leaflet.markercluster';

// Fix for default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface DeliveryEntry {
  id: string;
  name: string;
  coords: [number, number];
  productId: string;
  productName: string;
  productImageUrl: string;
  productLink: string;
  review: string;
  rating: number;
  price: string;
  userImage: string;
}

const initialDeliveryData: DeliveryEntry[] = [
  { id: '1', name: "Priya Sharma", coords: [12.9716, 77.5946], productId: "1318", productName: "Shikaarvani Bodycon Dress", productImageUrl: "https://qamell.in/wp-content/uploads/2024/07/timelessknots-qamell-shikaarvani-bodycon-dress-for-women-by-qamell-2.jpg", productLink: "https://qamell.in/shop/shop-by-theme/timelessknots/shikaarvani-bodycon-women-qamell/", review: "I am absolutely in love with this dress! The bodycon fit is incredibly flattering.", rating: 5, price: "₹1,299", userImage: "https://i.im.ge/2025/10/18/nRdIyK.Untitled-design.png" },
  { id: '2', name: "Sneha Reddy", coords: [17.3850, 78.4867], productId: "1318", productName: "Shikaarvani Bodycon Dress", productImageUrl: "https://qamell.in/wp-content/uploads/2024/07/timelessknots-qamell-shikaarvani-bodycon-dress-for-women-by-qamell-2.jpg", productLink: "https://qamell.in/shop/shop-by-theme/timelessknots/shikaarvani-bodycon-women-qamell/", review: "Wore this dress to a friend's party and felt like a showstopper!", rating: 5, price: "₹1,299", userImage: "https://i.im.ge/2025/10/30/nk8QTY.From-Root-to-Runway-1.png" },
];

const App = () => {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<any | null>(null);
  const [data, setData] = useState<DeliveryEntry[]>([]);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    pincode: '',
    productName: '',
    productLink: '',
    review: '',
    rating: 5,
    userImage: ''
  });
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Hidden Access Logic
  useEffect(() => {
    // Check URL parameter: ?admin=true
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      setIsAdminAuthorized(true);
    }

    // Keyboard shortcut: Ctrl + Alt + A
    const handleKeyDown = (e: KeyboardEvent) => {
      // Use e.code for better reliability across layouts
      if (e.ctrlKey && e.altKey && e.code === 'KeyA') {
        e.preventDefault();
        setIsAdminAuthorized(true);
        setIsAdminOpen(prev => !prev);
        console.log("Admin Dashboard Shortcut Triggered");
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load data from localStorage or initial
  useEffect(() => {
    const saved = localStorage.getItem('qamell_map_data');
    if (saved) {
      setData(JSON.parse(saved));
    } else {
      setData(initialDeliveryData);
    }
  }, []);

  // Save data to localStorage (Simulating Backend Storage)
  useEffect(() => {
    if (data.length > 0) {
      localStorage.setItem('qamell_map_data', JSON.stringify(data));
    }
  }, [data]);

  const createMarker = (entry: DeliveryEntry) => {
    const customIcon = L.divIcon({
      className: 'sayan-marker-icon',
      html: '<div class="marker-dot"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
    
    const marker = L.marker(entry.coords as L.LatLngExpression, { icon: customIcon });

    let starsHtml = '';
    for (let i = 0; i < 5; i++) {
      if (entry.rating >= i + 1) {
        starsHtml += `<span class="material-icons">star</span>`;
      } else if (entry.rating >= i + 0.5) {
        starsHtml += `<span class="material-icons">star_half</span>`;
      } else {
        starsHtml += `<span class="material-icons">star_border</span>`;
      }
    }
    
    const userImageHtml = entry.userImage 
      ? `<img src="${entry.userImage}" alt="User provided content" class="popup-user-image">`
      : '';

    const popupContent = `
      <div class="custom-popup">
        <div class="popup-header">
          <span class="material-icons-outlined">place</span>
          <p>A purchase from <strong>${entry.name}</strong></p>
        </div>
        ${userImageHtml}
        <div class="product-details">
            <h4>${entry.productName}</h4>
        </div>
        <div class="review-section">
          <div class="review-stars">
            ${starsHtml}
          </div>
          <blockquote>"${entry.review}"</blockquote>
        </div>
         <a href="${entry.productLink}" class="view-product-btn" target="_blank" rel="noopener noreferrer">View Product</a>
      </div>
    `;

    marker.bindPopup(popupContent);
    return marker;
  };

  const updateMarkersOnMap = () => {
    if (!mapRef.current || !markersRef.current) return;
    markersRef.current.clearLayers();
    const markerList = data.map(createMarker);
    markerList.forEach(marker => markersRef.current.addLayer(marker));
  };

  useEffect(() => {
    updateMarkersOnMap();
  }, [data]);

  useEffect(() => {
    if (!mapRef.current) {
      const savedZoom = localStorage.getItem('mapZoom');
      const savedLat = localStorage.getItem('mapCenterLat');
      const savedLng = localStorage.getItem('mapCenterLng');

      const initialZoom = savedZoom ? parseInt(savedZoom, 10) : 5;
      const initialCenter: L.LatLngExpression = savedLat && savedLng 
        ? [parseFloat(savedLat), parseFloat(savedLng)] 
        : [20.5937, 78.9629];

      const map = L.map('map', { zoomControl: false }).setView(initialCenter, initialZoom);
      mapRef.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);
      
      markersRef.current = (L as any).markerClusterGroup();
      map.addLayer(markersRef.current);
      
      map.on('moveend', () => {
        const center = map.getCenter();
        const zoom = map.getZoom();
        localStorage.setItem('mapCenterLat', center.lat.toString());
        localStorage.setItem('mapCenterLng', center.lng.toString());
        localStorage.setItem('mapZoom', zoom.toString());
      });
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, userImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pincode) return;

    setIsGeocoding(true);
    try {
      // Nominatim for Geocoding (Indian context assumed)
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${formData.pincode},India`);
      const results = await response.json();
      
      if (results && results.length > 0) {
        const { lat, lon } = results[0];
        const newEntry: DeliveryEntry = {
          id: Date.now().toString(),
          name: formData.name,
          coords: [parseFloat(lat), parseFloat(lon)],
          productId: 'custom',
          productName: formData.productName,
          productImageUrl: formData.userImage,
          productLink: formData.productLink,
          review: formData.review,
          rating: formData.rating,
          price: 'N/A',
          userImage: formData.userImage
        };

        setData(prev => [...prev, newEntry]);
        setIsAdminOpen(false);
        setFormData({
          name: '',
          pincode: '',
          productName: '',
          productLink: '',
          review: '',
          rating: 5,
          userImage: ''
        });
        
        // Pan to new marker
        mapRef.current?.flyTo([parseFloat(lat), parseFloat(lon)], 12);
      } else {
        alert("Could not find location for this pincode.");
      }
    } catch (err) {
      console.error(err);
      alert("Error finding location.");
    } finally {
      setIsGeocoding(false);
    }
  };

  const clearData = () => {
    if(window.confirm("Are you sure you want to clear all custom entries?")) {
        setData(initialDeliveryData);
        localStorage.removeItem('qamell_map_data');
    }
  }

  return (
    <>
      {/* Admin FAB is now ONLY visible if authorized via secret */}
      {isAdminAuthorized && (
        <button className="admin-fab" onClick={() => setIsAdminOpen(true)} title="Open Admin Panel">
          <span className="material-icons">admin_panel_settings</span>
        </button>
      )}

      <div className={`admin-panel ${isAdminOpen ? 'open' : ''}`}>
        <div className="admin-header">
          <h3>Admin: Add Review</h3>
          <button className="close-btn" onClick={() => setIsAdminOpen(false)}>
            <span className="material-icons">close</span>
          </button>
        </div>
        
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Customer Name</label>
            <input 
              type="text" 
              required 
              value={formData.name}
              onChange={e => setFormData(p => ({...p, name: e.target.value}))}
              placeholder="e.g. Rahul Verma"
            />
          </div>

          <div className="form-group">
            <label>Pincode</label>
            <input 
              type="text" 
              required 
              value={formData.pincode}
              onChange={e => setFormData(p => ({...p, pincode: e.target.value}))}
              placeholder="e.g. 110001"
            />
          </div>

          <div className="form-group">
            <label>Product Name</label>
            <input 
              type="text" 
              required 
              value={formData.productName}
              onChange={e => setFormData(p => ({...p, productName: e.target.value}))}
              placeholder="e.g. Floral Summer Dress"
            />
          </div>

          <div className="form-group">
            <label>Product Link</label>
            <input 
              type="url" 
              required 
              value={formData.productLink}
              onChange={e => setFormData(p => ({...p, productLink: e.target.value}))}
              placeholder="https://..."
            />
          </div>

          <div className="form-group">
            <label>Rating (1-5)</label>
            <div className="rating-selector">
              {[1,2,3,4,5].map(star => (
                <span 
                  key={star}
                  className="material-icons"
                  style={{ color: star <= formData.rating ? '#FFC107' : '#ddd', cursor: 'pointer' }}
                  onClick={() => setFormData(p => ({...p, rating: star}))}
                >
                  {star <= formData.rating ? 'star' : 'star_border'}
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Review Comment</label>
            <textarea 
              required 
              value={formData.review}
              onChange={e => setFormData(p => ({...p, review: e.target.value}))}
              rows={3}
              placeholder="Tell us about the product..."
            />
          </div>

          <div className="form-group">
            <label>Upload Photo</label>
            <div className="upload-box">
               <input type="file" accept="image/*" onChange={handleFileChange} id="file-upload" />
               <label htmlFor="file-upload" className="upload-label">
                 <span className="material-icons">cloud_upload</span>
                 {formData.userImage ? 'Image Selected' : 'Choose a file'}
               </label>
            </div>
            {formData.userImage && <img src={formData.userImage} className="preview-img" alt="Preview" />}
          </div>

          <button type="submit" className="submit-btn" disabled={isGeocoding}>
            {isGeocoding ? 'Locating...' : 'Save to Map'}
          </button>

          <button type="button" className="clear-btn" onClick={clearData}>
             Reset Map Data
          </button>
        </form>
      </div>
    </>
  );
};

const container = document.getElementById('root');
if(container) {
    const root = createRoot(container);
    root.render(<App />);
}
