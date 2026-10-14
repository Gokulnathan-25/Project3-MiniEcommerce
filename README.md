# Shopora — Mini E-Commerce Website

A responsive, full-stack demo store built with HTML, CSS, vanilla JavaScript, Node.js, Express, and JSON-file persistence. It includes product discovery, search/filter/sort, a session-backed cart, account registration/login, order history, and a simulated test checkout.

## Features

- Editorial-style, responsive storefront and product cards
- Product search, category filters, and sorting
- Add-to-bag, quantity changes, remove items, subtotal, shipping, and total
- Register/sign in with password hashing (`bcryptjs`) and session cookies
- Checkout requires sign-in and validates delivery information
- Test-only card checkout and cash-on-delivery demo path
- Orders saved to `data/orders.json`; accounts saved to `data/users.json`
- No payment gateway, no real charges, and no real fulfillment

## Requirements

- Node.js 18+ (Node.js 20 LTS is recommended)
- npm

## Run locally

1. Extract the ZIP.
2. Open the extracted `Project3_MiniEcommerce` folder in VS Code.
3. Open the terminal in that folder.
4. Run:

   ```powershell
   npm install
   npm start
   ```

5. Open `http://localhost:3000`.

If port 3000 is already in use, run:

```powershell
$env:PORT=3002; npm start
```

Then open `http://localhost:3002`. The server uses the `PORT` environment variable.

## Test the checkout

1. Create an account using your name, email, and a password of at least 8 characters.
2. Add a product to the bag.
3. Open the bag and select **Continue to checkout**.
4. Fill out the delivery fields. Use a 6-digit PIN code.
5. Choose **Test card** and keep the demo card number `4242 4242 4242 4242`, or choose **Cash on delivery**.
6. Place the order and see the confirmation/order reference.

To demonstrate a simulated declined test card, use `4000 0000 0000 0002`; the demo records a declined-test status. This is not connected to a real payment processor.

## Project structure

```text
Project3_MiniEcommerce/
├── server.js                 # Express API, authentication, cart, checkout
├── package.json
├── README.md
├── data/
│   └── .gitkeep              # JSON data files are created at first run
└── public/
    ├── index.html            # Storefront, cart, auth and checkout dialogs
    ├── styles.css            # Responsive design system
    └── app.js                # Browser interactions and API calls
```

## Important notes

- JSON files are suitable for a small local demo, not production-scale commerce. For production, use a proper database, persistent session store, CSRF protection, rate limiting, HTTPS, secure secret management, inventory transactions, and a payment provider's official test integration.
- The default session secret is for local demonstration only. Set a long random `SESSION_SECRET` before deploying anywhere.
- Product imagery is loaded from Unsplash and Pexels and requires internet access; if images fail, the cards remain usable, but images may not appear.
- Do not enter real passwords or payment information into this learning project.
