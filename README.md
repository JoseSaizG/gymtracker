# GymTracker

App web instalable (PWA) para registrar tus entrenamientos. Funciona sin internet y guarda los datos solo en tu teléfono.

## Probar en el computador

```
python -m http.server 5173
```

Abre http://localhost:5173

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub (por ejemplo `gymtracker`) y sube todos los archivos de esta carpeta (index.html, styles.css, app.js, sw.js, manifest.webmanifest, fonts/, icons/).
2. En el repositorio: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, rama `main`, carpeta `/ (root)` → Save.
3. En un minuto queda en `https://TU-USUARIO.github.io/gymtracker/`.

## Instalar en Android

1. Abre la URL en **Chrome** en tu celular.
2. Menú ⋮ → **Agregar a la pantalla principal** (o **Instalar app**) → Instalar.
3. Ábrela desde el ícono: se ve a pantalla completa y funciona sin conexión.

## Actualizar la app

Sube los archivos cambiados al repositorio y, en cada versión, sube el número `?v=` de `styles.css`, `exercises.js` y `app.js` en `index.html` y el de `CACHE` en `sw.js`, para que el teléfono nunca mezcle archivos de versiones distintas. La app toma la versión nueva la siguiente vez que la abras con internet. Tus datos no se tocan.

## Editar la lista de ejercicios

Los ejercicios predefinidos están en `exercises.js`: cada línea es `["Nombre", ["Grupo"], "equipo"]`. Ahí también está qué grupos entrena cada rutina (Push, Pull, Pierna…). Si cambias el archivo, sube también el número de `CACHE` en `sw.js`.

## Respaldo

Ícono de descarga arriba a la derecha → **Exportar datos** guarda un `.json` en Descargas. Para restaurar (o pasar a otro teléfono): **Importar respaldo** y elige combinar o reemplazar.

Ojo: si borras los datos de Chrome para el sitio o desinstalas la app, se borran tus registros. Exporta un respaldo de vez en cuando.
