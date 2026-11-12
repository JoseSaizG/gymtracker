# Design: GymTracker

World: **Tablero de competencia** — a powerlifting meet attempt board with referee lights. Every set is an attempt; the next attempt's weight dominates the screen, and logging it lights the judges' lights. Scene: phone in one hand at the gym, between sets; the dark board reads like an arena scoreboard under fluorescent light.

## Tokens

| Token | Value | Role |
|---|---|---|
| `--board` | `#0E1116` | Ground, top bar, tab bar |
| `--panel` | `#171B22` | The board panel, sheets, chips |
| `--panel-2` | `#20252E` | Step buttons, focused inputs |
| `--line` | `#2C323C` | Hairline dividers, outlines |
| `--ink` | `#FFFFFF` | Figures and primary text |
| `--ink-2` | `#B7BEC9` | Secondary text, units |
| `--ink-3` | `#8790A0` | Tertiary labels, inactive tabs |
| `--yellow` | `#F2C230` | Primary action (Anotar), records, active tab icon |
| `--yellow-ink` | `#17140A` | Text on yellow |
| `--red` | `#F2584B` | Destructive only (Reemplazar todo) |
| `--light-off` | `#2A2F38` | Unlit referee light |

Color strategy: restrained board with one committed signal color. Yellow means "act" or "record", never decoration. White lit circles mean "a good lift / a day you trained". Red never appears unless something is destroyed.

## Type

- **Oswald** (self-hosted variable woff2, 400–700, `fonts/oswald-latin.woff2`): every number, titles, the CTA. Tabular figures. Weight readout `clamp(84px, 27vw, 120px)`, shrinking to 0.8×/0.64× as digits grow; reps `clamp(56px, 17vw, 76px)`; titles 26–30px.
- **System UI** (Roboto on Android): body, labels, buttons in sheets, 14–17px.
- Hierarchy is scale contrast: huge figures, small sentence-case labels. No all-caps labels.

## Components

- **Referee lights**: three 20px circles. Off `--light-off` inset; on white with soft white light; record = yellow. Light up staggered 0/110/220ms, 320ms ease-out; turn off after 1.5s (2.6s for a record). This is the only glow in the system: it depicts real lamps.
- **Dial**: 64×64 step buttons (radius 16) flanking an editable number; unit centred under the figure. Weight increments 1 / 2,5 / 5 kg, persisted per device.
- **Chips**: 48px pills, recent exercises first, count of today's sets in yellow figures. Active = white fill.
- **CTA**: full-width 64px yellow bar, radius 16, fixed above the tab bar, label states the set number ("Anotar serie 3").
- **Tab bar**: 4 tabs (Hoy, Historial, Calendario, Progreso), 68px + safe area, active icon yellow.
- **Calendar**: Monday-first 7-col grid of circles; trained = white disc, record day = yellow disc, today = outline ring, selected = yellow ring.
- **Progress chart**: single white 2px line, 4px points, yellow 5.5px points for records, dashed crosshair + tooltip on tap; a sessions table below is the accessible view.
- **Sheets**: bottom `<dialog>` sheets, radius 22 top corners, backdrop `rgba(5,7,10,.7)`.
- **Toast**: white (yellow for a record) bar above the CTA with an "Deshacer" action, 5s.

Icons: authored inline SVG symbols, 24px, 2px round stroke.

## Motion

One grammar: `cubic-bezier(.16,1,.3,1)`. The signature moment is the lights. Sheets rise 40px over 320ms; toasts 12px over 260ms. `prefers-reduced-motion` collapses all of it.

## Copy

Spanish (Chile), sentence case, actions named by what they do: "Anotar serie", "Exportar datos", "Combinar con mis datos", "Reemplazar todo", "Deshacer".
