const pptxgen = require("pptxgenjs");
const fs = require("fs");
const path = require("path");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";

const theme = {
  primary: "283618",
  secondary: "606c38",
  accent: "bc6c25",
  light: "dda15e",
  bg: "fefae0",
};

for (let i = 1; i <= 14; i++) {
  const num = String(i).padStart(2, "0");
  const mod = require(`./slide-${num}.js`);
  mod.createSlide(pres, theme);
}

const outDir = path.resolve(__dirname, "../proposal");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const outFile = path.join(outDir, "FVMS-Proposal.pptx");
pres.writeFile({ fileName: outFile }).then((f) => {
  console.log("Saved:", f);
}).catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
