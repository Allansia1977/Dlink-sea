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

    // Chunk photos into groups of 8
    for (let i = 0; i < store.photos.length; i += 8) {
      const slidePhotos = store.photos.slice(i, i + 8);
      const slide = pptx.addSlide();

      const todayDate = new Date().toLocaleDateString();
      // Add Title
      slide.addText(`${store.name} - ${store.location} - ${todayDate}`, {
        x: 0.5,
        y: 0.2,
        w: "80%",
        h: 0.6,
        fontSize: 24,
        bold: true,
        color: "363636",
        align: "center",
      });

      // Add Logo at top right
      slide.addImage({
        path: "https://sg-media.apjonlinecdn.com/logo/stores/1/HP_New_logo_2.svg",
        x: 8.5,
        y: 0.1,
        w: 1.2,
        h: 0.6,
        sizing: { type: "contain", w: 1.2, h: 0.6 },
      });

      // Add Photos (up to 8 per slide)
      // Layout: 2 rows, 4 columns
      const xPositions = [0.2, 2.6, 5.0, 7.4];
      const yPositions = [1.0, 3.3];

      slidePhotos.forEach((photoData, index) => {
        const row = Math.floor(index / 4);
        const col = index % 4;
        
        slide.addImage({
          data: photoData,
          x: xPositions[col],
          y: yPositions[row],
          w: 2.3,
          h: 2.1,
          sizing: { type: "contain", w: 2.3, h: 2.1 },
        });
      });
    }
  }

  return pptx;
}
