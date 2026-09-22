LUTSA v8.8.3 - NETLIFY READY

1) Upload this whole folder to Netlify Drop:
   https://app.netlify.com/drop

2) IMPORTANT:
   Netlify serves the frontend only. This app also needs the Node.js + Socket.IO backend.

3) After deploying the backend (for example on Render), open:
   netlify-config.js
   and set:
   window.LUTSA_BACKEND_URL = 'https://YOUR-BACKEND.onrender.com';

4) Re-upload the folder to Netlify.

5) Backend CORS:
   Set the backend environment variable:
   CORS_ORIGIN=https://YOUR-SITE.netlify.app

6) Backend start command:
   npm start

7) Backend build command:
   npm install
