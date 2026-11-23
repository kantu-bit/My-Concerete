import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import type { PlantLocation } from '../types/index.ts';
import { CallPopupModal, formatTelHref, isDesktopOrIframe } from './ContactLinks.tsx';
import { buildWhatsAppUrl } from '../utils/documents.ts';
import {
  DAVANGERE_ZONE_POLYGON,
  RANEBENNUR_ZONE_POLYGON,
  SERVICE_TOWN_PRESETS,
  evaluateDeliveryFeasibility,
  type ZoneFocus,
} from '../utils/serviceZones.ts';

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
  showServiceZones?: boolean;
  zoneFocus?: ZoneFocus;
  checkedSite?: { lat: number; lng: number; label?: string } | null;
  onCheckSite?: (lat: number, lng: number, label?: string) => void;
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
  showServiceZones,
  zoneFocus = 'all',
  checkedSite,
  onCheckSite,
  googleMapsUrl,
  heightClass = 'h-80',
}: PlantMapProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const siteMarkerRef = useRef<L.CircleMarker | null>(null);
  const feasibilityLayerRef = useRef<L.LayerGroup | null>(null);
  const zoneOverlayLayerRef = useRef<L.LayerGroup | null>(null);
  const onCheckSiteRef = useRef(onCheckSite);
  onCheckSiteRef.current = onCheckSite;

  const [popupCallData, setPopupCallData] = useState<{
    phoneDisplay: string;
    whatsappDisplay: string;
  } | null>(null);

  const effectiveLocations: PlantLocation[] = useMemo(() => {
    if (locations && locations.length > 0) return locations;
    return [
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
  }, [locations, plantName, plantAddress, plantLat, plantLng, serviceRadiusKm, googleMapsUrl]);

  const locationsKey = JSON.stringify(effectiveLocations);
  const renderZones = showServiceZones ?? !selectable;

  useEffect(() => {
    if (!containerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

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

    const zoneOverlayGroup = L.layerGroup().addTo(map);
    zoneOverlayLayerRef.current = zoneOverlayGroup;

    const feasibilityGroup = L.layerGroup().addTo(map);
    feasibilityLayerRef.current = feasibilityGroup;

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

      const marker = L.marker([loc.lat, loc.lng], { icon: pinIcon, zIndexOffset: 300 }).addTo(map);

      const safeMapsUrl =
        loc.googleMapsUrl && /^https?:\/\//i.test(loc.googleMapsUrl)
          ? loc.googleMapsUrl
          : `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`;

      const badgeBg = isRed ? '#D92B25' : '#1F3FA8';
      const badgeText = isRed ? `${escapeHtml(loc.shortLabel || 'Plant')} Unit` : 'MC Main Plant';
      const phoneStr = loc.phone || '+91 73378 07372';
      const waStr = loc.whatsapp || loc.phone || '+91 73378 07372';
      const telHref = normalizeTelHref(phoneStr);
      const bookUrl = `/book?plant=${encodeURIComponent(loc.id)}`;

      marker.bindPopup(
        `<div style="font-family:sans-serif;font-size:12px;line-height:1.45;min-width:215px;max-width:260px;">
          <div style="display:inline-block;background:${badgeBg};color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:6px;margin-bottom:5px;">${badgeText}</div>
          <div style="font-weight:700;color:#0F1F5C;font-size:13px;margin-bottom:3px;">${escapeHtml(loc.name)}</div>
          <div style="color:#475569;margin-bottom:4px;">${escapeHtml(loc.address)}</div>
          <div style="color:#059669;font-weight:600;margin-bottom:4px;">${escapeHtml(loc.hours || 'Open 24 Hours (All Days)')}</div>
          <div style="margin-bottom:8px;">
            <a href="${escapeHtml(telHref)}" target="_top" rel="noopener" data-phone="${escapeHtml(phoneStr)}" data-whatsapp="${escapeHtml(waStr)}" class="mc-popup-tel-link" style="display:inline-flex;align-items:center;min-height:44px;color:#1F3FA8;font-weight:700;cursor:pointer;text-decoration:underline;">&#128222; ${escapeHtml(phoneStr)}</a>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;padding-top:6px;border-top:1px solid #E2E8F0;">
            <a href="${escapeHtml(safeMapsUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:5px 9px;border-radius:8px;border:1px solid #CBD5E1;color:#0F1F5C;font-weight:600;font-size:11px;text-decoration:none;">Get Directions</a>
            <a href="${escapeHtml(bookUrl)}" data-book-plant="${escapeHtml(loc.id)}" class="mc-popup-book-link" style="display:inline-block;padding:5px 10px;border-radius:8px;background:#D92B25;color:#FFFFFF;font-weight:700;font-size:11px;text-decoration:none;">Book Delivery from this plant</a>
          </div>
        </div>`,
        { maxWidth: 280 }
      );

      // Outer 50 km radius ring (always rendered for clear service boundary reference)
      const circleColor = isRed ? '#D92B25' : '#1F3FA8';
      L.circle([loc.lat, loc.lng], {
        radius: (loc.serviceRadiusKm || serviceRadiusKm || 50) * 1000,
        color: circleColor,
        weight: isSelected || effectiveLocations.length === 1 ? 2 : 1.5,
        dashArray: '6 6',
        fillColor: circleColor,
        fillOpacity: isSelected ? 0.08 : 0.03,
        interactive: false,
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
      const telLinks = popupEl.querySelectorAll<HTMLAnchorElement>('.mc-popup-tel-link');
      telLinks.forEach((link) => {
        link.addEventListener('click', (e) => {
          if (isDesktopOrIframe()) {
            e.preventDefault();
            const phoneDisplay = link.getAttribute('data-phone') || '+91 73378 07372';
            const whatsappDisplay = link.getAttribute('data-whatsapp') || phoneDisplay;
            setPopupCallData({ phoneDisplay, whatsappDisplay });
          }
        });
      });
    });

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
    } else {
      // Allow clicking anywhere on the map to verify delivery feasibility when handler is supplied
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (!onCheckSiteRef.current) return;
        const { lat, lng } = e.latlng;
        onCheckSiteRef.current(
          Number(lat.toFixed(5)),
          Number(lng.toFixed(5)),
          `Pinned Site (${lat.toFixed(4)}, ${lng.toFixed(4)})`
        );
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
      feasibilityLayerRef.current = null;
      zoneOverlayLayerRef.current = null;
    };
  }, [
    plantLat,
    plantLng,
    serviceRadiusKm,
    locationsKey,
    activePlantId,
    selectable,
    googleMapsUrl,
    navigate,
  ]);

  // Render & dynamically highlight Primary Service Zones (Ranebennur + Davangere) & clickable hub towns
  useEffect(() => {
    const map = mapRef.current;
    const zoneLayer = zoneOverlayLayerRef.current;
    if (!map || !zoneLayer) return;

    zoneLayer.clearLayers();
    if (!renderZones) return;

    const showKotihal = zoneFocus === 'all' || zoneFocus === 'kotihal';
    const showDavangere = zoneFocus === 'all' || zoneFocus === 'davangere';

    // 1. Primary corridor polygons
    const ranebennurPoly = L.polygon(RANEBENNUR_ZONE_POLYGON, {
      color: '#1F3FA8',
      weight: zoneFocus === 'kotihal' ? 2.5 : 1.5,
      dashArray: zoneFocus === 'kotihal' ? undefined : '4 4',
      fillColor: '#1F3FA8',
      fillOpacity: showKotihal ? (zoneFocus === 'kotihal' ? 0.16 : 0.1) : 0.02,
      interactive: true,
    }).addTo(zoneLayer);
    ranebennurPoly.bindTooltip(
      '<strong>Ranebennur – Kotihal Primary Service Zone</strong><br/>Express &amp; Standard 2-hr RMC Dispatch',
      { sticky: true }
    );
    ranebennurPoly.on('click', (evt: L.LeafletMouseEvent) => {
      if (!onCheckSiteRef.current) return;
      L.DomEvent.stopPropagation(evt);
      const { lat, lng } = evt.latlng;
      onCheckSiteRef.current(
        Number(lat.toFixed(5)),
        Number(lng.toFixed(5)),
        `Pinned Site (${lat.toFixed(4)}, ${lng.toFixed(4)})`
      );
    });

    const davangerePoly = L.polygon(DAVANGERE_ZONE_POLYGON, {
      color: '#D92B25',
      weight: zoneFocus === 'davangere' ? 2.5 : 1.5,
      dashArray: zoneFocus === 'davangere' ? undefined : '4 4',
      fillColor: '#D92B25',
      fillOpacity: showDavangere ? (zoneFocus === 'davangere' ? 0.15 : 0.09) : 0.02,
      interactive: true,
    }).addTo(zoneLayer);
    davangerePoly.bindTooltip(
      '<strong>Davangere Primary Service Zone</strong><br/>Smart City, Harihar &amp; Karur Industrial Dispatch',
      { sticky: true }
    );
    davangerePoly.on('click', (evt: L.LeafletMouseEvent) => {
      if (!onCheckSiteRef.current) return;
      L.DomEvent.stopPropagation(evt);
      const { lat, lng } = evt.latlng;
      onCheckSiteRef.current(
        Number(lat.toFixed(5)),
        Number(lng.toFixed(5)),
        `Pinned Site (${lat.toFixed(4)}, ${lng.toFixed(4)})`
      );
    });

    // 2. Express (15 km) & Primary (32 km) inner rings around active plants
    for (const loc of effectiveLocations) {
      if (!Number.isFinite(loc.lat) || !Number.isFinite(loc.lng)) continue;
      const isRed = loc.pinColor === 'red' || (!loc.isPrimary && loc.pinColor !== 'blue');
      const color = isRed ? '#D92B25' : '#1F3FA8';
      const focused =
        zoneFocus === 'all' ||
        (zoneFocus === 'kotihal' && !isRed) ||
        (zoneFocus === 'davangere' && isRed);

      // 15 km Express Core
      L.circle([loc.lat, loc.lng], {
        radius: 15000,
        color,
        weight: focused ? 1.5 : 1,
        fillColor: color,
        fillOpacity: focused ? 0.13 : 0.03,
        interactive: false,
      }).addTo(zoneLayer);

      // 32 km Primary Service Belt
      L.circle([loc.lat, loc.lng], {
        radius: 32000,
        color,
        weight: 1,
        dashArray: '3 5',
        fillColor: color,
        fillOpacity: focused ? 0.04 : 0.01,
        interactive: false,
      }).addTo(zoneLayer);
    }

    // 3. Key service towns along Ranebennur & Davangere corridors
    for (const town of SERVICE_TOWN_PRESETS) {
      const matchesFocus = zoneFocus === 'all' || town.zoneGroup === zoneFocus;
      const dotColor = town.zoneGroup === 'kotihal' ? '#1F3FA8' : '#D92B25';
      const tMarker = L.circleMarker([town.lat, town.lng], {
        radius: matchesFocus ? 6 : 4,
        fillColor: '#FFC93C',
        color: dotColor,
        weight: matchesFocus ? 2 : 1,
        opacity: matchesFocus ? 1 : 0.45,
        fillOpacity: matchesFocus ? 0.95 : 0.35,
      }).addTo(zoneLayer);

      tMarker.bindTooltip(`${town.name}`, { direction: 'top', offset: [0, -6] });

      if (onCheckSiteRef.current) {
        tMarker.on('click', (evt) => {
          L.DomEvent.stopPropagation(evt);
          onCheckSiteRef.current?.(town.lat, town.lng, town.name);
        });
      } else {
        tMarker.bindPopup(
          `<div style="font-family:sans-serif;font-size:12px;">
            <strong style="color:#0F1F5C;">${escapeHtml(town.name)}</strong><br/>
            <span style="color:#475569;">${escapeHtml(town.note)}</span>
          </div>`
        );
      }
    }
  }, [renderZones, zoneFocus, effectiveLocations]);

  // Smoothly frame map when zoneFocus changes (unless user just pinned a custom site)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || selectable) return;

    if (zoneFocus === 'kotihal') {
      map.fitBounds(L.latLngBounds(RANEBENNUR_ZONE_POLYGON), { padding: [36, 36], maxZoom: 11 });
    } else if (zoneFocus === 'davangere') {
      map.fitBounds(L.latLngBounds(DAVANGERE_ZONE_POLYGON), { padding: [36, 36], maxZoom: 11 });
    } else if (effectiveLocations.length >= 2) {
      const pts: Array<[number, number]> = effectiveLocations.map((l) => [l.lat, l.lng]);
      // Include Ranebennur town so full corridor stays centered cleanly
      pts.push([14.6197, 75.6295]);
      map.fitBounds(L.latLngBounds(pts), { padding: [52, 52], maxZoom: 11 });
    }
  }, [zoneFocus, selectable, effectiveLocations]);

  // Draw checked site pin + dashed route line to nearest MY CONCRETE batching unit
  useEffect(() => {
    const map = mapRef.current;
    const fLayer = feasibilityLayerRef.current;
    if (!map || !fLayer) return;

    fLayer.clearLayers();
    if (!checkedSite || !Number.isFinite(checkedSite.lat) || !Number.isFinite(checkedSite.lng)) {
      return;
    }

    const evalResult = evaluateDeliveryFeasibility(
      checkedSite.lat,
      checkedSite.lng,
      effectiveLocations,
      checkedSite.label
    );
    if (!evalResult) return;

    const { nearest, feasible } = evalResult;
    const lineColor = feasible ? '#059669' : '#D97706';

    // Route line between nearest unit & checked site
    L.polyline(
      [
        [nearest.plant.lat, nearest.plant.lng],
        [checkedSite.lat, checkedSite.lng],
      ],
      {
        color: lineColor,
        weight: 3,
        dashArray: '7 6',
        opacity: 0.9,
      }
    ).addTo(fLayer);

    // Checked site target pin
    const targetIcon = L.divIcon({
      className: 'mc-site-check-pin',
      html: `<div style="width:28px;height:28px;border-radius:9999px;background:#FFC93C;border:3px solid #0F1F5C;box-shadow:0 4px 12px rgba(15,31,92,0.4);display:flex;align-items:center;justify-content:center;">
        <span style="width:8px;height:8px;border-radius:9999px;background:#0F1F5C;display:block;"></span>
      </div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
    });

    const sitePin = L.marker([checkedSite.lat, checkedSite.lng], {
      icon: targetIcon,
      zIndexOffset: 500,
    }).addTo(fLayer);

    const statusBadge = feasible ? 'Feasible Dispatch' : 'Custom Quote Required';
    const badgeColor = feasible ? '#059669' : '#D97706';

    sitePin.bindPopup(
      `<div style="font-family:sans-serif;font-size:12px;line-height:1.45;min-width:200px;">
        <div style="display:inline-block;background:${badgeColor};color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:6px;margin-bottom:4px;">${statusBadge}</div>
        <div style="font-weight:700;color:#0F1F5C;">${escapeHtml(evalResult.siteLabel)}</div>
        <div style="color:#475569;margin-top:2px;">Nearest: <strong>${escapeHtml(nearest.plant.shortLabel || nearest.plant.city)}</strong></div>
        <div style="color:#0F1F5C;font-weight:600;margin-top:2px;">${nearest.straightKm} km direct (~${nearest.roadKm} km road · ~${nearest.etaMin} min)</div>
      </div>`,
      { maxWidth: 250 }
    );
    sitePin.openPopup();
  }, [checkedSite, effectiveLocations]);

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
      <CallPopupModal
        open={!!popupCallData}
        onClose={() => setPopupCallData(null)}
        phoneDisplay={popupCallData?.phoneDisplay || '+91 73378 07372'}
        whatsappHref={buildWhatsAppUrl(
          popupCallData?.whatsappDisplay || popupCallData?.phoneDisplay || '+91 73378 07372'
        )}
        telHref={formatTelHref(popupCallData?.phoneDisplay || '+91 73378 07372')}
      />
    </div>
  );
}
