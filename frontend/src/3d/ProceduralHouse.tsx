import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Html } from '@react-three/drei';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import * as THREE from 'three';

// ─── Constants ──────────────────────────────────────────────
const WALL_H = 2.2;
const WALL_T = 0.14;
const FLOOR_T = 0.12;

// ─── Color Palette (Matching reference image) ───────────────
const EXTERIOR_COLOR = '#4a4a4c';
const ACCENT_COLOR = '#d4861f';
const INTERIOR_COLOR = '#f2ede6';

const FLOOR_COLORS: Record<string, string> = {
  living:   '#e8dcc8',
  kitchen:  '#e0d8c4',
  bedroom:  '#d8c8a8',
  bathroom: '#d0dce8',
  dining:   '#e4d8b8',
  stairs:   '#d0c4a8',
  parking:  '#b4b4b4',
  hall:     '#dcd4c4',
  balcony:  '#c8d8c0',
  default:  '#d8d0c4',
};

const FURN = {
  sofa:      '#5a4a3a',
  pillow:    '#c8a860',
  cushion:   '#a88848',
  table:     '#c8b898',
  tableDark: '#8a7a60',
  chair:     '#6a5a48',
  counter:   '#6a4a38',
  counterTop:'#e8e0d0',
  appliance: '#d8d8d8',
  bed:       '#5a4a38',
  mattress:  '#e8e0d0',
  blanket:   '#c8a848',
  carpet:    '#a87c5a',
  rug:       '#8a6a48',
  tv:        '#222',
  bathtub:   '#e4e8ec',
  toilet:    '#f0f0f0',
  sink:      '#e0e4e8',
  plant:     '#3a8a4a',
  plantPot:  '#7a5a3a',
  wood:      '#9a7a58',
  frame:     '#5a4a38',
  picture:   '#d8c8a0',
  wardrobe:  '#7a6a58',
  metal:     '#aaa',
  glass:     '#c0d8f0',
};

// ─── Small helpers ────────────────────────────────────────────
function Box({ pos, size, color, roughness = 0.75, metalness = 0, transparent = false, opacity = 1 }: any) {
  return (
    <mesh position={pos} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshPhysicalMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
        transparent={transparent}
        opacity={opacity}
      />
    </mesh>
  );
}

function Cylinder({ pos, args, color, roughness = 0.7 }: any) {
  return (
    <mesh position={pos} castShadow>
      <cylinderGeometry args={args} />
      <meshPhysicalMaterial color={color} roughness={roughness} />
    </mesh>
  );
}

// ─── Decorative Elements ──────────────────────────────────────
function PictureFrame({ pos, size = [0.5, 0.4, 0.04], rotation = [0, 0, 0] }: any) {
  return (
    <group position={pos} rotation={rotation}>
      <Box pos={[0, 0, 0]} size={size} color={FURN.frame} roughness={0.4} />
      <Box pos={[0, 0, 0.022]} size={[size[0] * 0.8, size[1] * 0.75, 0.01]} color={FURN.picture} roughness={0.3} />
    </group>
  );
}

function PottedPlant({ pos, scale = 1 }: any) {
  const s = scale;
  return (
    <group position={pos}>
      <Box pos={[0, 0.12 * s, 0]} size={[0.2 * s, 0.24 * s, 0.2 * s]} color={FURN.plantPot} roughness={0.8} />
      <Cylinder pos={[0, 0.32 * s, 0]} args={[0.14 * s, 0.18 * s, 0.12 * s, 8]} color={'#2a5a2a'} roughness={1} />
      <Cylinder pos={[0, 0.44 * s, 0]} args={[0.22 * s, 0.08 * s, 0.2 * s, 8]} color={FURN.plant} roughness={1} />
      <Cylinder pos={[0.06 * s, 0.56 * s, 0.04 * s]} args={[0.12 * s, 0.04 * s, 0.16 * s, 6]} color={'#4a9a5a'} roughness={1} />
      <Cylinder pos={[-0.05 * s, 0.52 * s, -0.03 * s]} args={[0.1 * s, 0.06 * s, 0.14 * s, 6]} color={FURN.plant} roughness={1} />
    </group>
  );
}

function Rug({ pos, size, color }: any) {
  return <Box pos={pos} size={[size[0], 0.02, size[1]]} color={color} roughness={0.95} />;
}

