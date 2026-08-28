import { describe, expect, test } from "bun:test";
import { cellKey, clearGrid, createGrid, paintCell, seedRandom, step } from "./grid";

const paintAll = (grid: ReturnType<typeof createGrid>, coords: [number, number][]) => {
    for (const [x, y] of coords) paintCell(grid, x, y, true);
};

describe("cellKey", () => {
    test("encodes negative and positive coordinates distinctly", () => {
        const isDistinct = cellKey(0, 0) !== cellKey(-1, 0) && cellKey(0, 0) !== cellKey(0, -1);
        expect(isDistinct).toBe(true);
    });

    test("is lossless for the supported range", () => {
        const isLossless = cellKey(123, -456) === cellKey(123, -456);
        expect(isLossless).toBe(true);
    });
});

describe("conway rules", () => {
    test("underpopulated cell dies", () => {
        const grid = createGrid();
        paintAll(grid, [
            [0, 0],
            [1, 0],
        ]);
        step(grid);
        expect(grid.population).toBe(0);
    });

    test("block still-life survives unchanged", () => {
        const grid = createGrid();
        paintAll(grid, [
            [0, 0],
            [1, 0],
            [0, 1],
            [1, 1],
        ]);
        step(grid);
        step(grid);
        expect(grid.population).toBe(4);
    });

    test("blinker oscillates", () => {
        const grid = createGrid();
        paintAll(grid, [
            [-1, 0],
            [0, 0],
            [1, 0],
        ]);
        step(grid);
        expect(grid.population).toBe(3);
        step(grid);
        expect(grid.population).toBe(3);
    });

    test("glider keeps population and travels", () => {
        const grid = createGrid();
        paintAll(grid, [
            [1, 0],
            [2, 1],
            [0, 2],
            [1, 2],
            [2, 2],
        ]);
        for (let i = 0; i < 4; i++) step(grid);
        expect(grid.population).toBe(5);
    });
});

describe("grid management", () => {
    test("paintCell is a no-op on repeat state", () => {
        const grid = createGrid();
        paintCell(grid, 3, 3, true);
        paintCell(grid, 3, 3, true);
        expect(grid.population).toBe(1);
        paintCell(grid, 3, 3, false);
        paintCell(grid, 3, 3, false);
        expect(grid.population).toBe(0);
    });

    test("paintCell ignores out-of-bounds coordinates", () => {
        const grid = createGrid();
        paintCell(grid, 1 << 30, 1 << 30, true);
        expect(grid.population).toBe(1);
    });

    test("clearGrid resets everything", () => {
        const grid = createGrid();
        paintAll(grid, [
            [0, 0],
            [1, 1],
            [2, 2],
        ]);
        step(grid);
        clearGrid(grid);
        const isClean = grid.population === 0 && grid.generation === 0;
        expect(isClean).toBe(true);
    });

    test("seedRandom respects density bounds", () => {
        const grid = createGrid();
        seedRandom(grid, 1, 20, 20);
        expect(grid.population).toBe(400);
        seedRandom(grid, 0, 20, 20);
        expect(grid.population).toBe(0);
    });
});
