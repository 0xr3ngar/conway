import * as r from "raylib";
import { TRAIL_STEPS } from "../sim/grid";

type Rgb = { r: number; g: number; b: number };

export const BG = { r: 24, g: 26, b: 32, a: 255 };
export const GRID_LINE = { r: 38, g: 40, b: 48, a: 255 };
export const HUD = { r: 160, g: 168, b: 180, a: 255 };

const YOUNG = { r: 190, g: 255, b: 225 };
const FRESH = { r: 64, g: 230, b: 190 };
const MATURE = { r: 30, g: 150, b: 210 };
const ANCIENT = { r: 110, g: 80, b: 200 };

const mix = (from: Rgb, to: Rgb, t: number): Rgb => ({
    r: Math.round(from.r + (to.r - from.r) * t),
    g: Math.round(from.g + (to.g - from.g) * t),
    b: Math.round(from.b + (to.b - from.b) * t),
});

const toColor = (c: Rgb): r.Color => ({ r: c.r, g: c.g, b: c.b, a: 255 });

export const ageColor = (age: number): r.Color => {
    const clamped = Math.min(90, Math.max(0, age));
    const isYoung = clamped <= 12;
    if (isYoung) return toColor(mix(YOUNG, FRESH, clamped / 12));
    const isFresh = clamped <= 36;
    if (isFresh) return toColor(mix(FRESH, MATURE, (clamped - 12) / 24));
    return toColor(mix(MATURE, ANCIENT, (clamped - 36) / 54));
};

export const decayColor = (decay: number): r.Color => {
    const t = Math.min(1, Math.max(0, decay / TRAIL_STEPS));
    return { r: 60, g: 90, b: 110, a: Math.round(t * 70) };
};