// ─── Furniture per room type ──────────────────────────────────
function LivingFurniture({ w, d }: { w: number; d: number }) {
  return (
    <group position={[0, FLOOR_T / 2, 0]}>
      {/* L-shaped sofa */}
      <Box pos={[-w * 0.2, 0.18, -d * 0.28]} size={[w * 0.48, 0.36, 0.7]} color={FURN.sofa} />
      <Box pos={[-w * 0.2, 0.38, -d * 0.38]} size={[w * 0.48, 0.28, 0.2]} color={FURN.sofa} />
      <Box pos={[w * 0.1, 0.18, -d * 0.08]} size={[0.7, 0.36, d * 0.42]} color={FURN.sofa} />
      <Box pos={[w * 0.2, 0.38, -d * 0.08]} size={[0.2, 0.28, d * 0.42]} color={FURN.sofa} />
      {/* Sofa cushions */}
      <Box pos={[-w * 0.28, 0.4, -d * 0.22]} size={[0.38, 0.1, 0.32]} color={FURN.pillow} />
      <Box pos={[-w * 0.1, 0.4, -d * 0.22]} size={[0.38, 0.1, 0.32]} color={FURN.cushion} />
      <Box pos={[w * 0.1, 0.4, d * 0.05]} size={[0.32, 0.1, 0.38]} color={FURN.pillow} />
      {/* Coffee table */}
      <Box pos={[-w * 0.05, 0.18, d * 0.02]} size={[0.9, 0.04, 0.55]} color={FURN.table} roughness={0.2} />
      <Box pos={[-w * 0.05, 0.08, d * 0.02]} size={[0.8, 0.16, 0.45]} color={FURN.tableDark} roughness={0.3} />
      {/* Items on coffee table */}
      <Box pos={[-w * 0.12, 0.22, d * 0.0]} size={[0.2, 0.04, 0.14]} color={'#8a5a3a'} roughness={0.3} />
      <Cylinder pos={[w * 0.02, 0.24, d * 0.06]} args={[0.04, 0.04, 0.08, 8]} color={'#c0a070'} />
      {/* TV unit */}
      <Box pos={[w * 0.32, 0.2, -d * 0.34]} size={[0.14, 0.4, 1.3]} color={FURN.wood} roughness={0.5} />
      <Box pos={[w * 0.26, 0.42, -d * 0.34]} size={[0.04, 0.6, 1.1]} color={FURN.tv} roughness={0.1} metalness={0.8} />
      {/* Rug */}
      <Rug pos={[-w * 0.05, 0.01, -d * 0.06]} size={[w * 0.5, d * 0.45]} color={FURN.carpet} />
      {/* Plants */}
      <PottedPlant pos={[-w * 0.38, 0, d * 0.32]} scale={0.9} />
      <PottedPlant pos={[w * 0.35, 0, d * 0.35]} scale={0.7} />
      {/* Picture frames on walls */}
      <PictureFrame pos={[-w * 0.42, 1.2, -d * 0.1]} rotation={[0, Math.PI / 2, 0]} />
      <PictureFrame pos={[w * 0.1, 1.2, -d * 0.42]} size={[0.45, 0.35, 0.04]} />
    </group>
  );
}

function KitchenFurniture({ w, d }: { w: number; d: number }) {
  return (
    <group position={[0, FLOOR_T / 2, 0]}>
      {/* L-counter (back wall) */}
      <Box pos={[0, 0.42, -d * 0.38]} size={[w * 0.8, 0.84, 0.48]} color={FURN.counter} />
      <Box pos={[0, 0.86, -d * 0.38]} size={[w * 0.82, 0.06, 0.5]} color={FURN.counterTop} roughness={0.2} />
      {/* L-counter (side) */}
      <Box pos={[-w * 0.36, 0.42, -d * 0.1]} size={[0.48, 0.84, d * 0.5]} color={FURN.counter} />
      <Box pos={[-w * 0.36, 0.86, -d * 0.1]} size={[0.5, 0.06, d * 0.52]} color={FURN.counterTop} roughness={0.2} />
      {/* Sink */}
      <Box pos={[w * 0.05, 0.88, -d * 0.38]} size={[0.42, 0.04, 0.3]} color={FURN.metal} roughness={0.15} metalness={0.8} />
      {/* Stove burners */}
      <Box pos={[-w * 0.15, 0.88, -d * 0.38]} size={[0.48, 0.03, 0.4]} color={'#333'} />
      <Cylinder pos={[-w * 0.2, 0.9, -d * 0.35]} args={[0.06, 0.06, 0.02, 12]} color={'#555'} roughness={0.3} />
      <Cylinder pos={[-w * 0.1, 0.9, -d * 0.35]} args={[0.06, 0.06, 0.02, 12]} color={'#555'} roughness={0.3} />
      <Cylinder pos={[-w * 0.2, 0.9, -d * 0.42]} args={[0.05, 0.05, 0.02, 12]} color={'#555'} roughness={0.3} />
      <Cylinder pos={[-w * 0.1, 0.9, -d * 0.42]} args={[0.05, 0.05, 0.02, 12]} color={'#555'} roughness={0.3} />
      {/* Fridge */}
      <Box pos={[w * 0.34, 0.85, -d * 0.38]} size={[0.5, 1.7, 0.5]} color={FURN.appliance} roughness={0.3} metalness={0.2} />
      <Box pos={[w * 0.34, 0.85, -d * 0.14]} size={[0.48, 0.01, 0.02]} color={'#bbb'} />
      {/* Upper cabinets */}
      <Box pos={[-w * 0.05, 1.62, -d * 0.4]} size={[w * 0.55, 0.48, 0.28]} color={FURN.counter} />
      <Box pos={[-w * 0.36, 1.62, -d * 0.15]} size={[0.28, 0.48, d * 0.4]} color={FURN.counter} />
      {/* Dining area in kitchen (small table + chairs) */}
      <Box pos={[w * 0.12, 0.35, d * 0.2]} size={[0.7, 0.04, 0.7]} color={FURN.table} roughness={0.3} />
      {[[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]].map(([tx, tz], i) => (
        <Box key={i} pos={[w * 0.12 + tx, 0.17, d * 0.2 + tz]} size={[0.04, 0.34, 0.04]} color={FURN.wood} />
      ))}
      {/* Chairs */}
      <Box pos={[w * 0.12 - 0.5, 0.22, d * 0.2]} size={[0.3, 0.04, 0.3]} color={FURN.chair} />
      <Box pos={[w * 0.12 + 0.5, 0.22, d * 0.2]} size={[0.3, 0.04, 0.3]} color={FURN.chair} />
    </group>
  );
}

