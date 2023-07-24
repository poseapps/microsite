import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { renderFile } from 'ejs';
import axios from 'axios';

const API_URL = process.env["API_URL"] ?? "https://my.afterpose.com/api/v1";
const CDN_URL = process.env["CDN_URL"] ?? "https://my.afterpose.com";
const GTAG = process.env["GTAG"] ?? "G-YK8MW2FYKN";

const http = axios.create({
  baseURL: API_URL,
})

async function renderMicrosite(url: string, microsite: Microsite, accountId?: string) {
  const rendered = await renderFile("./views/index.ejs", {
    url: url,
    cdnUrl: CDN_URL,
    gtag: GTAG,
    accountId: accountId,
    iconUrl: microsite.settings?.themes?.light?.iconUrl ?? microsite.settings?.themes?.dark?.iconUrl ?? null,
    ...microsite,
  }, { async: true });

  return {
    statusCode: 200,
    headers: {
      'content-type': 'text/html'
    },
    body: rendered
  }
}

// @ts-ignore
const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const segments = event.path.split('/').filter(x => Boolean(x));

  if (segments.length == 1) {
    // TODO: implement preview, has default photo
    // TODO: settings/theme can be provided via json query string
    // if (segments[0] == "preview") {
    //   return renderMicrosite(event.rawUrl, {

    //   })
    // }
    return {
      statusCode: 301,
      headers: {
        'location': `${API_URL}/short/${segments[0]}`
      }
    }
  } else if (segments.length == 2) {

    try {
      const response = await http.get<Partial<Microsite>>(`/microsite/${segments[0]}/${segments[1]}`);
      
      const microsite: Microsite = {
        photos: [],
        settings: { themes: {} },
        usedProducts: [],
        ...response.data,
      };

      microsite.photos = microsite.photos.map((p) => ({
        ...p, metadata: {
          ...p.metadata,
          productIds: JSON.parse(p.metadata.productIds as any as string)
        }
      }));
      return await renderMicrosite(event.rawUrl, microsite);
    }
    catch (e) {
      console.error(e.message)
      return {
        statusCode: 200,
        headers: {
          'content-type': 'text/html'
        },
        body: `
        There was an error loading your after pose
        <br><br>
        ${API_URL}
        <br>
        ${e.message}
        `
      }
    }
  }

  return {
    statusCode: 404,
    body: "Not Found"
  }
};

type Product = {
  id: string;
  name: string;
  url: string;
  imageUrl: string;
}
type Photo = {
  id: string;
  url: string;
  type: string;
  fileName: string;
  phoneNumber?: string;
  email?: string;
  taken?: string;
  metadata: Record<string, string>;
}
type Theme = {
  colorPrimary: string;
  colorText: string;

  logoUrl?: string;
  iconUrl?: string;
  backgroundUrl?: string;
}
type Settings = {
  themes: {
    light?: Theme,
    dark?: Theme
  }
  actionText?: string;
  actionUrl?: string;
  shareTitle?: string;
  shareMessage?: string;
}
type Microsite = {
  photos: Photo[];
  settings: Settings;
  usedProducts: Product[];
}

export { handler };