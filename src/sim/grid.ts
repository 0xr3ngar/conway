export const TRAIL_STEPS = 28;

const KEY_OFFSET = 1 << 20;
const KEY_STRIDE = KEY_OFFSET * 2;

export const cellKey = (x: number, y: number) => (x + KEY_OFFSET) * KEY_STRIDE + (y + KEY_OFFSET);

const keyX = (key: number) => Math.floor(key / KEY_STRIDE) - KEY_OFFSET;
const keyY = (key: number) => (key % KEY_STRIDE) - KEY_OFFSET;

export interface Grid {
    cells: Record<number, number>;
    decay: Record<number, number>;
    generation: number;
    population: number;
}

export const createGrid = () => {
    const grid: Grid = {
        cells: {},
        decay: {},
        generation: 0,
        population: 0,
    };
    return grid;
};

export const step = (grid: Grid) => {
    const { cells, decay } = grid;

    const neighborTally: Record<number, number> = {};
    for (const rawKey of Object.keys(cells)) {
        const key = Number(rawKey);
        const x = keyX(key);
        const y = keyY(key);
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const isCenter = dx === 0 && dy === 0;
                if (isCenter) continue;
                const neighborKey = cellKey(x + dx, y + dy);
                neighborTally[neighborKey] = (neighborTally[neighborKey] ?? 0) + 1;
            }
        }
    }

    const next: Record<number, number> = {};
    for (const rawKey of Object.keys(neighborTally)) {
        const key = Number(rawKey);
        const count = neighborTally[key] ?? 0;
        const isAlive = cells[key] !== undefined;
        const survives = isAlive ? count === 2 || count === 3 : count === 3;
        if (!survives) continue;

        const currentAge = cells[key] ?? 0;
        const nextAge = isAlive ? Math.min(0xffff, currentAge + 1) : 0;
        next[key] = nextAge;
    }

    const nextDecay: Record<number, number> = {};
    for (const rawKey of Object.keys(cells)) {
        const key = Number(rawKey);
        const justDied = next[key] === undefined;
        if (!justDied) continue;
        nextDecay[key] = TRAIL_STEPS;
    }
    for (const rawKey of Object.keys(decay)) {
        const key = Number(rawKey);
        const isResurrected = next[key] !== undefined;
        if (isResurrected) continue;
        const remaining = (decay[key] ?? 0) - 1;
        if (remaining > 0) nextDecay[key] = remaining;
    }

    grid.cells = next;
    grid.decay = nextDecay;
    grid.generation++;
    grid.population = Object.keys(next).length;
};

export const paintCell = (grid: Grid, x: number, y: number, alive: boolean) => {
    const key = cellKey(x, y);
    const isAlive = grid.cells[key] !== undefined;
    if (isAlive === alive) return;

    if (alive) {
        grid.cells[key] = 0;
        delete grid.decay[key];
        grid.population++;
        return;
    }

    delete grid.cells[key];
    grid.decay[key] = TRAIL_STEPS;
    grid.population--;
};

export const clearGrid = (grid: Grid) => {
    grid.cells = {};
    grid.decay = {};
    grid.generation = 0;
    grid.population = 0;
};

export const seedRandom = (grid: Grid, density: number, cols: number, rows: number) => {
    clearGrid(grid);
    const halfCols = Math.floor(cols / 2);
    const halfRows = Math.floor(rows / 2);
    for (let y = -halfRows; y < halfRows; y++) {
        for (let x = -halfCols; x < halfCols; x++) {
            const hit = Math.random() < density;
            if (!hit) continue;
            grid.cells[cellKey(x, y)] = 0;
            grid.population++;
        }
    }
};
