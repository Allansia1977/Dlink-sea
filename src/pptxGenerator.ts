import pptxgen from "pptxgenjs";
import { Store } from "./store";

export async function generatePPTX(stores: Store[]): Promise<pptxgen> {
  const pptx = new pptxgen();

  pptx.author = "Retail Audit App";
  pptx.company = "Retail Audit";
  pptx.revision = "1";
  pptx.subject = "Store Photos";
  pptx.title = "Retail Store Audit";

  for (const store of stores) {
    if (store.photos.length === 0) continue;

    // Chunk photos into groups of 16
    for (let i = 0; i < store.photos.length; i += 16) {
      const slidePhotos = store.photos.slice(i, i + 16);
      const slide = pptx.addSlide();

      const todayDate = new Date().toLocaleDateString();
      // Add Title
      if (store.type === 'custom') {
        slide.addText(`Custom Data: ${store.topic}`, {
          x: 0.5,
          y: 0.1,
          w: "90%",
          h: 0.4,
          fontSize: 20,
          bold: true,
          color: "363636",
          align: "center",
        });

        if (store.remark) {
          slide.addText(`Remark: ${store.remark}`, {
            x: 0.5,
            y: 0.5,
            w: "90%",
            h: 0.3,
            fontSize: 12,
            color: "666666",
            align: "center",
          });
        }
      } else {
        slide.addText(`${store.name} - ${store.location} - ${todayDate}`, {
          x: 0.5,
          y: 0.1,
          w: "90%",
          h: 0.4,
          fontSize: 20,
          bold: true,
          color: "363636",
          align: "center",
        });

        if (store.topic || store.remark) {
          const subtitleText = [
            store.topic ? `Topic: ${store.topic}` : "",
            store.remark ? `Remark: ${store.remark}` : ""
          ].filter(Boolean).join(" | ");

          slide.addText(subtitleText, {
            x: 0.5,
            y: 0.5,
            w: "90%",
            h: 0.3,
            fontSize: 12,
            color: "666666",
            align: "center",
          });
        }
      }

      // Add Photos (up to 16 per slide)
      // Layout: 4 rows, 4 columns (4:3 aspect ratio)
      // Centered grid: (10 - 4*1.6) / 2 = 1.8 start X
      const xPositions = [1.8, 3.4, 5.0, 6.6];
      const yPositions = [0.85, 2.05, 3.25, 4.45];

      slidePhotos.forEach((photoData, index) => {
        const row = Math.floor(index / 4);
        const col = index % 4;
        
        slide.addImage({
          data: photoData,
          x: xPositions[col],
          y: yPositions[row],
          w: 1.6,
          h: 1.2,
          sizing: { type: "contain", w: 1.6, h: 1.2 },
        });
      });

      // Add Logo to top right (at the end to ensure it's on top)
      slide.addImage({
        path: "https://image2url.com/r2/default/images/1774539321646-8a904fc8-3f76-4d0a-a55e-4278dfbafa78.jpg",
        x: 9.56,
        y: 0.04,
        w: 0.4,
        h: 0.4,
      });
    }
  }

  return pptx;
}
