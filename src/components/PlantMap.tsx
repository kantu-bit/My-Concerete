import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import type { PlantLocation } from '../types/index.ts';

interface PlantMapProps {
  plantLat: number;
  plantLng: number;
  serviceRadiusKm: number;
  plantName: string;
  plantAddress: string;
  locations?: PlantLocation[];
  activePlantId?: string;
  selectable?: boolean;
  siteLat?: number;
  siteLng?: number;
  onSelectLocation?: (lat: number, lng: number) => void;
  googleMapsUrl?: string;
  heightClass?: string;
}

function escapeHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeTelHref(phone: string): string {
  const cleaned = String(phone || '').replace(/[^\d+]/g, '');
  if (!cleaned) return 'tel:+917337807372';
  return cleaned.startsWith('+') ? `tel:${cleaned}` : `tel:+${cleaned}`;
}

export function PlantMap({
  plantLat,
  plantLng,
  serviceRadiusKm,
  plantName,
  plantAddress,
  locations,
  activePlantId,
  selectable = false,
  siteLat,
  siteLng,
  onSelectLocation,
  googleMapsUrl,
  heightClass = 'h-80',
}: PlantMapProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const siteMarkerRef = useRef<L.CircleMarker | null>(null);

  const locationsKey = JSON.stringify(locations || []);

  useEffect(() => {
    if (!containerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const effectiveLocations: PlantLocation[] =
      locations && locations.length > 0
        ? locations
        : [
            {
              id: 'kotihal',
              name: plantName || 'MY CONCRETE – Readymix Concrete Unit (Kotihal)',
              shortLabel: 'Kotihal',
              address: plantAddress || 'FM66+2X6, Kotihal, Karnataka 581119',
              city: 'Ranebennur',
              postalCode: '581119',
              lat: plantLat,
              lng: plantLng,
              phone: '+91 73378 07372',
              whatsapp: '+91 73378 07372',
              hours: 'Open 24 Hours (All Days)',
              serviceRadiusKm: serviceRadiusKm || 50,
              googleMapsUrl:
                googleMapsUrl ||
                `https://www.google.com/maps/dir/?api=1&destination=${plantLat},${plantLng}`,
              pinColor: 'blue',
              isPrimary: true,
            },
          ];

    const primaryLoc = effectiveLocations[0];
    const centerLat = selectable && siteLat ? siteLat : primaryLoc.lat;
    const centerLng = selectable && siteLng ? siteLng : primaryLoc.lng;

    const map = L.map(containerRef.current, {
      center: [centerLat, centerLng],
      zoom: 10,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    const boundsPoints: Array<[number, number]> = [];

    for (const loc of effectiveLocations) {
      if (!Number.isFinite(loc.lat) || !Number.isFinite(loc.lng)) continue;
      boundsPoints.push([loc.lat, loc.lng]);

      const isRed = loc.pinColor === 'red' || (!loc.isPrimary && loc.pinColor !== 'blue');
      const isSelected = activePlantId ? activePlantId === loc.id : false;

      const pinIcon = isRed
        ? L.divIcon({
            className: 'mc-custom-pin',
            html: `<div style="width:32px;height:32px;border-radius:9999px;background:#D92B25;border:3px solid #FFFFFF;box-shadow:0 4px 12px rgba(15,31,92,0.35);display:flex;align-items:center;justify-content:center;position:relative;">
              <span style="width:10px;height:10px;border-radius:9999px;background:#FFFFFF;display:block;"></span>
            </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16],
          })
        : L.divIcon({
            className: 'mc-custom-pin',
            html: `<div style="width:36px;height:36px;border-radius:9999px;background:#1F3FA8;border:3px solid #FFFFFF;box-shadow:0 4px 12px rgba(15,31,92,0.4);display:flex;align-items:center;justify-content:center;color:#FFFFFF;font-weight:800;font-size:11px;font-family:sans-serif;letter-spacing:0.03em;">MC</div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            popupAnchor: [0, -18],
          });

      const marker = L.marker([loc.lat, loc.lng], { icon: pinIcon }).addTo(map);

      const safeMapsUrl =
        loc.googleMapsUrl && /^https?:\/\//i.test(loc.googleMapsUrl)
          ? loc.googleMapsUrl
          : `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`;

      const badgeBg = isRed ? '#D92B25' : '#1F3FA8';
      const badgeText = isRed ? `${escapeHtml(loc.shortLabel || 'Plant')} Unit` : 'MC Main Plant';
      const phoneStr = loc.phone || '+91 73378 07372';
      const telHref = normalizeTelHref(phoneStr);
      const bookUrl = `/book?plant=${encodeURIComponent(loc.id)}`;

      marker.bindPopup(
        `<div style="font-family:sans-serif;font-size:12px;line-height:1.45;min-width:215px;max-width:260px;">
          <div style="display:inline-block;background:${badgeBg};color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:9999px;margin-bottom:5px;">${badgeText}</div>
          <div style="font-weight:700;color:#0F1F5C;font-size:13px;margin-bottom:3px;">${escapeHtml(loc.name)}</div>
          <div style="color:#475569;margin-bottom:4px;">${escapeHtml(loc.address)}</div>
          <div style="color:#059669;font-weight:600;margin-bottom:4px;">${escapeHtml(loc.hours || 'Open 24 Hours (All Days)')}</div>
          <div style="margin-bottom:8px;">
            <a href="${escapeHtml(telHref)}" style="color:#1F3FA8;font-weight:700;text-decoration:none;">&#128222; ${escapeHtml(phoneStr)}</a>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;padding-top:6px;border-top:1px solid #E2E8F0;">
            <a href="${escapeHtml(safeMapsUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:5px 9px;border-radius:9999px;border:1px solid #CBD5E1;color:#0F1F5C;font-weight:600;font-size:11px;text-decoration:none;">Get Directions</a>
            <a href="${escapeHtml(bookUrl)}" data-book-plant="${escapeHtml(loc.id)}" class="mc-popup-book-link" style="display:inline-block;padding:5px 10px;border-radius:9999px;background:#D92B25;color:#FFFFFF;font-weight:700;font-size:11px;text-decoration:none;">Book Delivery from this plant</a>
          </div>
        </div>`,
        { maxWidth: 280 }
      );

      // Service radius ring
      const circleColor = isRed ? '#D92B25' : '#1F3FA8';
      L.circle([loc.lat, loc.lng], {
        radius: (loc.serviceRadiusKm || serviceRadiusKm || 50) * 1000,
        color: circleColor,
        weight: isSelected || effectiveLocations.length === 1 ? 2 : 1.5,
        dashArray: '6 6',
        fillColor: circleColor,
        fillOpacity: isSelected ? 0.1 : effectiveLocations.length === 1 ? 0.08 : 0.04,
      }).addTo(map);
    }

    map.on('popupopen', (evt) => {
      const popupEl = evt.popup.getElement();
      if (!popupEl) return;
      const bookLinks = popupEl.querySelectorAll<HTMLAnchorElement>('.mc-popup-book-link');
      bookLinks.forEach((link) => {
        link.addEventListener('click', (e) => {
          const plantId = link.getAttribute('data-book-plant');
          if (plantId) {
            e.preventDefault();
            navigate(`/book?plant=${encodeURIComponent(plantId)}`);
          }
        });
      });
    });

    // Subtle Ranebennur delivery hub marker (Davangere has its own red Unit pin)
    if (!selectable) {
      L.circleMarker([14.6197, 75.6295], {
        radius: 6,
        fillColor: '#FFC93C',
        color: '#0F1F5C',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.95,
      })
        .addTo(map)
        .bindPopup(
          '<div style="font-family:sans-serif;font-size:12px;"><strong>Ranebennur Delivery Corridor</strong></div>'
        );
    }

    if (selectable) {
      const initialSiteLat = siteLat ?? 14.6197;
      const initialSiteLng = siteLng ?? 75.6295;
      boundsPoints.push([initialSiteLat, initialSiteLng]);

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

    if (boundsPoints.length >= 2) {
      const bounds = L.latLngBounds(boundsPoints);
      map.fitBounds(bounds, { padding: [46, 46], maxZoom: 12 });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      siteMarkerRef.current = null;
    };
  }, [
    plantLat,
    plantLng,
    serviceRadiusKm,
    plantName,
    plantAddress,
    locationsKey,
    activePlantId,
    selectable,
    googleMapsUrl,
    navigate,
  ]);

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
      {safeExternalMapsUrl && !selectable && (!locations || locations.length <= 1) && (
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
