import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { renderFile } from "ejs";
import axios from "axios";

const API_URL = process.env["API_URL"] ?? "https://my.afterpose.com/api/v1";
const CDN_URL = process.env["CDN_URL"] ?? "https://my.afterpose.com";
const CSS_URL = process.env["CSS_URL"] ?? "https://my.afterpose.com";
const GTAG = process.env["GTAG"] ?? "G-YK8MW2FYKN";
const TB_TRACKER_TOKEN =
  process.env["TB_TRACKER_TOKEN"] ??
  "p.eyJ1IjogImE4YTAxM2FiLWE5Y2MtNDlkYi05ZmEzLWY5YmY1M2I0ZTE1YSIsICJpZCI6ICIxZmI2NDRjMi0xZWJmLTQ4ZDYtOTMzNC00NTNhNTIwMzg3N2QiLCAiaG9zdCI6ICJ1c19lYXN0In0.5mpqZy8RAI9G0TMBOmIl0-rtOI2TRfujUAdQRd6wM2M";

const http = axios.create({
  baseURL: API_URL,
});

async function renderMicrosite(url: string, microsite: Microsite) {
  const rendered = await renderFile(
    "./views/index.ejs",
    {
      TB_TRACKER_TOKEN,
      cssUrl: CSS_URL,
      url: url,
      cdnUrl: CDN_URL,
      gtag: GTAG,
      albumId: null,
      iconUrl:
        microsite.settings?.themes?.light?.iconUrl ??
        microsite.settings?.themes?.dark?.iconUrl ??
        null,
      ...microsite,
    },
    { async: true }
  );

  return {
    statusCode: 200,
    headers: {
      "content-type": "text/html",
    },
    body: rendered,
  };
}

// @ts-ignore
const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  const segments = event.path.split("/").filter((x) => Boolean(x));
  if (segments.length == 1) {
    if (segments[0] == "preview") {
      const data = event.queryStringParameters?.["data"];
      if (data == null) throw new Error("missing data");
      const dataObject = JSON.parse(atob(data));

      if (data == null) throw new Error("invalid data");

      return renderMicrosite(event.rawUrl, {
        shareId: "",
        shareSource: "",
        photos: [],
        settings: { themes: {} },
        usedProducts: [],
        accountId: "",
        ...dataObject,
      } as Microsite);
    } else if (segments[0].length == 36) {
      try {
        const response = await http.get<Partial<Microsite>>(
          `/microsite/share/${segments[0]}`
        );

        const microsite: Microsite = {
          shareId: segments[0],
          shareSource: "",
          photos: [],
          settings: { themes: {} },
          usedProducts: [],
          accountId: "",
          ...response.data,
        };

        microsite.photos = microsite.photos.map((p) => ({
          ...p,
          metadata: {
            ...p.metadata,
            productIds: p.metadata?.productIds
              ? JSON.parse(p.metadata?.productIds as any as string)
              : [],
          },
        }));
        return await renderMicrosite(event.rawUrl, microsite);
      } catch (e) {
        console.error(e.message);
        return {
          statusCode: 200,
          headers: {
            "content-type": "text/html",
          },
          body: `
          There was an error loading your after pose
          <br><br>
          ${API_URL}
          <br>
          ${e.message}
          `,
        };
      }
    }
  }

  return {
    statusCode: 404,
    body: "Not Found",
  };
};

type Product = {
  id: string;
  name: string;
  url: string;
  imageUrl: string;
};
type Photo = {
  id: string;
  url: string;
  type: string;
  fileName: string;
  phoneNumber?: string;
  email?: string;
  taken?: string;
  metadata: Record<string, string>;
};
type Theme = {
  colorPrimary: string;
  colorText: string;

  logoUrl?: string;
  iconUrl?: string;
  backgroundUrl?: string;
};
type Settings = {
  themes: {
    light?: Theme;
    dark?: Theme;
  };
  actionText?: string;
  actionUrl?: string;
  shareTitle?: string;
  shareMessage?: string;
};
type Microsite = {
  accountId: string;
  albumId?: string;
  shareId: string;
  shareSource?: string;
  photos: Photo[];
  settings: Settings;
  usedProducts: Product[];
  productsBundleUrl?: string;
};

export { handler };