function DiningFurniture({ w, d }: { w: number; d: number }) {
  return (
    <group position={[0, FLOOR_T / 2, 0]}>
      {/* Dining table */}
      <Box pos={[0, 0.36, 0]} size={[1.6, 0.05, 0.85]} color={FURN.table} roughness={0.2} />
      {/* Table legs */}
      {[[-0.68, 0.34], [0.68, 0.34], [-0.68, -0.34], [0.68, -0.34]].map(([tx, tz], i) => (
        <Box key={i} pos={[tx, 0.17, tz]} size={[0.05, 0.34, 0.05]} color={FURN.tableDark} />
      ))}
      {/* Chairs */}
      {[[-0.5, -0.58, 0], [0, -0.58, 0], [0.5, -0.58, 0],
        [-0.5, 0.58, Math.PI], [0, 0.58, Math.PI], [0.5, 0.58, Math.PI]].map(([cx, cz, _ry], i) => (
        <group key={i} position={[cx, 0, cz]}>
          <Box pos={[0, 0.2, 0]} size={[0.36, 0.04, 0.36]} color={FURN.chair} />
          <Box pos={[0, 0.38, 0.16]} size={[0.36, 0.32, 0.04]} color={FURN.chair} />
          {[[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]].map(([lx, lz], li) => (
            <Box key={li} pos={[lx, 0.09, lz]} size={[0.03, 0.18, 0.03]} color={FURN.chair} />
          ))}
        </group>
      ))}
      {/* Table place settings */}
      {[-0.5, 0, 0.5].map((cx, i) => (
        <group key={`plate-${i}`}>
          <Cylinder pos={[cx, 0.4, -0.22]} args={[0.1, 0.1, 0.02, 12]} color={'#f0f0f0'} roughness={0.2} />
          <Cylinder pos={[cx, 0.4, 0.22]} args={[0.1, 0.1, 0.02, 12]} color={'#f0f0f0'} roughness={0.2} />
        </group>
      ))}
      {/* Sideboard/buffet */}
      <Box pos={[-w * 0.38, 0.32, 0]} size={[0.4, 0.64, 1.2]} color={FURN.wood} />
      <Box pos={[-w * 0.38, 0.66, 0]} size={[0.42, 0.04, 1.22]} color={FURN.counterTop} roughness={0.3} />
      {/* Picture frames */}
      <PictureFrame pos={[0, 1.3, -d * 0.43]} size={[0.6, 0.45, 0.04]} />
      <PictureFrame pos={[w * 0.25, 1.1, -d * 0.43]} size={[0.35, 0.28, 0.04]} />
    </group>
  );
}

