import { VIRTUAL_SHEET_HEIGHT, executeNesting } from "../src/lib/nesting-algorithm";

console.log("VIRTUAL_SHEET_HEIGHT =", VIRTUAL_SHEET_HEIGHT);

const imgs = [
  { id: "A", url: "/a.png", width: 4, height: 3, aspectRatio: 4/3, copies: 1 },
];

(async () => {
  const out = await executeNesting(imgs, 13);
  console.log("sheetLength:", out.sheetLength, "areaUtilizationPct:", out.areaUtilizationPct);
})();
