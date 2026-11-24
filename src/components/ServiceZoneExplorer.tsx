import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Crosshair,
  MapPin,
  Navigation,
  Route,
  Search,
} from 'lucide-react';
import type { BusinessConfig, PlantLocation } from '../types/index.ts';
import { PlantMap } from './PlantMap.tsx';
import {
  SERVICE_TOWN_PRESETS,
  SERVICE_ZONE_INFO,
  evaluateDeliveryFeasibility,
  type ZoneFocus,
} from '../utils/serviceZones.ts';

interface ServiceZoneExplorerProps {
  biz: BusinessConfig;
  plantLocations: PlantLocation[];
  mapHeightClass?: string;
}

const ZONE_TABS: Array<{ id: ZoneFocus; label: string }> = [
  { id: 'all', label: 'All Coverage' },
  { id: 'kotihal', label: 'Ranebennur Zone' },
  { id: 'davangere', label: 'Davangere Zone' },
];

export function ServiceZoneExplorer({
  biz,
  plantLocations,
  mapHeightClass = 'h-[400px] lg:h-[440px]',
}: ServiceZoneExplorerProps) {
  const [zoneFocus, setZoneFocus] = useState<ZoneFocus>('all');
  const [townFilter, setTownFilter] = useState('');
  const [checkedSite, setCheckedSite] = useState<{
    lat: number;
    lng: number;
    label: string;
  }>({
    lat: 14.6197,
    lng: 75.6295,
    label: 'Ranebennur',
  });
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const visibleTowns = useMemo(() => {
    const q = townFilter.trim().toLowerCase();
    return SERVICE_TOWN_PRESETS.filter((town) => {
      if (zoneFocus !== 'all' && town.zoneGroup !== zoneFocus && !q) {
        return false;
      }
      if (!q) return true;
      return (
        town.name.toLowerCase().includes(q) ||
        town.district.toLowerCase().includes(q) ||
        town.note.toLowerCase().includes(q)
      );
    });
  }, [zoneFocus, townFilter]);

  const evaluation = useMemo(
    () =>
      evaluateDeliveryFeasibility(
        checkedSite.lat,
        checkedSite.lng,
        plantLocations,
        checkedSite.label
      ),
    [checkedSite, plantLocations]
  );

  function handleZoneChange(nextFocus: ZoneFocus) {
    setZoneFocus(nextFocus);
    if (nextFocus === 'kotihal') {
      setCheckedSite({ lat: 14.6197, lng: 75.6295, label: 'Ranebennur' });
    } else if (nextFocus === 'davangere') {
      setCheckedSite({ lat: 14.4644, lng: 75.9218, label: 'Davangere City' });
    }
  }

  function handleCheckGps() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsError('Location lookup is unavailable in this browser. Select a town or tap the map.');
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        setCheckedSite({
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5)),
          label: 'Your Current GPS Site',
        });
      },
      () => {
        setGpsLoading(false);
        setGpsError('Could not read GPS position. Choose a town below or click directly on the map.');
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  }

  const bookHref = evaluation
    ? `/book?plant=${encodeURIComponent(evaluation.nearest.plant.id)}&city=${encodeURIComponent(
        evaluation.siteLabel
      )}&lat=${encodeURIComponent(String(evaluation.siteLat))}&lng=${encodeURIComponent(
        String(evaluation.siteLng)
      )}`
    : '/book';

  return (
    <div className="space-y-5">
      {/* Interactive Toolbar: Zone Switcher + Town Filter + GPS Verify */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-[18px] bg-[var(--surface)] border border-[#D7E4FF] dark:border-[#264096] p-3 sm:p-4">
        <div
          role="tablist"
          aria-label="Filter service zones"
          className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#EAF1FF] dark:bg-[#0F1F5C]"
        >
          {ZONE_TABS.map((tab) => {
            const active = zoneFocus === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleZoneChange(tab.id)}
                className={`px-3.5 py-2 min-h-[40px] rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#1F3FA8] text-white shadow-sm'
                    : 'text-[#0F1F5C] dark:text-slate-200 hover:bg-white/70 dark:hover:bg-[#152972]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 lg:max-w-md">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={townFilter}
              onChange={(e) => setTownFilter(e.target.value)}
              placeholder="Filter town (e.g. Harihar, Byadgi, Haveri)..."
              aria-label="Filter service towns"
              className="w-full pl-8 pr-3 py-2 min-h-[42px] rounded-xl bg-[var(--bg)] border border-[#D7E4FF] dark:border-[#264096] text-xs text-[#0F1F5C] dark:text-white placeholder:text-[var(--muted)] focus:outline-none focus:border-[#1F3FA8]"
            />
          </div>
          <button
            type="button"
            onClick={handleCheckGps}
            disabled={gpsLoading}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[42px] rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] hover:border-[#D92B25] text-xs font-semibold text-[#0F1F5C] dark:text-white whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:opacity-60"
          >
            <Crosshair className="w-3.5 h-3.5 text-[#D92B25]" />
            <span>{gpsLoading ? 'Locating…' : 'Check My GPS'}</span>
          </button>
        </div>
      </div>

      {gpsError && (
        <p className="text-xs text-amber-700 dark:text-amber-300 px-1" role="status">
          {gpsError}
        </p>
      )}

      {/* Quick Locality Buttons */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
          <span>Select a service hub or click anywhere on the map to verify delivery feasibility:</span>
          <span className="tabular-nums">
            Showing {visibleTowns.length} {visibleTowns.length === 1 ? 'locality' : 'localities'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {visibleTowns.map((town) => {
            const isSelected =
              Math.abs(checkedSite.lat - town.lat) < 0.0005 &&
              Math.abs(checkedSite.lng - town.lng) < 0.0005;
            return (
              <button
                key={town.id}
                type="button"
                onClick={() =>
                  setCheckedSite({ lat: town.lat, lng: town.lng, label: town.name })
                }
                className={`inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-lg border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-[#0F1F5C] text-white border-[#0F1F5C] dark:bg-[#FFC93C] dark:text-[#0F1F5C] dark:border-[#FFC93C]'
                    : 'bg-[var(--surface)] text-[#0F1F5C] dark:text-slate-200 border-[#D7E4FF] dark:border-[#264096] hover:border-[#D92B25]'
                }`}
              >
                <MapPin
                  className={`w-3 h-3 shrink-0 ${
                    isSelected
                      ? 'text-[#FFC93C] dark:text-[#0F1F5C]'
                      : town.zoneGroup === 'kotihal'
                        ? 'text-[#1F3FA8] dark:text-[#FFC93C]'
                        : 'text-[#D92B25]'
                  }`}
                />
                <span>{town.name}</span>
              </button>
            );
          })}
          {visibleTowns.length === 0 && (
            <p className="text-xs text-[var(--muted)] py-1">
              No matching town preset — click directly anywhere on the Leaflet map to check exact site coordinates.
            </p>
          )}
        </div>
      </div>

      {/* Main Split: Leaflet Map + Live Delivery Feasibility Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 space-y-2.5">
          <PlantMap
            plantLat={biz.plantLat}
            plantLng={biz.plantLng}
            serviceRadiusKm={biz.serviceRadiusKm}
            plantName={biz.businessName}
            plantAddress={biz.address}
            locations={plantLocations}
            showServiceZones
            zoneFocus={zoneFocus}
            checkedSite={checkedSite}
            onCheckSite={(lat, lng, label) =>
              setCheckedSite({ lat, lng, label: label || `${lat.toFixed(4)}, ${lng.toFixed(4)}` })
            }
            deliveryFees={{
              baseDeliveryFee: biz.baseDeliveryFee,
              perKmRate: biz.perKmRate,
              freeRadiusKm: biz.freeRadiusKm,
            }}
            googleMapsUrl={biz.googleMapsUrl}
            heightClass={mapHeightClass}
          />

          {/* Clean unboxed Legend */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] text-[var(--muted)] px-1">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#1F3FA8] inline-block shrink-0" />
              <span>Kotihal Unit · Ranebennur Zone (≤50 km)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#D92B25] inline-block shrink-0" />
              <span>Davangere Unit · Davangere Zone (≤50 km)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#FFC93C] border border-[#0F1F5C] inline-block shrink-0" />
              <span>Checked Site &amp; Nearest Plant Route</span>
            </span>
          </div>
        </div>

        {/* Live Feasibility Panel */}
        <div className="lg:col-span-5">
          {evaluation && (
            <div className="warm-card p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    {evaluation.feasible ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    )}
                    <span
                      className={
                        evaluation.feasible
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-amber-700 dark:text-amber-300'
                      }
                    >
                      {evaluation.tierTitle}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-[#0F1F5C] dark:text-white truncate">
                    {evaluation.siteLabel}
                  </h3>
                  <p className="text-[11px] text-[var(--muted)] tabular-nums">
                    Coordinates: {evaluation.siteLat}, {evaluation.siteLng}
                  </p>
                </div>
              </div>

              <p className="text-xs text-[var(--muted)] leading-relaxed">
                {evaluation.tierSummary}
              </p>

              {/* Key Feasibility Metrics */}
              <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-[#EAF1FF] dark:border-[#264096]">
                <div className="space-y-0.5">
                  <p className="text-[11px] text-[var(--muted)]">Nearest Unit</p>
                  <p className="font-display font-bold text-sm text-[#0F1F5C] dark:text-white truncate">
                    {evaluation.nearest.plant.shortLabel || evaluation.nearest.plant.city}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] text-[var(--muted)] flex items-center gap-1">
                    <Route className="w-3 h-3 shrink-0" />
                    <span>Est. Road</span>
                  </p>
                  <p className="font-display font-bold text-sm text-[#0F1F5C] dark:text-white tabular-nums">
                    ~{evaluation.nearest.roadKm} km
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] text-[var(--muted)] flex items-center gap-1">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>Mixer ETA</span>
                  </p>
                  <p className="font-display font-bold text-sm text-[#0F1F5C] dark:text-white tabular-nums">
                    ~{evaluation.nearest.etaMin} min
                  </p>
                </div>
              </div>

              {/* Zone Timeframe & Surcharge Summary */}
              {(() => {
                const activeZoneKey =
                  evaluation.nearest.plant.id === 'davangere' ? 'davangere' : 'kotihal';
                const zInfo = SERVICE_ZONE_INFO[activeZoneKey];
                return (
                  <div className="rounded-xl bg-[#F4F8FF] dark:bg-[#0F1F5C]/70 border border-[#D7E4FF] dark:border-[#264096] p-3 space-y-1 text-xs">
                    <p className="font-semibold text-[#0F1F5C] dark:text-[#FFC93C]">
                      {zInfo.zoneName} · {zInfo.deliveryTimeframe}
                    </p>
                    <p className="text-[var(--muted)]">{zInfo.coreSurcharge}</p>
                    <p className="text-[var(--muted)]">{zInfo.extendedSurcharge}</p>
                  </div>
                );
              })()}

              {/* Dual-Plant Comparison */}
              <div className="space-y-2 pt-2 border-t border-[#EAF1FF] dark:border-[#264096]">
                <p className="text-[11px] font-semibold text-[#0F1F5C] dark:text-slate-200">
                  Distance from Batching Units
                </p>
                <div className="space-y-1.5">
                  {evaluation.allPlants.map((entry, idx) => {
                    const isRed =
                      entry.plant.pinColor === 'red' ||
                      (!entry.plant.isPrimary && entry.plant.pinColor !== 'blue');
                    return (
                      <div
                        key={entry.plant.id}
                        className="flex items-center justify-between gap-2 text-xs py-1"
                      >
                        <span className="inline-flex items-center gap-2 min-w-0">
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              isRed ? 'bg-[#D92B25]' : 'bg-[#1F3FA8]'
                            }`}
                          />
                          <span className="font-medium text-[#0F1F5C] dark:text-white truncate">
                            {entry.plant.shortLabel || entry.plant.city} Unit
                            {idx === 0 ? ' (Recommended)' : ''}
                          </span>
                        </span>
                        <span className="tabular-nums text-[var(--muted)] shrink-0">
                          {entry.straightKm} km direct · {entry.withinRadius ? 'In Zone' : 'Extended'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-[#EAF1FF] dark:border-[#264096] space-y-3">
                <p className="text-xs text-[#0F1F5C] dark:text-slate-200 font-medium">
                  {evaluation.dispatchRecommendation}
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {evaluation.feasible ? (
                    <Link to={bookHref} className="btn-orange-pill px-4 py-2.5 text-xs">
                      <Navigation className="w-3.5 h-3.5" />
                      <span>
                        Book from {evaluation.nearest.plant.shortLabel || evaluation.nearest.plant.city}
                      </span>
                    </Link>
                  ) : (
                    <Link to="/quote" className="btn-orange-pill px-4 py-2.5 text-xs">
                      <span>Request Bulk Distance Quote</span>
                    </Link>
                  )}
                  <Link
                    to={evaluation.feasible ? '/quote' : bookHref}
                    className="inline-flex items-center justify-center rounded-full border border-[#D7E4FF] dark:border-[#264096] px-4 py-2.5 text-xs font-semibold hover:border-[#D92B25] transition-colors"
                  >
                    {evaluation.feasible ? 'Get Custom Quote' : 'Continue to Booking'}
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
