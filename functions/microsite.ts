import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { renderFile } from 'ejs';
import axios from 'axios';

const API_URL = process.env["API_URL"] ?? "https://my.afterpose.com/api/v1";
const CDN_URL = process.env["CDN_URL"] ?? "https://my.afterpose.com";

const http = axios.create({
  baseURL: API_URL,
})

// @ts-ignore
const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const segments = event.path.split('/').filter(x => Boolean(x));

  if (segments.length == 1) {
    return {
      statusCode: 301,
      headers: {
        'location': `${API_URL}/short/${segments[0]}`
      }
    }
  } else if (segments.length == 2) {

    try {
      const response = await http.get(`/microsite/${segments[0]}/${segments[1]}`);
      
      const microsite = await response.data ?? {
        settings: {},
        usedProducts: []
      };
  
      const rendered = await renderFile("./views/index.ejs", {
        location: event.rawUrl,
        contentUrl: CDN_URL,
        ...microsite,
      });
  
      return {
        statusCode: 200,
        headers: {
          'content-type': 'text/html'
        },
        body: rendered
      }
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

export { handler };