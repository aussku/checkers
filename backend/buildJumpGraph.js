#!/usr/bin/env node
// scripts/buildJumpGraph.js
//
// Derives JUMP_GRAPH from MOVEMENT_GRAPH + cell pixel coordinates.
// Run this whenever the board layout or movement graph changes:
//
//   node scripts/buildJumpGraph.js
//
// Paste the printed constant into boardService.js, replacing the existing JUMP_GRAPH.
//
// Why coordinates are needed here but not in boardService.js:
// Hub cells (e.g. RD_4D) sit at the crossing of multiple non-collinear diagonals.
// The movement graph alone cannot distinguish a valid jump (A→hub→B on the same
// diagonal) from an invalid one (A→hub→C where C is on a different diagonal).
// The midpoint proximity test resolves this: for a valid jump, the hub cell lies
// near the midpoint of the source and landing cells. Threshold: 50px.
// Gap in the data: valid jumps have midpoint error ≤ 46.5px; invalid ones ≥ 52.6px.

const BOARD_POSITIONS = {
  "RD_4D":{x:460.8,y:568.0},"RD_4C":{x:389.3,y:604.5},"RD_3D":{x:465.3,y:650.0},
  "RD_4B":{x:322.8,y:638.0},"RD_3C":{x:400.8,y:675.3},"RD_2D":{x:469.0,y:725.5},
  "RD_4A":{x:257.3,y:671.0},"RD_3B":{x:341.8,y:696.8},"RD_2C":{x:410.3,y:739.8},
  "RD_1D":{x:471.8,y:796.8},"RD_3A":{x:282.5,y:720.0},"RD_2B":{x:356.8,y:752.3},
  "RD_1C":{x:417.8,y:800.5},"RD_2A":{x:303.8,y:766.0},"RD_1B":{x:368.3,y:804.3},
  "RD_1A":{x:321.3,y:808.5},"BL_E4":{x:421.5,y:500.0},"BL_E3":{x:354.1,y:456.3},
  "BL_F4":{x:352.7,y:544.9},"BL_E2":{x:291.9,y:415.5},"BL_F3":{x:298.6,y:501.7},
  "BL_G4":{x:289.2,y:585.9},"BL_E1":{x:230.5,y:375.3},"BL_F2":{x:250.5,y:461.3},
  "BL_G3":{x:247.5,y:542.1},"BL_H4":{x:228.9,y:623.9},"BL_F1":{x:200.7,y:421.6},
  "BL_G2":{x:209.9,y:502.1},"BL_H3":{x:198.6,y:579.0},"BL_G1":{x:171.5,y:463.0},
  "BL_H2":{x:170.6,y:538.0},"BL_H1":{x:143.5,y:499.4},"BD_4D":{x:460.7,y:432.0},
  "BD_4C":{x:464.9,y:351.8},"BD_3D":{x:387.5,y:394.9},"BD_4B":{x:469.1,y:277.5},
  "BD_3C":{x:397.9,y:326.4},"BD_2D":{x:320.2,y:360.4},"BD_4A":{x:473.3,y:204.3},
  "BD_3B":{x:408.7,y:264.6},"BD_2C":{x:337.2,y:302.4},"BD_1D":{x:257.1,y:327.2},
  "BD_3A":{x:418.2,y:201.6},"BD_2B":{x:353.2,y:249.8},"BD_1C":{x:280.9,y:278.5},
  "BD_2A":{x:367.8,y:197.0},"BD_1B":{x:302.4,y:233.8},"BD_1A":{x:322.2,y:190.9},
  "GL_E4":{x:539.3,y:432.0},"GL_E3":{x:610.8,y:395.5},"GL_F4":{x:534.8,y:350.0},
  "GL_E2":{x:677.3,y:362.0},"GL_F3":{x:599.3,y:324.8},"GL_G4":{x:531.0,y:274.5},
  "GL_E1":{x:742.8,y:329.0},"GL_F2":{x:658.3,y:303.3},"GL_G3":{x:589.8,y:260.3},
  "GL_H4":{x:528.3,y:203.3},"GL_F1":{x:717.5,y:280.0},"GL_G2":{x:643.3,y:247.8},
  "GL_H3":{x:582.3,y:199.5},"GL_G1":{x:696.3,y:234.0},"GL_H2":{x:631.8,y:195.8},
  "GL_H1":{x:678.8,y:191.5},"GD_4D":{x:578.5,y:500.0},"GD_4C":{x:645.9,y:543.7},
  "GD_3D":{x:647.3,y:455.1},"GD_4B":{x:708.1,y:584.5},"GD_3C":{x:701.4,y:498.3},
  "GD_2D":{x:710.8,y:414.1},"GD_4A":{x:769.5,y:624.7},"GD_3B":{x:749.5,y:538.7},
  "GD_2C":{x:752.5,y:457.9},"GD_1D":{x:771.1,y:376.1},"GD_3A":{x:799.3,y:578.4},
  "GD_2B":{x:790.1,y:497.9},"GD_1C":{x:801.4,y:421.0},"GD_2A":{x:828.5,y:537.0},
  "GD_1B":{x:829.4,y:462.0},"GD_1A":{x:856.5,y:500.6},"RL_E4":{x:539.3,y:568.0},
  "RL_E3":{x:535.1,y:648.2},"RL_F4":{x:612.5,y:605.1},"RL_E2":{x:530.9,y:722.5},
  "RL_F3":{x:602.1,y:673.6},"RL_G4":{x:679.8,y:639.6},"RL_E1":{x:526.7,y:795.7},
  "RL_F2":{x:591.3,y:735.4},"RL_G3":{x:662.8,y:697.6},"RL_H4":{x:742.9,y:672.8},
  "RL_F1":{x:581.8,y:798.4},"RL_G2":{x:646.8,y:750.2},"RL_H3":{x:719.1,y:721.5},
  "RL_G1":{x:632.2,y:803.0},"RL_H2":{x:697.6,y:766.2},"RL_H1":{x:677.8,y:809.1},
};

