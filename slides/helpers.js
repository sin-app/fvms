const pptxgen = require("pptxgenjs");

function addBadge(pres, slide, theme, num) {
  slide.addShape(pres.shapes.OVAL, { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fill: { color: theme.accent } });
  slide.addText(String(num), { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fontFace: "Arial", fontSize: 12, color: "FFFFFF", bold: true, align: "center", valign: "middle" });
}

function addHeader(pres, slide, theme, kicker, title) {
  slide.addText(kicker, { x: 0.6, y: 0.35, w: 8.5, h: 0.3, fontFace: "Trebuchet MS", fontSize: 12, color: theme.accent, bold: true, charSpacing: 2 });
  slide.addText(title, { x: 0.6, y: 0.63, w: 8.8, h: 0.7, fontFace: "Trebuchet MS", fontSize: 30, color: theme.primary, bold: true });
  slide.addShape(pres.shapes.RECTANGLE, { x: 0.62, y: 1.36, w: 1.1, h: 0.07, fill: { color: theme.accent } });
}

module.exports = { addBadge, addHeader };
