import { useEffect, useRef } from 'react';
import L from 'leaflet';

interface PlantMapProps {
  plantLat: number;
  plantLng: number;
  serviceRadiusKm: number;
  plantName: string;
  plantAddress: string;
  selectable?: boolean;
  siteLat?: number;
  siteLng?: number;
  onSelectLocation?: (lat: number, lng: number) => void;
  googleMapsUrl?: string;
  heightClass?: string;
}

export function PlantMap({
  plantLat,
  plantLng,
  serviceRadiusKm,
  plantName,
  plantAddress,
  selectable = false,
  siteLat,
  siteLng,
  onSelectLocation,
  googleMapsUrl,
  heightClass = 'h-80',
}: PlantMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const siteMarkerRef = useRef<L.CircleMarker | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const centerLat = selectable && siteLat ? siteLat : plantLat;
    const centerLng = selectable && siteLng ? siteLng : plantLng;

    const map = L.map(containerRef.current, {
      center: [centerLat, centerLng],
      zoom: selectable ? 10 : 10,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    // Kotihal Plant Pin
    const plantMarker = L.circleMarker([plantLat, plantLng], {
      radius: 10,
      fillColor: '#0F1F5C',
      color: '#D92B25',
      weight: 3,
      opacity: 1,
      fillOpacity: 1,
    }).addTo(map);

    const safeMapsUrl =
      googleMapsUrl && /^https?:\/\//i.test(googleMapsUrl) ? googleMapsUrl : '';
    const mapsPopupLink = safeMapsUrl
      ? `<br/><a href="${safeMapsUrl}" target="_blank" rel="noreferrer" style="color:#1F3FA8;font-weight:600;text-decoration:underline;display:inline-block;margin-top:4px;">Open in Google Maps &rarr;</a>`
      : '';

    plantMarker.bindPopup(
      `<div style="font-family:sans-serif;font-size:12px;"><strong>${plantName}</strong><br/>${plantAddress}${mapsPopupLink}</div>`
    );

    // Service radius ring
    L.circle([plantLat, plantLng], {
      radius: serviceRadiusKm * 1000,
      color: '#1F3FA8',
      weight: 2,
      dashArray: '6 6',
      fillColor: '#1F3FA8',
      fillOpacity: 0.08,
    }).addTo(map);

    // Highlight Ranebennur & Davangere regional hubs
    if (!selectable) {
      const hubs = [
        { name: 'Ranebennur Delivery Hub', lat: 14.6197, lng: 75.6295 },
        { name: 'Davangere Delivery Hub', lat: 14.4644, lng: 75.9218 },
      ];
      for (const hub of hubs) {
        L.circleMarker([hub.lat, hub.lng], {
          radius: 7,
          fillColor: '#FFC93C',
          color: '#0F1F5C',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.95,
        })
          .addTo(map)
          .bindPopup(`<div style="font-family:sans-serif;font-size:12px;"><strong>${hub.name}</strong></div>`);
      }
    }

    if (selectable) {
      const initialSiteLat = siteLat ?? 14.6197;
      const initialSiteLng = siteLng ?? 75.6295;

      const sMarker = L.circleMarker([initialSiteLat, initialSiteLng], {
        radius: 9,
        fillColor: '#D92B25',
        color: '#FFFFFF',
        weight: 2.5,
        opacity: 1,
        fillOpacity: 1,
      }).addTo(map);
      sMarker.bindPopup('Delivery Site Pin');
      siteMarkerRef.current = sMarker;

      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        if (siteMarkerRef.current) {
          siteMarkerRef.current.setLatLng([lat, lng]);
        }
        onSelectLocation?.(Number(lat.toFixed(5)), Number(lng.toFixed(5)));
      });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      siteMarkerRef.current = null;
    };
  }, [plantLat, plantLng, serviceRadiusKm, plantName, plantAddress, selectable, googleMapsUrl]);

  useEffect(() => {
    if (selectable && siteMarkerRef.current && siteLat !== undefined && siteLng !== undefined) {
      siteMarkerRef.current.setLatLng([siteLat, siteLng]);
    }
  }, [selectable, siteLat, siteLng]);

  const safeExternalMapsUrl =
    googleMapsUrl && /^https?:\/\//i.test(googleMapsUrl) ? googleMapsUrl : '';

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className={`w-full rounded-[20px] overflow-hidden border border-[#D7E4FF] dark:border-[#264096] ${heightClass}`}
      />
      {safeExternalMapsUrl && !selectable && (
        <a
          href={safeExternalMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="absolute bottom-3 left-3 z-[400] inline-flex items-center gap-1.5 rounded-full bg-white/95 dark:bg-[#0F1F5C]/95 text-[#0F1F5C] dark:text-white border border-[#D7E4FF] dark:border-[#264096] px-3.5 py-1.5 text-xs font-semibold shadow-md hover:border-[#D92B25] transition-colors"
        >
          <span>Open Google Maps Location</span>
          <span aria-hidden="true">&rarr;</span>
        </a>
      )}
    </div>
  );
}
