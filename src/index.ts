import * as r from "raylib";
import { cellKey, clearGrid, createGrid, paintCell, seedRandom, step } from "./sim/grid";
import { ageColor, BG, decayColor, GRID_LINE, HUD } from "./render/palette";

const TARGET_FPS = 60;
const SCREEN_WIDTH = 1280;
const SCREEN_HEIGHT = 720;
const CELL = 12;
const SEED_COLS = 110;
const SEED_ROWS = 62;
const NOISE_DENSITY = 0.26;
const ZOOM_MIN = 0.4;
const ZOOM_MAX = 6;
const MAX_STEPS_PER_SECOND = 60;
const MIN_STEPS_PER_SECOND = 1;

r.InitWindow(SCREEN_WIDTH, SCREEN_HEIGHT, "Conway's Game of Life");
r.SetTargetFPS(TARGET_FPS);

const grid = createGrid();

const camera: r.Camera2D = {
    offset: r.Vector2Zero(),
    target: r.Vector2Zero(),
    rotation: 0,
    zoom: 1,
};

let running = false;
let showGrid = true;
let stepsPerSecond = 12;
let stepAccumulator = 0;
let prevMouseWorld = r.Vector2Zero();
let prevScreen = r.Vector2Zero();

const worldToCell = (world: r.Vector2) => ({
    x: Math.floor(world.x / CELL),
    y: Math.floor(world.y / CELL),
});

const paintStroke = (from: r.Vector2, to: r.Vector2, alive: boolean) => {
    const startCell = worldToCell(from);
    const endCell = worldToCell(to);
    const distance = Math.max(Math.abs(endCell.x - startCell.x), Math.abs(endCell.y - startCell.y));
    const strokeSteps = Math.max(1, Math.ceil(distance / 2));
    for (let i = 0; i <= strokeSteps; i++) {
        const t = i / strokeSteps;
        const x = Math.round(startCell.x + (endCell.x - startCell.x) * t);
        const y = Math.round(startCell.y + (endCell.y - startCell.y) * t);
        paintCell(grid, x, y, alive);
    }
};

const drawGridLines = () => {
    const topLeft = r.GetScreenToWorld2D(r.Vector2Zero(), camera);
    const bottomRight = r.GetScreenToWorld2D({ x: SCREEN_WIDTH, y: SCREEN_HEIGHT }, camera);
    const startCol = Math.floor(topLeft.x / CELL);
    const endCol = Math.ceil(bottomRight.x / CELL);
    const startRow = Math.floor(topLeft.y / CELL);
    const endRow = Math.ceil(bottomRight.y / CELL);

    for (let col = startCol; col <= endCol; col++) {
        r.DrawLine(col * CELL, topLeft.y, col * CELL, bottomRight.y, GRID_LINE);
    }
    for (let row = startRow; row <= endRow; row++) {
        r.DrawLine(topLeft.x, row * CELL, bottomRight.x, row * CELL, GRID_LINE);
    }
};

const visibleCellBounds = () => {
    const topLeft = r.GetScreenToWorld2D(r.Vector2Zero(), camera);
    const bottomRight = r.GetScreenToWorld2D({ x: SCREEN_WIDTH, y: SCREEN_HEIGHT }, camera);
    return {
        startCol: Math.floor(topLeft.x / CELL),
        endCol: Math.ceil(bottomRight.x / CELL),
        startRow: Math.floor(topLeft.y / CELL),
        endRow: Math.ceil(bottomRight.y / CELL),
    };
};

