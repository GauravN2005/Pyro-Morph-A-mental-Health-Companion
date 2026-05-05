# Pyro-Morph

This repository is now a web-only project built with plain HTML, CSS, and JavaScript.

## Run It

Open [web/index.html](web/index.html) through a static file server. If you want to test the OpenAI connection, open Settings in the app and provide:

- an OpenAI API key, and
- a base URL, if you are using an HTTPS proxy for browser requests.

## Notes

- The app logic lives in [web/app.js](web/app.js).
- Browsers often block direct calls to `api.openai.com`, so a proxy endpoint may be required.