const STARTING_SECTORS = {
  blue:{outer:"BD",inner:"BL"}, green:{outer:"GD",inner:"GL"}, red:{outer:"RD",inner:"RL"},
};
const CROSS_SECTOR_EDGES = [
  ["RD_4B","BL_H4"],["RD_4B","BL_F4"],["RD_4D","BL_F4"],
  ["BD_4B","GL_H4"],["BD_4B","GL_F4"],["BD_4D","GL_F4"],
  ["GD_4B","RL_H4"],["GD_4B","RL_F4"],["GD_4D","RL_F4"],
  ["RD_4D","BD_4D"],["BD_4D","GD_4D"],["GD_4D","RD_4D"],
];

function buildMovementGraph() {
  const g = {};
  function addEdge(a, b) {
    if (!g[a]) g[a] = new Set(); if (!g[b]) g[b] = new Set();
    g[a].add(b); g[b].add(a);
  }
  for (const { outer, inner } of Object.values(STARTING_SECTORS)) {
    addEdge(`${outer}_1A`,`${outer}_2B`); addEdge(`${outer}_1C`,`${outer}_2B`);
    addEdge(`${outer}_1C`,`${outer}_2D`); addEdge(`${outer}_2B`,`${outer}_3A`);
    addEdge(`${outer}_2B`,`${outer}_3C`); addEdge(`${outer}_2D`,`${outer}_3C`);
    addEdge(`${outer}_3A`,`${outer}_4B`); addEdge(`${outer}_3C`,`${outer}_4B`);
    addEdge(`${outer}_3C`,`${outer}_4D`); addEdge(`${outer}_1C`,`${inner}_E1`);
    addEdge(`${outer}_2D`,`${inner}_E1`); addEdge(`${outer}_2D`,`${inner}_E3`);
    addEdge(`${outer}_4D`,`${inner}_E3`); addEdge(`${inner}_E1`,`${inner}_F2`);
    addEdge(`${inner}_E3`,`${inner}_F2`); addEdge(`${inner}_E3`,`${inner}_F4`);
    addEdge(`${inner}_F2`,`${inner}_G1`); addEdge(`${inner}_F2`,`${inner}_G3`);
    addEdge(`${inner}_F4`,`${inner}_G3`); addEdge(`${inner}_G1`,`${inner}_H2`);
    addEdge(`${inner}_G3`,`${inner}_H2`); addEdge(`${inner}_G3`,`${inner}_H4`);
  }
  CROSS_SECTOR_EDGES.forEach(([a, b]) => addEdge(a, b));
  return Object.fromEntries(Object.entries(g).map(([k, v]) => [k, [...v].sort()]));
}

const MOVEMENT_GRAPH = buildMovementGraph();
const THRESHOLD = 50;

const jumpGraph = {};
for (const [from, neighbors] of Object.entries(MOVEMENT_GRAPH)) {
  const fromSet = new Set(neighbors);
  const jumps = [];
  for (const over of neighbors) {
    for (const to of (MOVEMENT_GRAPH[over] || [])) {
      if (to === from || fromSet.has(to)) continue;
      const pF = BOARD_POSITIONS[from], pO = BOARD_POSITIONS[over], pT = BOARD_POSITIONS[to];
      if (!pF || !pO || !pT) continue;
      const dist = Math.hypot((pF.x + pT.x) / 2 - pO.x, (pF.y + pT.y) / 2 - pO.y);
      if (dist <= THRESHOLD) jumps.push({ over, to });
    }
  }
  if (jumps.length) jumpGraph[from] = jumps;
}

const total = Object.values(jumpGraph).reduce((s, v) => s + v.length, 0);

console.log(`// JUMP_GRAPH — computed from cell coordinates at build time.`);
console.log(`// Keys are source cells; values list valid (over, to) jump pairs.`);
console.log(`// Do not edit manually. Regenerate: node scripts/buildJumpGraph.js`);
console.log(`const JUMP_GRAPH = {`);
for (const [from, jumps] of Object.entries(jumpGraph).sort()) {
  console.log(`  "${from}": [`);
  for (const j of jumps) console.log(`    { over: "${j.over}", to: "${j.to}" },`);
  console.log(`  ],`);
}
console.log(`};`);