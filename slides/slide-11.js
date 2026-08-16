const pptxgen = require("pptxgenjs");
const { addBadge, addHeader } = require("./helpers");

const config = { type: "content", index: 11, title: "Fondasi yang Andal & Aman" };

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  addHeader(pres, slide, theme, "Keamanan & Teknologi", "Fondasi yang Andal & Aman");

  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 1.75, w: 4.3, h: 3.0, fill: { color: "FFFFFF" }, line: { color: theme.light, width: 1 }, rectRadius: 0.1 });
  slide.addText("Teknologi", { x: 0.85, y: 1.95, w: 3.8, h: 0.4, fontFace: "Trebuchet MS", fontSize: 16, color: theme.primary, bold: true });
  const techs = [
    "Next.js 16 & React (TypeScript)",
    "Supabase: PostgreSQL, Auth, Storage",
    "Tailwind CSS & shadcn/ui",
    "PWA — mendukung mode offline",
    "Deploy Vercel + cron harian",
  ];
  let ty = 2.5;
  techs.forEach((t) => {
    slide.addShape(pres.shapes.OVAL, { x: 0.85, y: ty + 0.05, w: 0.16, h: 0.16, fill: { color: theme.secondary } });
    slide.addText(t, { x: 1.12, y: ty - 0.04, w: 3.6, h: 0.35, fontFace: "Calibri", fontSize: 12, color: theme.secondary });
    ty += 0.45;
  });

  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.1, y: 1.75, w: 4.3, h: 3.0, fill: { color: theme.primary }, rectRadius: 0.1 });
  slide.addText("Keamanan", { x: 5.35, y: 1.95, w: 3.8, h: 0.4, fontFace: "Trebuchet MS", fontSize: 16, color: "FFFFFF", bold: true });
  const secs = [
    "Row-Level Security per peran (RLS)",
    "Foto di private bucket (signed URL)",
    "Rate-limit login & reset password",
    "CSP & security headers ketat",
    "Logger terstruktur + request-ID",
  ];
  let sy = 2.5;
  secs.forEach((s) => {
    slide.addShape(pres.shapes.OVAL, { x: 5.35, y: sy + 0.05, w: 0.16, h: 0.16, fill: { color: theme.light } });
    slide.addText(s, { x: 5.62, y: sy - 0.04, w: 3.6, h: 0.35, fontFace: "Calibri", fontSize: 12, color: "FFFFFF" });
    sy += 0.45;
  });

  addBadge(pres, slide, theme, 11);
  return slide;
}

if (require.main === module) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  const theme = { primary: "283618", secondary: "606c38", accent: "bc6c25", light: "dda15e", bg: "fefae0" };
  createSlide(pres, theme);
  pres.writeFile({ fileName: "slide-09-preview.pptx" });
}

module.exports = { createSlide, config };