function BedroomFurniture({ w, d }: { w: number; d: number }) {
  return (
    <group position={[0, FLOOR_T / 2, 0]}>
      {/* Bed frame */}
      <Box pos={[0, 0.18, -d * 0.2]} size={[1.45, 0.36, 1.9]} color={FURN.bed} />
      {/* Mattress */}
      <Box pos={[0, 0.4, -d * 0.2]} size={[1.35, 0.12, 1.8]} color={FURN.mattress} />
      {/* Blanket/quilt - golden patterned */}
      <Box pos={[0, 0.48, -d * 0.1]} size={[1.3, 0.06, 1.2]} color={FURN.blanket} roughness={0.9} />
      <Box pos={[0, 0.5, -d * 0.1]} size={[1.25, 0.02, 0.4]} color={'#b89838'} roughness={0.9} />
      {/* Pillows */}
      <Box pos={[-0.32, 0.54, -d * 0.2 - 0.65]} size={[0.5, 0.1, 0.28]} color={'#e8e0d8'} />
      <Box pos={[0.32, 0.54, -d * 0.2 - 0.65]} size={[0.5, 0.1, 0.28]} color={'#e8e0d8'} />
      {/* Headboard */}
      <Box pos={[0, 0.65, -d * 0.2 - 0.92]} size={[1.5, 0.9, 0.08]} color={FURN.bed} />
      {/* Wardrobe */}
      <Box pos={[w * 0.3, 0.85, -d * 0.32]} size={[0.5, 1.7, 1.0]} color={FURN.wardrobe} />
      <Box pos={[w * 0.3 - 0.12, 0.85, -d * 0.32 + 0.52]} size={[0.02, 1.4, 0.02]} color={FURN.metal} roughness={0.3} metalness={0.5} />
      <Box pos={[w * 0.3 + 0.12, 0.85, -d * 0.32 + 0.52]} size={[0.02, 1.4, 0.02]} color={FURN.metal} roughness={0.3} metalness={0.5} />
      {/* Bedside tables */}
      <Box pos={[0.82, 0.22, -d * 0.2 - 0.5]} size={[0.35, 0.44, 0.35]} color={FURN.wood} />
      <Box pos={[-0.82, 0.22, -d * 0.2 - 0.5]} size={[0.35, 0.44, 0.35]} color={FURN.wood} />
      {/* Lamps on bedside tables */}
      <Cylinder pos={[0.82, 0.52, -d * 0.2 - 0.5]} args={[0.03, 0.03, 0.28, 8]} color={FURN.metal} />
      <Cylinder pos={[0.82, 0.7, -d * 0.2 - 0.5]} args={[0.1, 0.04, 0.12, 8]} color={'#f0e8d0'} roughness={0.9} />
      {/* Desk */}
      <Box pos={[-w * 0.28, 0.36, d * 0.28]} size={[0.7, 0.04, 0.45]} color={FURN.wood} roughness={0.4} />
      <Box pos={[-w * 0.28, 0.17, d * 0.28]} size={[0.64, 0.34, 0.4]} color={FURN.wood} />
      {/* Chair at desk */}
      <Box pos={[-w * 0.28, 0.2, d * 0.02]} size={[0.38, 0.04, 0.36]} color={FURN.chair} />
      <Box pos={[-w * 0.28, 0.38, d * 0.02 - 0.16]} size={[0.38, 0.32, 0.04]} color={FURN.chair} />
      {/* Rug */}
      <Rug pos={[0, 0.01, d * 0.1]} size={[w * 0.45, d * 0.35]} color={FURN.rug} />
      {/* Picture frames */}
      <PictureFrame pos={[w * 0.1, 1.2, -d * 0.43]} size={[0.5, 0.38, 0.04]} />
      <PictureFrame pos={[-w * 0.15, 1.2, -d * 0.43]} size={[0.4, 0.3, 0.04]} />
    </group>
  );
}

function BathroomFurniture({ w, d }: { w: number; d: number }) {
  return (
    <group position={[0, FLOOR_T / 2, 0]}>
      {/* Bathtub */}
      <Box pos={[w * 0.15, 0.22, -d * 0.2]} size={[w * 0.42, 0.44, d * 0.5]} color={FURN.bathtub} />
      <Box pos={[w * 0.15, 0.24, -d * 0.2]} size={[w * 0.35, 0.36, d * 0.42]} color={'#c8dce8'} roughness={0.1} />
      {/* Shower head */}
      <Cylinder pos={[w * 0.15, 1.4, -d * 0.38]} args={[0.02, 0.02, 0.8, 8]} color={FURN.metal} roughness={0.2} metalness={0.8} />
      <Cylinder pos={[w * 0.15, 1.82, -d * 0.38]} args={[0.08, 0.02, 0.04, 12]} color={FURN.metal} roughness={0.2} metalness={0.8} />
      {/* Toilet */}
      <Box pos={[-w * 0.28, 0.18, -d * 0.28]} size={[0.36, 0.36, 0.5]} color={FURN.toilet} roughness={0.3} />
      <Box pos={[-w * 0.28, 0.38, -d * 0.42]} size={[0.36, 0.08, 0.2]} color={FURN.toilet} roughness={0.3} />
      <Cylinder pos={[-w * 0.28, 0.38, -d * 0.22]} args={[0.15, 0.15, 0.04, 16]} color={FURN.toilet} roughness={0.3} />
      {/* Vanity / sink */}
      <Box pos={[-w * 0.25, 0.38, d * 0.28]} size={[0.5, 0.76, 0.38]} color={'#8a8878'} />
      <Box pos={[-w * 0.25, 0.78, d * 0.28]} size={[0.48, 0.04, 0.36]} color={FURN.sink} roughness={0.15} />
      <Cylinder pos={[-w * 0.25, 0.82, d * 0.28]} args={[0.12, 0.14, 0.04, 16]} color={'#b8c8d4'} roughness={0.1} />
      {/* Mirror */}
      <Box pos={[-w * 0.25, 1.25, d * 0.44]} size={[0.45, 0.55, 0.03]} color={FURN.glass} roughness={0.05} metalness={0.9} />
      {/* Floor tile pattern (subtle) */}
      {Array.from({ length: 3 }).map((_, i) =>
        Array.from({ length: 3 }).map((_, j) => (
          <Box key={`tile-${i}-${j}`}
            pos={[-w * 0.2 + i * 0.3, 0.005, -d * 0.15 + j * 0.3]}
            size={[0.28, 0.005, 0.28]}
            color={((i + j) % 2 === 0) ? '#c8d0d8' : '#d8e0e8'}
          />
        ))
      )}
    </group>
  );
}