const drawCells = () => {
    const bounds = visibleCellBounds();
    for (let row = bounds.startRow; row < bounds.endRow; row++) {
        for (let col = bounds.startCol; col < bounds.endCol; col++) {
            const key = cellKey(col, row);
            const isAlive = grid.cells[key] !== undefined;
            const decay = grid.decay[key] ?? 0;
            const isWorthDrawing = isAlive || decay > 0;
            if (!isWorthDrawing) continue;

            if (isAlive) {
                const age = grid.cells[key] ?? 0;
                const isNewborn = age < 3;
                const inset = isNewborn ? 0 : 1;
                r.DrawRectangle(
                    col * CELL + inset,
                    row * CELL + inset,
                    CELL - inset * 2,
                    CELL - inset * 2,
                    ageColor(age),
                );
            } else {
                r.DrawRectangle(
                    col * CELL + 1,
                    row * CELL + 1,
                    CELL - 2,
                    CELL - 2,
                    decayColor(decay),
                );
            }
        }
    }
};

const handleInput = () => {
    if (r.IsKeyPressed(r.KEY_SPACE)) running = !running;

    const isReset = r.IsKeyPressed(r.KEY_R);
    if (isReset) {
        clearGrid(grid);
        running = false;
    }

    if (r.IsKeyPressed(r.KEY_N)) seedRandom(grid, NOISE_DENSITY, SEED_COLS, SEED_ROWS);
    if (r.IsKeyPressed(r.KEY_G)) showGrid = !showGrid;
    if (r.IsKeyPressed(r.KEY_UP))
        stepsPerSecond = Math.min(MAX_STEPS_PER_SECOND, stepsPerSecond + 2);
    if (r.IsKeyPressed(r.KEY_DOWN))
        stepsPerSecond = Math.max(MIN_STEPS_PER_SECOND, stepsPerSecond - 2);

    const mouse = r.GetMousePosition();
    const mouseWorld = r.GetScreenToWorld2D(mouse, camera);
    const isPanning = r.IsMouseButtonDown(r.MOUSE_BUTTON_MIDDLE);
    if (isPanning) {
        camera.target.x -= (mouse.x - prevScreen.x) / camera.zoom;
        camera.target.y -= (mouse.y - prevScreen.y) / camera.zoom;
    }

    const wheel = r.GetMouseWheelMove();
    const isZooming = wheel !== 0 && !isPanning;
    if (isZooming) {
        const worldBefore = r.GetScreenToWorld2D(mouse, camera);
        camera.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, camera.zoom * (1 + wheel * 0.12)));
        const worldAfter = r.GetScreenToWorld2D(mouse, camera);
        camera.target.x += worldBefore.x - worldAfter.x;
        camera.target.y += worldBefore.y - worldAfter.y;
    }

    const isErasing = r.IsMouseButtonDown(r.MOUSE_BUTTON_RIGHT);
    const isPainting = r.IsMouseButtonDown(r.MOUSE_BUTTON_LEFT);
    const isStroking = isPainting || isErasing;
    if (isStroking) paintStroke(prevMouseWorld, mouseWorld, isPainting && !isErasing);

    prevMouseWorld = mouseWorld;
    prevScreen = mouse;
};

const runSimulation = () => {
    if (!running) {
        stepAccumulator = 0;
        return;
    }
    stepAccumulator += r.GetFrameTime();
    const stepInterval = 1 / stepsPerSecond;
    while (stepAccumulator >= stepInterval) {
        stepAccumulator -= stepInterval;
        step(grid);
    }
};

while (!r.WindowShouldClose()) {
    handleInput();
    runSimulation();

    r.BeginDrawing();
    r.ClearBackground(BG);
    r.BeginMode2D(camera);

    if (showGrid) drawGridLines();
    drawCells();

    r.EndMode2D();

    const status = running ? "running" : "paused";
    r.DrawText(
        `${status}   gen ${grid.generation}   pop ${grid.population}   ${stepsPerSecond} steps/s`,
        16,
        12,
        18,
        HUD,
    );
    r.DrawText(
        "SPACE run/pause   LMB draw   RMB erase   R reset   N noise   G grid   UP/DOWN speed   MMB drag pan   wheel zoom",
        16,
        SCREEN_HEIGHT - 28,
        16,
        HUD,
    );
    r.DrawFPS(SCREEN_WIDTH - 70, 12);

    r.EndDrawing();
}

r.CloseWindow();
