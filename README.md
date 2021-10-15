# After Pose Microsite
[![Netlify Status](https://api.netlify.com/api/v1/badges/76aa3925-d141-42c8-8923-916953342163/deploy-status)](https://app.netlify.com/sites/afterpose/deploys)

This is a Netlify serverless function for displaying After Pose images from the After Pose API using express as a webserver and ejs for templating.

Deployment: [https://photos.afterpose.com](https://photos.afterpose.com)

Routes
===
`/` - Redirects to [https://poseapps.com](https://poseapps.com)

`/:shortId` - Redirects short URLs to Microsite

`/:userId/:photoId` - Displays Photo and Microsite