function StairsFurniture({ w, d }: { w: number; d: number }) {
  const steps = 10;
  return (
    <group>
      {Array.from({ length: steps }).map((_, i) => (
        <Box
          key={i}
          pos={[0, i * (WALL_H / steps) / 2 + 0.04, -d / 2 + (i / steps) * d + d / steps / 2]}
          size={[w * 0.8, WALL_H / steps * 0.9, d / steps * 0.95]}
          color={i % 2 === 0 ? '#d8cfc0' : '#ccc4b0'}
        />
      ))}
      {/* Railing */}
      <Box pos={[w * 0.38, WALL_H * 0.55, 0]} size={[0.04, WALL_H * 0.85, d * 0.88]} color={FURN.metal} roughness={0.2} metalness={0.6} />
      <Box pos={[-w * 0.38, WALL_H * 0.55, 0]} size={[0.04, WALL_H * 0.85, d * 0.88]} color={FURN.metal} roughness={0.2} metalness={0.6} />
      {/* Handrail */}
      <Box pos={[w * 0.38, WALL_H * 1.0, 0]} size={[0.06, 0.04, d * 0.9]} color={FURN.wood} roughness={0.4} />
    </group>
  );
}

function ParkingFurniture({ w, d }: { w: number; d: number }) {
  return (
    <group position={[0, FLOOR_T / 2, 0]}>
      {/* Car body */}
      <Box pos={[0, 0.22, 0]} size={[w * 0.55, 0.44, d * 0.7]} color={'#4a6a8a'} roughness={0.4} metalness={0.5} />
      <Box pos={[0, 0.48, -d * 0.04]} size={[w * 0.45, 0.24, d * 0.4]} color={'#4a6a8a'} roughness={0.4} metalness={0.5} />
      {/* Windshield */}
      <Box pos={[0, 0.48, d * 0.12]} size={[w * 0.42, 0.22, 0.04]} color={FURN.glass} roughness={0.05} metalness={0.1} transparent={true} opacity={0.6} />
      {/* Wheels */}
      {[[-w * 0.22, -d * 0.26], [w * 0.22, -d * 0.26], [-w * 0.22, d * 0.26], [w * 0.22, d * 0.26]].map(([cx, cz], i) => (
        <Cylinder key={i} pos={[cx, 0.1, cz]} args={[0.1, 0.1, 0.16, 12]} color={'#222'} roughness={0.8} />
      ))}
      {/* Floor markings */}
      <Box pos={[0, 0.005, 0]} size={[w * 0.65, 0.005, d * 0.8]} color={'#9a9a9a'} />
    </group>
  );
}

function HallFurniture({ w, d }: { w: number; d: number }) {
  return (
    <group position={[0, FLOOR_T / 2, 0]}>
      {/* Console table */}
      <Box pos={[0, 0.35, -d * 0.36]} size={[w * 0.5, 0.04, 0.3]} color={FURN.wood} roughness={0.35} />
      <Box pos={[-w * 0.2, 0.17, -d * 0.36]} size={[0.04, 0.34, 0.04]} color={FURN.wood} />
      <Box pos={[w * 0.2, 0.17, -d * 0.36]} size={[0.04, 0.34, 0.04]} color={FURN.wood} />
      {/* Decorative items on table */}
      <PottedPlant pos={[w * 0.1, 0.38, -d * 0.36]} scale={0.5} />
      {/* Wall art */}
      <PictureFrame pos={[0, 1.2, -d * 0.43]} size={[0.6, 0.5, 0.04]} />
      {/* Bench / seating */}
      <Box pos={[0, 0.2, d * 0.2]} size={[w * 0.4, 0.06, 0.4]} color={FURN.chair} />
      <Box pos={[-w * 0.18, 0.1, d * 0.2]} size={[0.04, 0.2, 0.04]} color={FURN.wood} />
      <Box pos={[w * 0.18, 0.1, d * 0.2]} size={[0.04, 0.2, 0.04]} color={FURN.wood} />
      {/* Rug */}
      <Rug pos={[0, 0.01, 0]} size={[w * 0.5, d * 0.4]} color={'#b8a888'} />
    </group>
  );
}

