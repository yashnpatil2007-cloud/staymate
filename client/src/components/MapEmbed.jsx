import { useState } from 'react';
import { Crosshair, ExternalLink, MapPin } from 'lucide-react';
import { distanceInKm, getCurrentPosition } from '../utils/geolocation';

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export default function MapEmbed({ coords, name, city, area, address }) {
  const [distance, setDistance] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const lat = Number(coords?.lat);
  const lng = Number(coords?.lng);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0;

  const calculateDistance = async () => {
    setLocationError('');
    setLocating(true);
    try {
      const position = await getCurrentPosition();
      const km = distanceInKm(position.latitude, position.longitude, lat, lng);
      setDistance(km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);
    } catch (error) {
      setLocationError(error.message);
    } finally {
      setLocating(false);
    }
  };

  if (!hasCoords) {
    return (
      <div className="map-frame">
        <div className="map-fallback">
          <MapPin size={28} className="muted" />
          <strong>Exact map location not provided</strong>
          <p>
            {area ? `${area}, ` : ''}
            {city} {address ? `· ${address}` : ''}. Ask the provider for precise directions
            through the enquiry form.
          </p>
        </div>
      </div>
    );
  }

  const bbox = [lng - 0.007, lat - 0.005, lng + 0.007, lat + 0.005].join('%2C');
  const osmSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
  const googleSrc = `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_KEY}&q=${lat},${lng}&zoom=15`;
  const externalUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;

  return (
    <>
      <div className="map-frame">
        <iframe
          title={`Map showing ${name || 'listing'} in ${area || city}`}
          src={GOOGLE_KEY ? googleSrc : osmSrc}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <div className="map-distance">
        <span className="badge badge-teal">{GOOGLE_KEY ? 'Google Maps' : 'OpenStreetMap'}</span>
        <button type="button" className="btn btn-outline btn-sm" onClick={calculateDistance} disabled={locating}>
          <Crosshair size={13} /> {locating ? 'Locating…' : 'Distance from me'}
        </button>
        <a href={externalUrl} target="_blank" rel="noreferrer" className="link-arrow" style={{ fontSize: '0.76rem' }}>
          Open map <ExternalLink size={13} />
        </a>
        {distance && <span>Approx. <strong>{distance}</strong> straight-line distance from your current location.</span>}
        {locationError && <span className="field-error">{locationError}</span>}
      </div>
    </>
  );
}
