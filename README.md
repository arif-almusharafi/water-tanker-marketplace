# موية — Water Tanker Marketplace

An Arabic, RTL frontend MVP for a Saudi water-tanker delivery marketplace. Customers compare local suppliers, book a tanker, and simulate delivery tracking. Suppliers can explore an interactive dashboard.

## Run locally

Requires Node.js 20.19+ or 22.12+ and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite (normally http://localhost:5173).
On Windows PowerShell with restricted script execution, use `npm.cmd` instead of `npm`.

```sh
npm run build
npm run preview
npm run lint
npm test
```

Browser tests run headless. On Windows they use the installed Microsoft Edge; on macOS/Linux run `npx playwright install chromium` once (or set `PW_CHANNEL`, e.g. `PW_CHANNEL=chrome`). Run `npm test` to check booking, pricing, tracking, dashboard actions, mobile navigation, and responsive overflow. Screenshots are written to `test-results/`.

## Features

- Responsive Arabic landing page with an original SVG tanker illustration, benefits, supplier cards, and city selection.
- Four-step order flow: address, capacity/water/scheduling, four supplier options, summary and demo payment choice.
- Capacity-based mock pricing, required address and future schedule validation, and order confirmation state.
- Generated demo order reference, delivery timeline, animated mock map, driver information, demo calling and cancellation.
- Supplier dashboard with availability, accept/reject actions, active deliveries, completion, computed daily totals, history and weekly mock revenue chart.
- Working hash navigation, mobile menu, customer/supplier demo entry, informational dialogs and status notifications.
- Lucide icons, reusable UI components and local mock data. Arabic font loads from Google Fonts with system fallbacks; no API keys.

## Structure

```text
public/favicon.svg
src/
  components/
    DeliveryScene.jsx     # Original SVG delivery illustration
    UI.jsx                # Shared buttons, cards, dialogs and map placeholder
  data/mock.js            # Saudi locations, suppliers, orders and pricing
  pages/
    Home.jsx
    Order.jsx
    Tracking.jsx
    Dashboard.jsx
  App.jsx                 # Hash navigation and session state
  main.jsx
  styles.css
index.html
vite.config.js
eslint.config.js
```

## Demo scope

Built with React, Vite, JavaScript, Lucide React and CSS. All suppliers, ratings, prices, driver names, business metrics and contact details are illustrative. No actual supplier is contacted. Card selection does not request or process card details; calls only display a demo notification. Maps are local visual placeholders, not geographic maps.

State is held in React memory. Refreshing the page resets the demo. Supplier dashboard data is independent of the customer booking flow, and dashboard state resets when leaving that page. City selection updates the address options while the same illustrative supplier catalog is used across cities.

The real backend phase would provide authentication and roles, supplier onboarding and verification, persistent orders and inventory, city-specific supplier availability, dispatch and pricing, actual maps/GPS, notifications, payment processing, cancellation rules and customer support. None of those external services are connected in this MVP.
