import * as r from "raylib";

const screenWidth = 800
const screenHeight = 450
r.InitWindow(screenWidth, screenHeight, "raylib [core] example - basic window")
r.SetTargetFPS(60)

while (!r.WindowShouldClose()) {
    r.BeginDrawing();
    r.ClearBackground(r.RAYWHITE)
    r.DrawText("Congrats! You created your first node-raylib window!", 120, 200, 20, r.LIGHTGRAY)
    r.EndDrawing()
}

r.CloseWindow()

// const DEFAULT_GRID = 8;
//
// interface Cell {
//     x: number;
//     y: number;
//     isAlive: boolean;
// }
//
// interface Grid {
//     rows: Cell[];
//     cols: Cell[];
// }
//
// const main = (args: string[], argc: number) => {
//     assert(argc > 3, "Please supply only the size of the grid in number ( eg: 8 )");
//     if(args[2] === "--help") {
//         return ;
//     }
//     const size = args[0] ??
//     const grid = {
//         rows: [],
//         cols: [],
//     }
//
//     for (let i = 0; i < 
//
// };
//
// if (import.meta.main) {
//     const args = process.argv;
//
//     main(args, args.length);
// }
