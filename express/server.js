'use strict'
const ejs = require('ejs');
const axios = require('axios').default;
const serverless = require('serverless-http');
const express = require('express');
const app = express();

const API_URL = process.env["API_URL"] ?? "https://my.afterpose.com/api/v1";
const CDN_URL = process.env["CDN_URL"] ?? "https://my.afterpose.com";

const http = axios.create({
  baseURL: API_URL,
})

const router = express.Router();

// This redirect could be handled by Netlify
// but this can use env variables if needed 
router.get('/:shortId', (req, res) => {
  res.redirect(`${API_URL}/short/${req.params.shortId}`)
})

router.get('/:uid/:photoId', async (req, res) => {
  try {
    const response = await http.get(`/microsite/${req.params.uid}/${req.params.photoId}`)
    const fullUrl = req.protocol + '://' + req.hostname + req.originalUrl;

    const microsite = response.data;
    if (!microsite) microsite = {};
    if (!microsite.settings) microsite.settings = {};

    const rendered = await ejs.renderFile("./views/index.ejs", {
      location: fullUrl,
      contentUrl: CDN_URL,
      ...response.data
    });

    res
    .contentType('text/html')
    .status(200)
    .send(rendered)
  }
  catch (e) {
    console.error(e.message)
    res.writeHead(200, { 
      'Content-Type': 'text/html'
    });
    res.write("There was an error loading your after pose");
    res.write("<br><br>");
    res.write(e.message);
    res.end();
  }

})

app.use('/', router);
app.use(express.static("public"))

module.exports = app;
module.exports.handler = serverless(app);