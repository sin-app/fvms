/**
 * gen-functional-docx.js
 * Hasilkan proposal/FVMS-Penjelasan-Fungsional.docx dari
 * docs/ENTERPRISE/Penjelasan-Fungsional.md (tanpa bahasa teknis).
 * Membangun OOXML secara langsung via jszip, termasuk penyisipan gambar UI.
 */
const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");

const SRC = path.join(__dirname, "docs", "ENTERPRISE", "Penjelasan-Fungsional.md");
const OUT = path.join(__dirname, "proposal", "FVMS-Penjelasan-Fungsional.docx");

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function para(text, style) {
  const pPr = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : "";
  return `<w:p>${pPr}<w:r><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
}

function bullet(text) {
  return `<w:p><w:pPr><w:ind w:left="360" w:hanging="360"/></w:pPr><w:r><w:t xml:space="preserve">${esc(
    "•  " + text
  )}</w:t></w:r></w:p>`;
}

function tableRow(cells, isHeader) {
  const tcs = cells
    .map((c) => {
      const shd = isHeader ? `<w:shd w:val="clear" w:color="auto" w:fill="1B5E20"/>` : "";
      const rPr = isHeader ? `<w:rPr><w:b/><w:color w:val="FFFFFF"/></w:rPr>` : "";
      return `<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/>${shd}</w:tcPr><w:p><w:r>${rPr}<w:t xml:space="preserve">${esc(
        c
      )}</w:t></w:r></w:p></w:tc>`;
    })
    .join("");
  return `<w:tr>${tcs}</w:tr>`;
}

function buildDocx() {
  const zip = new JSZip();
  const mediaRels = [];
  let imgN = 0;
  let relN = 10;
  let hasPng = false;

  function addImage(relPath) {
    const full = path.resolve(__dirname, relPath);
    if (!fs.existsSync(full)) return para("[Gambar tidak ditemukan: " + relPath + "]");
    const buf = fs.readFileSync(full);
    imgN++;
    const rId = "rId" + relN++;
    const target = "media/image" + imgN + ".png";
    zip.folder("word").folder("media").file("image" + imgN + ".png", buf);
    mediaRels.push({ rId, target });
    hasPng = true;
    const wPx = buf.readUInt32BE(16);
    const hPx = buf.readUInt32BE(20);
    const EMU = 9525;
    let wEMU = wPx * EMU;
    let hEMU = hPx * EMU;
    const maxW = 5950000;
    if (wEMU > maxW) {
      const s = maxW / wEMU;
      wEMU = maxW;
      hEMU = Math.round(hEMU * s);
    }
    wEMU = Math.round(wEMU);
    hEMU = Math.round(hEMU);
    const id = imgN;
    return (
      `<w:p><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" ` +
      `xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ` +
      `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ` +
      `xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ` +
      `xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
      `<wp:extent cx="${wEMU}" cy="${hEMU}"/><wp:effectExtent l="0" t="0" r="0" b="0"/>` +
      `<wp:docPr id="${id}" name="Picture${id}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>` +
      `<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic>` +
      `<pic:nvPicPr><pic:cNvPr id="${id}" name="pic${id}"/><pic:cNvPicPr/></pic:nvPicPr>` +
      `<pic:blipFill><a:blip r:embed="${rId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
      `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${wEMU}" cy="${hEMU}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
      `</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`
    );
  }

  function buildBody(md) {
    const lines = md.split(/\r?\n/);
    const out = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (line.trim() === "") {
        i++;
        continue;
      }
      if (/^!\[.*\]\(.+\)$/.test(line)) {
        const m = line.match(/^!\[(.*)\]\((.+)\)$/);
        const alt = m[1];
        const imgPath = m[2].trim();
        out.push(addImage(imgPath));
        out.push(para(alt));
        i++;
        continue;
      }
      if (line.includes("|") && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|/.test(lines[i + 1]) && lines[i + 1].includes("-")) {
        const splitRow = (l) => {
          let s = l.trim();
          if (s.startsWith("|")) s = s.slice(1);
          if (s.endsWith("|")) s = s.slice(0, -1);
          return s.split("|").map((c) => c.trim());
        };
        const header = splitRow(line);
        i += 2;
        const rows = [];
        while (i < lines.length && lines[i].includes("|") && lines[i].trim() !== "") {
          rows.push(splitRow(lines[i]));
          i++;
        }
        const grid = header.map(() => `<w:gridCol w:w="0"/>`).join("");
        const bodyTbl =
          tableRow(header, true) + rows.map((r) => tableRow(r, false)).join("");
        out.push(
          `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders>` +
            ["top", "bottom", "left", "right", "insideH", "insideV"]
              .map((e) => `<w:${e} w:val="single" w:sz="4" w:space="0" w:color="999999"/>`)
              .join("") +
            `</w:tblBorders></w:tblPr><w:tblGrid>${grid}</w:tblGrid>${bodyTbl}</w:tbl>`
        );
        continue;
      }
      if (line.startsWith("### ")) {
        out.push(para(line.slice(4), "Heading2"));
        i++;
        continue;
      }
      if (line.startsWith("## ")) {
        out.push(para(line.slice(3), "Heading1"));
        i++;
        continue;
      }
      if (line.startsWith("# ")) {
        out.push(para(line.slice(2), "Title"));
        i++;
        continue;
      }
      if (/^[-*]\s+/.test(line)) {
        out.push(bullet(line.replace(/^[-*]\s+/, "")));
        i++;
        continue;
      }
      out.push(para(line, "Normal"));
      i++;
    }
    return out.join("");
  }

  const md = fs.readFileSync(SRC, "utf8");
  const body = buildBody(md);

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
${body}
<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:bottom="1440" w:left="1440" w:right="1440"/></w:sectPr>
</w:body>
</w:document>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri"/><w:sz w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:pPr><w:spacing w:after="240"/></w:pPr><w:rPr><w:b/><w:sz w:val="44"/><w:color w:val="14281E"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:pPr><w:spacing w:before="240" w:after="120"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:sz w:val="30"/><w:color w:val="1B5E20"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:pPr><w:spacing w:before="160" w:after="80"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="2E7D32"/></w:rPr></w:style>
</w:styles>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>${hasPng ? '\n<Default Extension="png" ContentType="image/png"/>' : ""}
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

  let docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`;
  mediaRels.forEach((r) => {
    docRels += `\n<Relationship Id="${r.rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${r.target}"/>`;
  });
  docRels += `\n</Relationships>`;

  const core = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:title>FVMS - Penjelasan Fungsional</dc:title>
<dc:creator>FVMS</dc:creator>
<cp:lastModifiedBy>FVMS</cp:lastModifiedBy>
</cp:coreProperties>`;

  const app = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
<Application>FVMS Generator</Application>
</Properties>`;

  zip.file("[Content_Types].xml", contentTypes);
  zip.folder("_rels").file(".rels", rels);
  zip.folder("word").file("document.xml", documentXml);
  zip.folder("word").file("styles.xml", stylesXml);
  zip.folder("word").folder("_rels").file("document.xml.rels", docRels);
  zip.folder("docProps").file("core.xml", core);
  zip.folder("docProps").file("app.xml", app);

  return zip
    .generateAsync({ type: "nodebuffer", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })
    .then((buf) => {
      fs.writeFileSync(OUT, buf);
      console.log("Saved:", OUT, buf.length, "bytes; images:", imgN);
    });
}

buildDocx().catch((e) => {
  console.error(e);
  process.exit(1);
});
