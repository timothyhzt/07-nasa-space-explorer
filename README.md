# Project 7: NASA API - Space Explorer App
NASA releases a new "Astronomy Picture of the Day" (APOD) every day—spotlighting breathtaking images of galaxies, stars, planets, and more.

Your task is to build an interactive web app that fetches and displays these photos using [NASA's API](https://api.nasa.gov/). Users will pick a date range and instantly view stunning photos from across the cosmos, along with titles and descriptions.

You'll get to use your skills to build something that's actually connected to real-world data from one of the most iconic organizations in the world.

## Starter Files
- The provided files include a NASA logo, date inputs, a button, a placeholder for your gallery, and basic layout and styling to help you get started.
- It also includes built-in logic (in `dateRange.js`) to handle the valid APOD date range—from June 16, 1995 to today. No need to modify it.
- All your custom JavaScript should go in `script.js`. That's where you'll write the code that fetches data and displays your gallery.

## How the APOD request works

The app builds a URL using the selected dates:

```js
const requestUrl = `${apiUrl}?api_key=${apiKey}&start_date=${startDate}&end_date=${endDate}`;
```

`start_date` and `end_date` tell NASA which APOD entries to return. `fetch(requestUrl)` sends the request and returns a Promise. The `await` keyword pauses the `async` function until that Promise finishes. Then `await response.json()` converts NASA's JSON response into JavaScript objects that the gallery can display.

The code checks `response.ok` before rendering. If the network fails or NASA returns an error, the `catch` block replaces the gallery with a helpful message. The project uses NASA's public `DEMO_KEY`; it is suitable for learning, but a personal NASA API key may provide higher request limits.

## Features

- Select a start and end date, then load APOD entries from NASA.
- View responsive image cards with titles and dates.
- Open an entry to read its full explanation in an accessible modal.
- Close the modal with the close button, the Escape key, or by clicking outside it.
- Video entries provide a direct link to NASA's video page.
- A random space fact appears when the page loads.
