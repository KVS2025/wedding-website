# Abhishek & Triya — Wedding Invitation

A mobile-first, static midnight-navy and champagne-gold wedding invitation built with HTML, CSS, and vanilla JavaScript. English and Gujarati translations live in `js/translations.js`; the selected language persists in local storage. GSAP and ScrollTrigger enhance the velvet curtain reveal, section entrances, and parallax when available; the site still works without them.

## Preview locally

From this directory, run:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Editing the invitation

- Update names, family details, venue, and schedule in `index.html`.
- Adjust visual styles and responsive layouts in `css/style.css`.
- Update the IST wedding date, opening interaction, countdown, scratch-to-reveal card, language selection, scroll effects, and petals in `js/main.js`.
- Add or edit English and Gujarati wording in `js/translations.js`.

The countdown targets midnight at UTC+05:30 on 13 December 2026. The date card can be scratched with pointer input or revealed with its accessible button; its revealed state lasts for the current browser session. The map uses a public Google Maps embed and the supplied directions link. No audio files or third-party music are used; the opening chime is generated only after the visitor taps the invitation button.