// ─── Single Room Component ────────────────────────────────────
interface RoomDef {
  type: string;
  position: [number, number, number];
  size: [number, number];
  color?: string;
}

function Room({ room, wallColor }: { room: RoomDef; wallColor: string }) {
  const { type, position, size } = room;
  const [x, y, z] = position;
  const [w, d] = size;
  const floorColor = FLOOR_COLORS[type] || FLOOR_COLORS.default;
  const intColor = INTERIOR_COLOR;

  return (
    <group position={[x, y, z]}>
      {/* Floor slab */}
      <mesh receiveShadow>
        <boxGeometry args={[w, FLOOR_T, d]} />
        <meshPhysicalMaterial color={floorColor} roughness={0.55} />
      </mesh>

      {/* Floor grid pattern (subtle tile effect) */}
      {(type === 'kitchen' || type === 'bathroom' || type === 'dining') && (
        <group position={[0, FLOOR_T / 2 + 0.002, 0]}>
          {Array.from({ length: Math.floor(w / 0.5) }).map((_, i) => (
            <Box key={`fg-${i}`}
              pos={[-w / 2 + 0.25 + i * 0.5, 0, 0]}
              size={[0.01, 0.002, d * 0.95]}
              color={'#00000010'}
              transparent={true}
              opacity={0.08}
            />
          ))}
        </group>
      )}

      {/* ─── Walls ─── */}
      {/* North wall (back - full height) */}
      <group>
        <mesh position={[0, WALL_H / 2 + FLOOR_T / 2, -d / 2 + WALL_T / 2]} castShadow>
          <boxGeometry args={[w, WALL_H, WALL_T]} />
          <meshPhysicalMaterial color={intColor} roughness={0.8} />
        </mesh>
        {/* Wall cap (dark trim) */}
        <Box pos={[0, WALL_H + FLOOR_T / 2, -d / 2 + WALL_T / 2]} size={[w + 0.02, 0.06, WALL_T + 0.02]} color={EXTERIOR_COLOR} roughness={0.5} />
      </group>

      {/* South wall (front - lower for visibility) */}
      <group>
        <mesh position={[0, WALL_H / 2 + FLOOR_T / 2, d / 2 - WALL_T / 2]} castShadow>
          <boxGeometry args={[w, WALL_H, WALL_T]} />
          <meshPhysicalMaterial color={intColor} roughness={0.8} />
        </mesh>
        <Box pos={[0, WALL_H + FLOOR_T / 2, d / 2 - WALL_T / 2]} size={[w + 0.02, 0.06, WALL_T + 0.02]} color={EXTERIOR_COLOR} roughness={0.5} />
      </group>

      {/* West wall (left - full height) */}
      <group>
        <mesh position={[-w / 2 + WALL_T / 2, WALL_H / 2 + FLOOR_T / 2, 0]} castShadow>
          <boxGeometry args={[WALL_T, WALL_H, d]} />
          <meshPhysicalMaterial color={intColor} roughness={0.8} />
        </mesh>
        <Box pos={[-w / 2 + WALL_T / 2, WALL_H + FLOOR_T / 2, 0]} size={[WALL_T + 0.02, 0.06, d + 0.02]} color={EXTERIOR_COLOR} roughness={0.5} />
      </group>

      {/* East wall */}
      <group>
        <mesh position={[w / 2 - WALL_T / 2, WALL_H / 2 + FLOOR_T / 2, 0]} castShadow>
          <boxGeometry args={[WALL_T, WALL_H, d]} />
          <meshPhysicalMaterial color={intColor} roughness={0.8} />
        </mesh>
        <Box pos={[w / 2 - WALL_T / 2, WALL_H + FLOOR_T / 2, 0]} size={[WALL_T + 0.02, 0.06, d + 0.02]} color={EXTERIOR_COLOR} roughness={0.5} />
      </group>

      {/* Exterior wall accent panels (orange highlights) */}
      <Box pos={[-w / 2 - 0.01, WALL_H * 0.3 + FLOOR_T / 2, d * 0.25]}
        size={[0.02, WALL_H * 0.6, d * 0.35]}
        color={ACCENT_COLOR} roughness={0.6} />
      <Box pos={[w * 0.25, WALL_H * 0.3 + FLOOR_T / 2, d / 2 + 0.01]}
        size={[w * 0.35, WALL_H * 0.6, 0.02]}
        color={ACCENT_COLOR} roughness={0.6} />

      {/* Room type label on floor */}
      <Html position={[0, FLOOR_T / 2 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} transform occlude={false}>
        <div style={{
          fontSize: '9px',
          fontWeight: 800,
          color: '#8a7a68',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          fontFamily: 'Inter, system-ui, sans-serif',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
          opacity: 0.6,
        }}>
          {type}
        </div>
      </Html>

      {/* Furniture */}
      <group position={[0, FLOOR_T / 2, 0]}>
        {type === 'living'   && <LivingFurniture w={w} d={d} />}
        {type === 'kitchen'  && <KitchenFurniture w={w} d={d} />}
        {type === 'dining'   && <DiningFurniture w={w} d={d} />}
        {type === 'bedroom'  && <BedroomFurniture w={w} d={d} />}
        {type === 'bathroom' && <BathroomFurniture w={w} d={d} />}
        {type === 'stairs'   && <StairsFurniture w={w} d={d} />}
        {type === 'parking'  && <ParkingFurniture w={w} d={d} />}
        {type === 'hall'     && <HallFurniture w={w} d={d} />}
      </group>
    </group>
  );
}

// ─── Walkthrough Camera Controller ────────────────────────────
function WalkthroughCamera({
  rooms,
  active,
  onComplete,
  onRoomChange,
}: {
  rooms: RoomDef[];
  active: boolean;
  onComplete: () => void;
  onRoomChange: (roomIndex: number) => void;
}) {
  const { camera } = useThree();
  const timeRef = useRef(0);
  const pathRef = useRef<THREE.CatmullRomCurve3 | null>(null);
  const startPosRef = useRef(new THREE.Vector3());
  const startTargetRef = useRef(new THREE.Vector3());
  const totalDurationRef = useRef(0);
  const lastRoomIdxRef = useRef(-1);

  useEffect(() => {
    if (active && rooms.length > 0) {
      startPosRef.current.copy(camera.position);
      startTargetRef.current.set(0, 1, 0);

      // Create a spline path through all rooms at eye height
      const eyeH = 1.5;
      const points = [
        camera.position.clone(),
        ...rooms.map(r => new THREE.Vector3(
          r.position[0],
          r.position[1] + eyeH,
          r.position[2]
        )),
        new THREE.Vector3(
          camera.position.x * 0.7,
          camera.position.y * 0.8,
          camera.position.z * 0.7
        ),
      ];

      pathRef.current = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.3);
      totalDurationRef.current = rooms.length * 3.5 + 4; // 3.5s per room + 4s for entrance/exit
      timeRef.current = 0;
      lastRoomIdxRef.current = -1;
    }
  }, [active, rooms, camera]);

  useFrame((_, delta) => {
    if (!active || !pathRef.current) return;

    timeRef.current += delta;
    const t = Math.min(timeRef.current / totalDurationRef.current, 1);

    // Get position on spline
    const pos = pathRef.current.getPointAt(t);
    camera.position.lerp(pos, 0.08);

    // Look ahead on the curve
    const lookT = Math.min(t + 0.025, 1);
    const lookPos = pathRef.current.getPointAt(lookT);
    // Smooth look target
    const lookTarget = new THREE.Vector3();
    lookTarget.lerpVectors(camera.position, lookPos, 1.5);
    lookTarget.y -= 0.2;
    camera.lookAt(lookTarget);

    // Determine which room we're closest to
    const roomSegmentSize = 1 / (rooms.length + 2);
    const roomIdx = Math.floor((t - roomSegmentSize) / roomSegmentSize);
    if (roomIdx >= 0 && roomIdx < rooms.length && roomIdx !== lastRoomIdxRef.current) {
      lastRoomIdxRef.current = roomIdx;
      onRoomChange(roomIdx);
    }

    if (t >= 1) {
      // Reset camera to overview
      camera.position.copy(startPosRef.current);
      camera.lookAt(startTargetRef.current);
      onComplete();
    }
  });

  return null;
}

