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
        data: "image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MDAgODAwIj48cGF0aCBkPSJNNDAwIDBDMTc5LjA3IDAgMCAxNzkuMDkgMCA0MDBzMTc5LjA3IDQwMCA0MDAgNDAwIDQwMC0xNzkuMDggNDAwLTQwMFM2MjAuOTMgMCA0MDAgMHoiIGZpbGw9IiNmZmYiLz48cGF0aCBkPSJNNDAwIDc3MC40N2MtMy42OSAwLTcuMzYtLjA3LTExLjAxLS4xN2w3NS43MS0yMDguMDhoMTA0LjE5YzE4LjI4IDAgMzguMzctMTQuMDYgNDQuNjEtMzEuMjNsODIuMTQtMjI1LjYzYzEzLjQzLTM2Ljk0LTcuNzItNjcuMTYtNDcuMDMtNjcuMTZINTA0LjA2TDM4Mi43OCA1NzEuNDloLS4wNWwtNjguNzYgMTg4LjkyQzE1MC44NiA3MjEuNjIgMjkuNTMgNTc1IDI5LjUzIDQwMFMxNDMuOTYgODYuODUgMjk5Ljk3IDQzLjJsLTcwLjk2IDE5NC45OWgtLjAyTDExMS4wNCA1NjIuMmg3OC41MmwxMDAuMy0yNzUuMzNoNTlMMjQ4LjU2IDU2Mi4yaDc4LjQ4bDkzLjQ4LTI1Ni44NmMxMy40NS0zNi45NC03LjcyLTY3LjE2LTQ2Ljk4LTY3LjE2aC02NmwtNzUuODEgMjA4LjI2YzUuNTItLjI0IDExLjA2LS4zOSAxNi42NS0uMzkgMjA0LjYgMCAzNzAuNDcgMTY1Ljg3IDM3MC40NyAzNzAuNDdTNjA0LjYgNzcwLjQ3IDQwMCA3NzAuNDd6TTYyNC4xNSAyODYuN2gtNTguOThsLTgyLjYyIDIyNi42N2g1OWw4Mi42Mi0yMjYuNjdoLS4wMnoiIGZpbGw9IiMwMjRhZDgiLz48L3N2Zz4=",
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
