<img src="src/assets/imgs/logo.png" alt="Metrognome Logo" width="100" height="100" align="right">

# Metrognome

Copyright &copy; Tony's Studio 2022 - 2025 

-----

[![Build](https://github.com/Lord-Turmoil/metrognome/actions/workflows/static.yml/badge.svg?branch=main)](https://github.com/Lord-Turmoil/metrognome/actions/workflows/static.yml)

## Overview

This project aims to provide a minimalist metronome for musicians without any unnecessary features.

## Try it now!

- [x] [Web App](https://metro.tonys-studio.top/)
- [x] [Android App](https://github.com/Lord-Turmoil/metrognome/releases/latest/download/metrognome-1.2.4.apk)
- [ ] iOS App

## Development

Metrognome is developed with [Capacitor](https://capacitorjs.com/) using native HTML, CSS, and JavaScript. See the official [Capacitor documentation](https://capacitorjs.com/docs) for more information.

### Sensitive Information

Since this repository is public, sensitive information such as API keys should not be committed. Therefore, all information is placed in `src/js/private.js` which is ignored. To build the project locally, you need to create this file and add the following content:

```javascript
// meta file and download base url, do not end with '/'
export const BASE_URL = "https://...";
// web app url
export const WEB_URL = "https://...";
// lean cloud config
export const LEAN_CLOUD_CONFIG = {
    appId: "...",
    appKey: "...",
    serverURL: "https://..."
};
```
