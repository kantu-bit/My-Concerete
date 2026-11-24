import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Blocks,
  Calculator,
  Compass,
  Layers,
  MapPin,
  Navigation,
  Plus,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { useDocumentMeta } from '../utils/seo.ts';
import { ServiceZoneExplorer } from '../components/ServiceZoneExplorer.tsx';
import { CallLink } from '../components/ContactLinks.tsx';
import { CONTACT_CONFIG } from '../config/contact.ts';

type ElementType = 'slab' | 'beam' | 'column' | 'footing' | 'wall';
type UnitType = 'ft' | 'm';

interface CalcLineItem {
  id: number;
  type: ElementType;
  unit: UnitType;
  length: number;
  width: number;
  depthOrHeight: number;
  count: number;
  netM3: number;
}

function toMetres(val: number, unit: UnitType): number {
  return unit === 'ft' ? val * 0.3048 : val;
}

export function VolumeCalculatorPage() {
  const navigate = useNavigate();
  const [elementType, setElementType] = useState<ElementType>('slab');
  const [unit, setUnit] = useState<UnitType>('ft');
  const [length, setLength] = useState('30');
  const [width, setWidth] = useState('40');
  const [depth, setDepth] = useState('0.5');
  const [count, setCount] = useState('1');
  const [wastagePct, setWastagePct] = useState(7);
  const [items, setItems] = useState<CalcLineItem[]>([]);

  useDocumentMeta({
    title: 'Concrete Volume Calculator (m³) | MY CONCRETE Ranebennur & Davangere',
    description:
      'Calculate Ready-Mix Concrete cubic metres for slabs, beams, columns, footings, and walls in feet or metres with 5–10% wastage.',
  });

  const lM = toMetres(Math.max(0, Number(length) || 0), unit);
  const wM = toMetres(Math.max(0, Number(width) || 0), unit);
  const dM = toMetres(Math.max(0, Number(depth) || 0), unit);
  const qtyCount = Math.max(1, Number(count) || 1);
  const currentNet = Math.round(lM * wM * dM * qtyCount * 100) / 100;

  const totalNet =
    items.length > 0
      ? Math.round(items.reduce((acc, item) => acc + item.netM3, 0) * 100) / 100
      : currentNet;

  const wastageM3 = Math.round(totalNet * (wastagePct / 100) * 100) / 100;
  const totalWithWastage = Math.round((totalNet + wastageM3) * 10) / 10;
  const approxCementBags = Math.round(totalWithWastage * 7.2);
  const approxMixers = Math.max(1, Math.ceil(totalWithWastage / 6));

  function addItemToList() {
    if (currentNet <= 0) return;
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: elementType,
        unit,
        length: Number(length) || 0,
        width: Number(width) || 0,
        depthOrHeight: Number(depth) || 0,
        count: qtyCount,
        netM3: currentNet,
      },
    ]);
  }

  function continueToBooking() {
    const roundedQty = Math.max(1, Math.round(totalWithWastage * 2) / 2);
    const usageLabel =
      elementType === 'slab'
        ? 'Roof Slab'
        : elementType === 'footing'
          ? 'Footing / Foundation'
          : elementType === 'column'
            ? 'Columns'
            : elementType === 'beam'
              ? 'Beams / Plinth'
              : 'Retaining / Shear Wall';
    navigate(`/book?product=standard-grades&qty=${roundedQty}&usage=${encodeURIComponent(usageLabel)}`);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-10">
      <div className="space-y-2 max-w-3xl">
        <p className="text-xs font-semibold text-[#D92B25]">Engineering Planning Tool</p>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#0F1F5C] dark:text-white">
          Concrete Volume Calculator (m³)
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Measure slabs, beams, columns, footings, or walls in feet or metres. Includes a 5–10% site wastage buffer and pre-fills your 24/7 concrete booking.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 warm-card p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {(['slab', 'beam', 'column', 'footing', 'wall'] as ElementType[]).map((el) => (
                <button
                  key={el}
                  type="button"
                  onClick={() => setElementType(el)}
                  className={`px-3.5 py-2 rounded-full text-xs font-semibold capitalize transition-colors ${
                    elementType === el
                      ? 'bg-[#D92B25] text-white'
                      : 'bg-[var(--bg-soft)] text-[var(--text)] hover:bg-[#D7E4FF] dark:hover:bg-[#1F3FA8]'
                  }`}
                >
                  {el}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 p-1 rounded-full bg-[var(--bg-soft)]">
              <button
                type="button"
                onClick={() => setUnit('ft')}
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  unit === 'ft'
                    ? 'bg-white dark:bg-[#0F1F5C] shadow-sm text-[#0F1F5C] dark:text-white'
                    : 'text-[var(--muted)]'
                }`}
              >
                Feet (ft)
              </button>
              <button
                type="button"
                onClick={() => setUnit('m')}
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  unit === 'm'
                    ? 'bg-white dark:bg-[#0F1F5C] shadow-sm text-[#0F1F5C] dark:text-white'
                    : 'text-[var(--muted)]'
                }`}
              >
                Metres (m)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                Length ({unit})
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                Width ({unit})
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                {elementType === 'column' || elementType === 'wall' ? `Height (${unit})` : `Depth/Thick (${unit})`}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={depth}
                onChange={(e) => setDepth(e.target.value)}
                className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                Count (Nos)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 text-sm tabular-nums"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[#D7E4FF] dark:border-[#264096] pt-4">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-[var(--muted)]">Site Wastage & Priming Buffer</span>
                <span className="font-mono font-bold text-[#D92B25] tabular-nums">{wastagePct}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="10"
                step="1"
                value={wastagePct}
                onChange={(e) => setWastagePct(Number(e.target.value))}
                className="w-full accent-[#D92B25]"
              />
              <div className="flex justify-between text-[11px] text-[var(--muted)]">
                <span>5% (Tight steel shuttering)</span>
                <span>10% (Earth-cut footings)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={addItemToList}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#D7E4FF] dark:border-[#264096] px-4 py-2 text-xs font-semibold hover:border-[#D92B25] whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Pour List ({currentNet} m³)</span>
            </button>
          </div>

          {items.length > 0 && (
            <div className="space-y-2 border-t border-[#D7E4FF] dark:border-[#264096] pt-4">
              <p className="text-xs font-semibold text-[var(--muted)]">Combined Pour Elements</p>
              <div className="divide-y divide-[#D7E4FF] dark:divide-[#264096]">
                {items.map((item) => (
                  <div key={item.id} className="py-2 flex items-center justify-between text-sm">
                    <span className="capitalize">
                      {item.count}× {item.type} ({item.length} × {item.width} × {item.depthOrHeight} {item.unit})
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold tabular-nums">{item.netM3} m³</span>
                      <button
                        type="button"
                        onClick={() => setItems((prev) => prev.filter((x) => x.id !== item.id))}
                        aria-label="Remove item"
                        className="text-[var(--muted)] hover:text-[#D92B25]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 rounded-[20px] bg-[#0F1F5C] text-white border border-[#264096] p-6 space-y-6 shadow-xl">
          <div className="flex items-center gap-2 text-[#FFC93C]">
            <Calculator className="w-5 h-5" />
            <span className="font-mono text-xs uppercase tracking-wider">Estimated Requirement</span>
          </div>

          <div>
            <p className="text-xs text-slate-300">Recommended Order Volume (incl. {wastagePct}% buffer)</p>
            <p className="font-slab font-bold text-4xl sm:text-5xl text-[#FFC93C] tabular-nums mt-1">
              {totalWithWastage} m³
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 border-y border-white/15 py-4 text-sm">
            <div>
              <p className="text-xs text-slate-300">Net Geometric Volume</p>
              <p className="font-mono font-semibold tabular-nums mt-0.5">{totalNet} m³</p>
            </div>
            <div>
              <p className="text-xs text-slate-300">Wastage Buffer ({wastagePct}%)</p>
              <p className="font-mono font-semibold tabular-nums mt-0.5">{wastageM3} m³</p>
            </div>
            <div>
              <p className="text-xs text-slate-300">Approx. Cement Bags</p>
              <p className="font-mono font-semibold tabular-nums mt-0.5">~{approxCementBags} bags</p>
            </div>
            <div>
              <p className="text-xs text-slate-300">Est. 6 m³ Transit Mixers</p>
              <p className="font-mono font-semibold tabular-nums mt-0.5">{approxMixers} load(s)</p>
            </div>
          </div>

          <button
            type="button"
            onClick={continueToBooking}
            disabled={totalWithWastage <= 0}
            className="w-full btn-orange-pill py-3.5 text-sm disabled:opacity-50"
          >
            <span>Continue to Booking ({totalWithWastage} m³)</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-xs text-slate-300 leading-relaxed">
            Tip: Confirm final cubic metres with your site engineer before truck dispatch.
          </p>
        </div>
      </div>
    </div>
  );
}

interface BrickSizeOption {
  id: string;
  label: string;
  gradeLabel: string;
  faceLengthM: number;
  faceHeightM: number;
  wallThicknessLabel: string;
}

const BRICK_TYPES: BrickSizeOption[] = [
  {
    id: 'std-brick',
    label: 'Standard Cement Brick (9" × 4" × 3")',
    gradeLabel: 'Standard Cement Brick (9×4×3 in)',
    faceLengthM: 0.2286,
    faceHeightM: 0.0762,
    wallThicknessLabel: '4.5" / 9" Wall',
  },
  {
    id: 'block-4',
    label: '4" Solid Cement Block (16" × 4" × 8")',
    gradeLabel: '4" Solid Cement Block (16×4×8 in)',
    faceLengthM: 0.4064,
    faceHeightM: 0.2032,
    wallThicknessLabel: '4" Partition Wall',
  },
  {
    id: 'block-6',
    label: '6" Solid Cement Block (16" × 6" × 8")',
    gradeLabel: '6" Solid Cement Block (16×6×8 in)',
    faceLengthM: 0.4064,
    faceHeightM: 0.2032,
    wallThicknessLabel: '6" External Wall',
  },
  {
    id: 'block-8',
    label: '8" Solid Cement Block (16" × 8" × 8")',
    gradeLabel: '8" Solid Cement Block (16×8×8 in)',
    faceLengthM: 0.4064,
    faceHeightM: 0.2032,
    wallThicknessLabel: '8" Compound / Load Wall',
  },
];

interface WallLineItem {
  id: number;
  brickLabel: string;
  unit: UnitType;
  length: number;
  height: number;
  layers: number;
  piecesNet: number;
}

export function BrickCalculatorPage() {
  const navigate = useNavigate();
  const [unit, setUnit] = useState<UnitType>('ft');
  const [brickId, setBrickId] = useState('block-6');
  const [wallLength, setWallLength] = useState('40');
  const [wallHeight, setWallHeight] = useState('10');
  const [wallThicknessMode, setWallThicknessMode] = useState<'single' | 'double'>('single');
  const [openingsAreaSqFt, setOpeningsAreaSqFt] = useState('21');
  const [wastagePct, setWastagePct] = useState(7);
  const [walls, setWalls] = useState<WallLineItem[]>([]);

  useDocumentMeta({
    title: 'Cement Brick & Solid Block Calculator | MY CONCRETE Ranebennur & Davangere',
    description:
      'Calculate exact cement bricks or 4", 6", and 8" solid blocks needed for your walls with mortar allowance and pre-fill your Kotihal delivery booking.',
  });

  const selectedBrick = BRICK_TYPES.find((b) => b.id === brickId) || BRICK_TYPES[2];
  const lM = toMetres(Math.max(0, Number(wallLength) || 0), unit);
  const hM = toMetres(Math.max(0, Number(wallHeight) || 0), unit);
  const openingM2 =
    unit === 'ft'
      ? Math.max(0, Number(openingsAreaSqFt) || 0) * 0.092903
      : Math.max(0, Number(openingsAreaSqFt) || 0);
  const netWallAreaM2 = Math.max(0, lM * hM - openingM2);

  // Add 10 mm mortar joint per face dimension
  const mortarJointM = 0.01;
  const effUnitAreaM2 =
    (selectedBrick.faceLengthM + mortarJointM) * (selectedBrick.faceHeightM + mortarJointM);
  const multiplier = selectedBrick.id === 'std-brick' && wallThicknessMode === 'double' ? 2 : 1;
  const currentPiecesNet = Math.ceil((netWallAreaM2 / effUnitAreaM2) * multiplier);

  const totalNetPieces =
    walls.length > 0
      ? walls.reduce((acc, w) => acc + w.piecesNet, 0)
      : currentPiecesNet;
  const totalWithWastage = Math.ceil(totalNetPieces * (1 + wastagePct / 100));
  const estMortarM3 = Math.round(netWallAreaM2 * 0.032 * multiplier * 100) / 100;

  function addWall() {
    if (currentPiecesNet <= 0) return;
    setWalls((prev) => [
      ...prev,
      {
        id: Date.now(),
        brickLabel: selectedBrick.label,
        unit,
        length: Number(wallLength) || 0,
        height: Number(wallHeight) || 0,
        layers: multiplier,
        piecesNet: currentPiecesNet,
      },
    ]);
  }

  function continueToBooking() {
    navigate(
      `/book?product=cement-bricks&grade=${encodeURIComponent(selectedBrick.gradeLabel)}&qty=${Math.max(50, totalWithWastage)}&usage=${encodeURIComponent('Masonry Wall')}`
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-10">
      <div className="space-y-2 max-w-3xl">
        <p className="text-xs font-semibold text-[#D92B25]">Masonry Planning Utility</p>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#0F1F5C] dark:text-white">
          Cement Brick &amp; Solid Block Calculator
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Compute the exact number of standard cement bricks or 4&quot;, 6&quot;, and 8&quot; solid concrete blocks needed for your walls (deducting doors/windows and adding 5–10% cutting wastage).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 warm-card p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold text-[var(--muted)]">1. Select Brick / Solid Block Type</p>
            <div className="flex items-center gap-1 p-1 rounded-full bg-[var(--bg-soft)]">
              <button
                type="button"
                onClick={() => setUnit('ft')}
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  unit === 'ft'
                    ? 'bg-white dark:bg-[#0F1F5C] shadow-sm text-[#0F1F5C] dark:text-white'
                    : 'text-[var(--muted)]'
                }`}
              >
                Feet (ft)
              </button>
              <button
                type="button"
                onClick={() => setUnit('m')}
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  unit === 'm'
                    ? 'bg-white dark:bg-[#0F1F5C] shadow-sm text-[#0F1F5C] dark:text-white'
                    : 'text-[var(--muted)]'
                }`}
              >
                Metres (m)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {BRICK_TYPES.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBrickId(b.id)}
                className={`text-left rounded-xl border p-3.5 text-xs transition-colors ${
                  brickId === b.id
                    ? 'border-[#D92B25] bg-[#FFF0EF] dark:bg-[#1F3FA8] text-[#0F1F5C] dark:text-white'
                    : 'border-[#D7E4FF] dark:border-[#264096]'
                }`}
              >
                <p className="font-bold">{b.label}</p>
                <p className="text-[var(--muted)] mt-0.5">{b.wallThicknessLabel}</p>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                Wall Length ({unit})
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={wallLength}
                onChange={(e) => setWallLength(e.target.value)}
                className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                Wall Height ({unit})
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={wallHeight}
                onChange={(e) => setWallHeight(e.target.value)}
                className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                Doors/Windows ({unit === 'ft' ? 'sq.ft' : 'm²'})
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={openingsAreaSqFt}
                onChange={(e) => setOpeningsAreaSqFt(e.target.value)}
                className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                Wall Thickness
              </label>
              <select
                disabled={selectedBrick.id !== 'std-brick'}
                value={wallThicknessMode}
                onChange={(e) => setWallThicknessMode(e.target.value as 'single' | 'double')}
                className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 text-sm disabled:opacity-60"
              >
                <option value="single">Single Wythe</option>
                <option value="double">Double (9&quot; Brick)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[#D7E4FF] dark:border-[#264096] pt-4">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-[var(--muted)]">Cutting &amp; Breakage Allowance</span>
                <span className="font-mono font-bold text-[#D92B25] tabular-nums">{wastagePct}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="10"
                step="1"
                value={wastagePct}
                onChange={(e) => setWastagePct(Number(e.target.value))}
                className="w-full accent-[#D92B25]"
              />
            </div>

            <button
              type="button"
              onClick={addWall}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#D7E4FF] dark:border-[#264096] px-4 py-2 text-xs font-semibold hover:border-[#D92B25] whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Wall ({currentPiecesNet} pcs)</span>
            </button>
          </div>

          {walls.length > 0 && (
            <div className="space-y-2 border-t border-[#D7E4FF] dark:border-[#264096] pt-4">
              <p className="text-xs font-semibold text-[var(--muted)]">Combined Wall Sections</p>
              <div className="divide-y divide-[#D7E4FF] dark:divide-[#264096]">
                {walls.map((w) => (
                  <div key={w.id} className="py-2 flex items-center justify-between text-sm">
                    <span>
                      {w.brickLabel} — {w.length} × {w.height} {w.unit}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold tabular-nums">{w.piecesNet} pcs</span>
                      <button
                        type="button"
                        onClick={() => setWalls((prev) => prev.filter((x) => x.id !== w.id))}
                        aria-label="Remove wall"
                        className="text-[var(--muted)] hover:text-[#D92B25]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 rounded-[20px] bg-[#0F1F5C] text-white border border-[#264096] p-6 space-y-6 shadow-xl">
          <div className="flex items-center gap-2 text-[#FFC93C]">
            <Blocks className="w-5 h-5" />
            <span className="font-mono text-xs uppercase tracking-wider">Estimated Bricks / Blocks</span>
          </div>

          <div>
            <p className="text-xs text-slate-300">Recommended Order (incl. {wastagePct}% cutting buffer)</p>
            <p className="font-slab font-bold text-4xl sm:text-5xl text-[#FFC93C] tabular-nums mt-1">
              {totalWithWastage.toLocaleString('en-IN')} pcs
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 border-y border-white/15 py-4 text-sm">
            <div>
              <p className="text-xs text-slate-300">Net Count (No Wastage)</p>
              <p className="font-mono font-semibold tabular-nums mt-0.5">
                {totalNetPieces.toLocaleString('en-IN')} pcs
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-300">Est. Mortar Volume</p>
              <p className="font-mono font-semibold tabular-nums mt-0.5">~{estMortarM3} m³</p>
            </div>
          </div>

          <button
            type="button"
            onClick={continueToBooking}
            disabled={totalWithWastage <= 0}
            className="w-full btn-orange-pill py-3.5 text-sm disabled:opacity-50"
          >
            <span>Continue to Booking ({totalWithWastage.toLocaleString('en-IN')} pcs)</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-xs text-slate-300 leading-relaxed">
            Assumes standard 10 mm masonry mortar joint. Confirm final pallet load with our Kotihal unit.
          </p>
        </div>
      </div>
    </div>
  );
}

export function GradeHelperPage() {
  const [usage, setUsage] = useState<'pcc' | 'res_slab' | 'res_col' | 'commercial' | 'industrial' | 'pavement'>('res_slab');
  const [exposure, setExposure] = useState<'mild' | 'moderate' | 'severe'>('mild');

  useDocumentMeta({
    title: 'Concrete Grade Helper | MY CONCRETE Ranebennur & Davangere',
    description:
      'Find the recommended IS 456 Ready-Mix Concrete grade and target slump for your residential, commercial, or industrial pour.',
  });

  const recommendationMap = {
    pcc: {
      grade: 'M15',
      productSlug: 'standard-grades',
      slump: '75–100 mm',
      title: 'Levelling Course & Lean PCC',
      note: 'Suitable for foundation mud-mat levelling, compound wall base, and non-structural beds.',
    },
    res_slab: {
      grade: exposure === 'mild' ? 'M20' : 'M25',
      productSlug: 'standard-grades',
      slump: '120–140 mm',
      title: 'Residential Roof Slab & Beams',
      note: 'Cohesive slab formulation calibrated for flatwork levelling and reduced plastic shrinkage.',
    },
    res_col: {
      grade: exposure === 'severe' ? 'M30' : 'M25',
      productSlug: 'standard-grades',
      slump: '100–125 mm',
      title: 'Residential Columns & Footings',
      note: 'Balanced workability for dense column rebar cages and footing compaction.',
    },
    commercial: {
      grade: exposure === 'severe' ? 'M35' : 'M30',
      productSlug: 'standard-grades',
      slump: '125–150 mm',
      title: 'Multi-Storey Commercial Frame',
      note: 'Higher strength structural grade; consider SCC for congested beam-column junctions.',
    },
    industrial: {
      grade: 'M30 FRC (Fibre)',
      productSlug: 'specialty-concrete',
      slump: '100–125 mm',
      title: 'Industrial / Warehouse Floor Slab',
      note: 'Fibre-reinforced concrete for improved crack control, impact toughness, and heavy racking loads.',
    },
    pavement: {
      grade: 'M40',
      productSlug: 'standard-grades',
      slump: '75–100 mm (Chute) / 125 mm (Pump)',
      title: 'Heavy Pavement / Culvert / Bridge Deck',
      note: 'Low-permeability structural grade designed for heavy axle loads and outdoor durability.',
    },
  };

  const rec = recommendationMap[usage];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-[#D92B25]">Mix Advisory Utility</p>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#0F1F5C] dark:text-white">
          Concrete Grade Helper
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Select your structural element and site exposure condition for a recommended IS 456 concrete grade. Cross-verify with your structural consultant&apos;s drawing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-7 warm-card p-6 space-y-6">
          <div>
            <p className="text-xs font-semibold text-[var(--muted)] mb-3">1. Structural Application</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                ['pcc', 'PCC / Levelling Bed'],
                ['res_slab', 'Residential Roof Slab'],
                ['res_col', 'Residential Columns & Footings'],
                ['commercial', 'Commercial Multi-Storey'],
                ['industrial', 'Warehouse / Industrial Floor'],
                ['pavement', 'Heavy Road / Culvert'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setUsage(id as typeof usage)}
                  className={`text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                    usage === id
                      ? 'border-[#D92B25] bg-[#FFF0EF] dark:bg-[#1F3FA8] text-[#0F1F5C] dark:text-white'
                      : 'border-[#D7E4FF] dark:border-[#264096]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-[var(--muted)] mb-3">2. Environmental Exposure</p>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                ['mild', 'Mild (Normal)'],
                ['moderate', 'Moderate (Rain / Soil)'],
                ['severe', 'Severe (Heavy Duty)'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setExposure(id as typeof exposure)}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-colors ${
                    exposure === id
                      ? 'border-[#D92B25] bg-[#FFF0EF] dark:bg-[#1F3FA8] text-[#0F1F5C] dark:text-white'
                      : 'border-[#D7E4FF] dark:border-[#264096]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-5 rounded-[20px] bg-[#0F1F5C] text-white border border-[#264096] p-6 flex flex-col justify-between space-y-6 shadow-xl">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#FFC93C]">
              <Compass className="w-5 h-5" />
              <span className="font-mono text-xs uppercase tracking-wider">Recommended Grade</span>
            </div>
            <p className="font-slab font-bold text-4xl text-white">{rec.grade}</p>
            <p className="text-sm font-semibold text-slate-200">{rec.title}</p>
            <p className="text-xs font-mono text-[#FFC93C]">Target Slump: {rec.slump}</p>
            <p className="text-sm text-slate-300 leading-relaxed pt-2">{rec.note}</p>
          </div>

          <div className="space-y-2.5">
            <Link
              to={`/book?product=${rec.productSlug}&grade=${encodeURIComponent(rec.grade)}`}
              className="w-full btn-orange-pill py-3 text-sm"
            >
              <span>Book {rec.grade} Delivery</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to={`/products/${rec.productSlug}`}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-white/25 py-2.5 text-xs font-semibold text-slate-200 hover:text-white"
            >
              <Layers className="w-3.5 h-3.5 text-[#FFC93C]" />
              <span>View Product Specifications</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PlantLocatorPage() {
  const { data } = useApp();
  const biz = data?.businessConfig;
  const plantLocations =
    data?.plantLocations && data.plantLocations.length > 0
      ? data.plantLocations
      : biz
        ? [
            {
              id: 'kotihal',
              name: biz.businessName,
              shortLabel: 'Kotihal',
              address: biz.address,
              city: 'Ranebennur',
              postalCode: '581119',
              lat: biz.plantLat,
              lng: biz.plantLng,
              phone: biz.phone || '+91 73378 07372',
              whatsapp: biz.whatsapp || biz.phone || '+91 73378 07372',
              hours: biz.workingHours || 'Open 24 Hours (All Days)',
              serviceRadiusKm: biz.serviceRadiusKm || 50,
              googleMapsUrl:
                biz.googleMapsUrl ||
                `https://www.google.com/maps/dir/?api=1&destination=${biz.plantLat},${biz.plantLng}`,
              pinColor: 'blue' as const,
              isPrimary: true,
            },
            {
              id: 'davangere',
              name: 'MY CONCRETE – Davangere Unit',
              shortLabel: 'Davangere',
              address: CONTACT_CONFIG.davangereUnitAddress,
              city: 'Davangere',
              postalCode: CONTACT_CONFIG.davangerePostalCode,
              lat: 14.4644,
              lng: 75.9218,
              phone: '+91 73378 07372',
              whatsapp: '+91 73378 07372',
              hours: 'Open 24 Hours (All Days)',
              serviceRadiusKm: 50,
              googleMapsUrl: CONTACT_CONFIG.davangereGoogleMapsUrl,
              pinColor: 'red' as const,
              isPrimary: false,
            },
          ]
        : [];

  useDocumentMeta({
    title: 'Plant Locator & Delivery Coverage | MY CONCRETE Kotihal & Davangere',
    description:
      'Interactive OpenStreetMap locator for MY CONCRETE batching units at Kotihal (near Ranebennur) and Davangere.',
  });

  const directionsUrl =
    biz?.googleMapsUrl ||
    (biz ? `https://www.google.com/maps/dir/?api=1&destination=${biz.plantLat},${biz.plantLng}` : '#');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#D92B25]">Kotihal &amp; Davangere Dispatch Units</p>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#0F1F5C] dark:text-white">
            Plant Locator &amp; Service Radius
          </h1>
        </div>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-orange-pill px-5 py-2.5 text-sm self-start"
        >
          <Navigation className="w-4 h-4" />
          <span>Directions to Kotihal Plant</span>
        </a>
      </div>

      {biz && (
        <ServiceZoneExplorer
          biz={biz}
          plantLocations={plantLocations}
          mapHeightClass="h-[460px]"
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {plantLocations.map((loc) => {
          const isRed = loc.pinColor === 'red' || (!loc.isPrimary && loc.pinColor !== 'blue');
          const locDirections =
            loc.googleMapsUrl ||
            `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`;
          return (
            <div key={loc.id} className="warm-card p-5 space-y-3">
              <div className="flex items-start gap-2.5">
                <span
                  className={`inline-flex items-center justify-center shrink-0 w-7 h-7 rounded-full text-[11px] font-extrabold text-white mt-0.5 ${
                    isRed ? 'bg-[#D92B25]' : 'bg-[#1F3FA8]'
                  }`}
                >
                  {isRed ? <MapPin className="w-4 h-4" /> : 'MC'}
                </span>
                <div>
                  <h2 className="font-display font-bold text-base text-[#0F1F5C] dark:text-white">
                    {loc.name}
                  </h2>
                  <p className="text-sm text-[var(--muted)] mt-0.5">{loc.address}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs pl-9">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{loc.hours}</span>
                <span className="text-[var(--muted)] tabular-nums">Radius: {loc.serviceRadiusKm} km</span>
                <CallLink
                  phone={loc.phone}
                  whatsapp={loc.whatsapp || loc.phone}
                  className="tabular-nums font-semibold text-[#1F3FA8] dark:text-[#FFC93C] hover:underline"
                >
                  {loc.phone}
                </CallLink>
              </div>
              <div className="flex flex-wrap gap-2.5 pl-9 pt-1">
                <a
                  href={locDirections}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-[#D7E4FF] dark:border-[#264096] px-3.5 py-1.5 text-xs font-semibold hover:border-[#D92B25]"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Get Directions</span>
                </a>
                <Link
                  to={`/book?plant=${encodeURIComponent(loc.id)}`}
                  className="btn-orange-pill px-4 py-1.5 text-xs"
                >
                  Book Delivery from this plant
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="warm-card p-5 space-y-1">
          <p className="text-xs text-[var(--muted)]">Combined Delivery Coverage</p>
          <p className="text-sm font-semibold tabular-nums">
            Within {biz?.serviceRadiusKm || 50} km (Ranebennur, Davangere, Harihar, Byadgi, Haveri)
          </p>
        </div>
        <div className="warm-card p-5 space-y-1">
          <p className="text-xs text-[var(--muted)]">Working Hours</p>
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{biz?.workingHours}</p>
        </div>
      </div>
    </div>
  );
}