// ─── Default house layout ─────────────────────────────────────
const defaultRooms: RoomDef[] = [
  { type: 'bedroom',  position: [-3.2, 0, -3.5], size: [3.8, 3.5] },
  { type: 'bathroom', position: [-3.2, 0, 0.2],  size: [2.0, 1.8] },
  { type: 'kitchen',  position: [1.5,  0, -3.5], size: [3.5, 3.5] },
  { type: 'dining',   position: [1.5,  0, 0.0],  size: [3.5, 3.0] },
  { type: 'living',   position: [-1.0, 0, 3.5],  size: [6.5, 3.8] },
  { type: 'bedroom',  position: [4.0,  0, 3.0],  size: [3.2, 3.5] },
  { type: 'bedroom',  position: [-3.5, 0, 3.0],  size: [3.0, 3.2] },
];

// ─── Main Component ───────────────────────────────────────────
export default function ProceduralHouse({ houseData }: { houseData: any }) {
  const rooms: RoomDef[] = houseData?.rooms || defaultRooms;
  const wallColor = houseData?.wallColor || INTERIOR_COLOR;

  const [walkthrough, setWalkthrough] = useState(false);
  const [currentRoomLabel, setCurrentRoomLabel] = useState('');
  const [walkthroughProgress, setWalkthroughProgress] = useState(0);
  const controlsRef = useRef<any>(null);

  const handleRoomChange = useCallback((idx: number) => {
    if (idx >= 0 && idx < rooms.length) {
      setCurrentRoomLabel(rooms[idx].type.charAt(0).toUpperCase() + rooms[idx].type.slice(1));
      setWalkthroughProgress(Math.round(((idx + 1) / rooms.length) * 100));
    }
  }, [rooms]);

  const handleWalkthroughEnd = useCallback(() => {
    setWalkthrough(false);
    setCurrentRoomLabel('');
    setWalkthroughProgress(0);
  }, []);

  const startWalkthrough = useCallback(() => {
    setWalkthrough(true);
    setCurrentRoomLabel('Starting tour...');
    setWalkthroughProgress(0);
  }, []);

  return (
    <div className="w-full h-full relative">
      {/* Top bar */}
      <div className="absolute top-4 left-4 z-20 flex gap-2 items-center">
        <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md border border-[#00f0ff]/30 rounded-full text-xs font-bold text-[#00f0ff] tracking-widest uppercase shadow-[0_0_15px_rgba(0,240,255,0.15)]">
          Live 3D View
        </div>
        <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-xs text-gray-400 font-medium">
          {rooms.length} rooms
        </div>
      </div>

      {/* Walkthrough button */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        {!walkthrough ? (
          <button
            onClick={startWalkthrough}
            className="px-4 py-2 bg-gradient-to-r from-[#d4861f] to-[#e8a040] text-black font-extrabold text-xs rounded-full hover:brightness-110 active:scale-[0.97] transition-all shadow-[0_0_15px_rgba(212,134,31,0.4)] flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Walk Through
          </button>
        ) : (
          <button
            onClick={handleWalkthroughEnd}
            className="px-4 py-2 bg-red-500/80 backdrop-blur-md text-white font-extrabold text-xs rounded-full hover:bg-red-500 active:scale-[0.97] transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="6" width="12" height="12" />
            </svg>
            Stop Tour
          </button>
        )}
      </div>

      {/* Walkthrough overlay */}
      {walkthrough && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
          <div className="px-5 py-2.5 bg-black/70 backdrop-blur-xl border border-[#d4861f]/40 rounded-2xl text-white text-sm font-bold tracking-wide shadow-[0_0_25px_rgba(0,0,0,0.5)]">
            <span className="text-[#e8a040]">🏠</span> {currentRoomLabel}
          </div>
          {/* Progress bar */}
          <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-md">
            <div
              className="h-full bg-gradient-to-r from-[#d4861f] to-[#e8a040] rounded-full transition-all duration-700"
              style={{ width: `${walkthroughProgress}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-500 font-mono">{walkthroughProgress}% complete</span>
        </div>
      )}

      {/* Bottom hint */}
      {!walkthrough && (
        <div className="absolute bottom-4 right-4 z-20 text-xs text-gray-500 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
          Drag to rotate · Scroll to zoom
        </div>
      )}

      <Canvas shadows="percentage" camera={{ position: [18, 20, 18], fov: 42 }}>
        <color attach="background" args={['#0a0b12']} />

        {/* Lighting — warm, realistic interior feel */}
        <ambientLight intensity={0.6} color="#fff8f0" />
        <directionalLight
          position={[15, 25, 10]}
          intensity={2.2}
          color="#fff5e8"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={80}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        <directionalLight position={[-10, 15, -5]} intensity={0.4} color="#b8a8ff" />
        <pointLight position={[0, 8, 0]} intensity={0.6} color="#ffe8c8" />
        <pointLight position={[-5, 4, 5]} intensity={0.3} color="#ffd8a0" />

        {/* Foundation slab */}
        <mesh position={[0, -0.1, 0]} receiveShadow>
          <boxGeometry args={[26, 0.16, 26]} />
          <meshPhysicalMaterial color="#3a3a3c" roughness={0.85} />
        </mesh>

        {/* Ground plane (grass/pavement) */}
        <mesh position={[0, -0.19, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[50, 50]} />
          <meshPhysicalMaterial color="#2a2a2e" roughness={1} />
        </mesh>

        {/* All rooms */}
        {rooms.map((room: any, i: number) => (
          <Room key={`${i}-${JSON.stringify(room)}`} room={room} wallColor={wallColor} />
        ))}

        {/* Walkthrough camera */}
        <WalkthroughCamera
          rooms={rooms}
          active={walkthrough}
          onComplete={handleWalkthroughEnd}
          onRoomChange={handleRoomChange}
        />

        <ContactShadows position={[0, -0.02, 0]} opacity={0.45} scale={40} blur={2.5} far={12} />
        <Environment preset="apartment" />

        <OrbitControls
          ref={controlsRef}
          makeDefault
          autoRotate={!walkthrough}
          autoRotateSpeed={0.35}
          maxPolarAngle={Math.PI / 2.15}
          minPolarAngle={Math.PI / 7}
          minDistance={6}
          maxDistance={45}
          target={[0, 1, 0]}
          enabled={!walkthrough}
        />
      </Canvas>
    </div>
  );
}
