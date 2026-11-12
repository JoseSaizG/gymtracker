# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML/CSS/JS, no build step, no dependencies. Installable PWA (manifest + service worker). Hosted on GitHub Pages (HTTPS required for install).

## Users

One person: the owner, training at the gym, using an Android phone with the app added to the home screen. Logs between sets, often one-handed, sweaty hands, short attention windows.

## Product Purpose

Personal workout log: record each exercise's sets (weight in kg × reps, one row per set), browse history by date, see which days they trained on a calendar, and see progress per exercise (max weight over time). Success: logging a set takes a couple of taps and never gets in the way of the workout.

## Positioning

Private, offline, single-user. No accounts, no server, no social layer. Data lives only on the device.

## Operating Context

Used mid-session in a gym: phone in one hand, between sets, variable lighting. Also used at home to review history and progress.

## Capabilities and Constraints

- Entry: date, exercise, sets (each set has its own weight kg and reps).
- History grouped by date; calendar of training days; per-exercise progress chart (max weight over time).
- Storage on device only (localStorage/IndexedDB); works fully offline.
- Export/import JSON backup.
- Interface in Spanish.
- Large touch targets, fast entry, thumb-reachable primary actions.

## Evidence on Hand

No existing content or brand assets. Exercise names suggested in the UI are generic defaults, editable by the user.

## Product Principles

1. Logging a set is the fastest path in the app; everything else is secondary.
2. Thumb first: primary actions live in the bottom half of the screen.
3. The user's data is theirs: local only, and always exportable.
4. Remember what they did last time so they rarely type.

## Accessibility & Inclusion

Large hit targets (≥48px, primary ≥56px), high contrast readable in gym lighting, numeric keypads for numbers.
