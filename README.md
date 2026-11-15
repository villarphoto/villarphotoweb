# villar.photo

Web de portfolio de fotografía de motor, con panel de administrador propio. Se aloja gratis en GitHub Pages y tú gestionas las carpetas y las fotos desde la propia web, sin depender de nadie.

## Estructura
- `index.html`, `css/styles.css`, `js/main.js`: la web
- `data/portfolio.json`: carpetas y fotos (lo actualiza el panel de administrador)
- `assets/logo*.png`: logos · `assets/photos/`: fotos (las crea el panel)

## 1. Publicar en GitHub Pages
1. Crea un repositorio en GitHub (por ejemplo `villar-photo`) y sube todo el contenido de esta carpeta (arrastra los archivos, incluida la carpeta `.nojekyll`).
2. En el repositorio: **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)` → Save**.
3. En 1-2 minutos tu web estará en `https://TU_USUARIO.github.io/villar-photo/`.

## 2. Crear tu token de GitHub (una sola vez)
1. GitHub → tu foto → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. **Repository access:** Only select repositories → elige tu repositorio.
3. **Permissions → Repository permissions → Contents: Read and write**.
4. Elige una caducidad larga, genera el token y cópialo (empieza por `github_pat_`). Guárdalo en tu gestor de contraseñas.

## 3. Configurar tu acceso
1. Abre tu web, baja al pie de página y pulsa **Admin**.
2. Rellena: repositorio (`usuario/repositorio`), rama (`main`), el token, y crea tu **usuario y contraseña**.
3. El token se guarda **cifrado con tu contraseña, solo en ese navegador**. No está en el código ni en GitHub.

## 4. Día a día
1. **Admin → entra → Editar portfolio.**
2. Crea carpetas, arrastra las fotos dentro de una carpeta (se reducen a 2400 px para ir ligeras), elige portada con ★.
3. Pulsa **Guardar y publicar**: las fotos y `data/portfolio.json` se guardan en tu repositorio. La web pública se actualiza en 1-2 minutos.

## Cambiar usuario, contraseña o token
Admin → entra → botón **Acceso**. Si olvidas la contraseña: Admin → **Reconfigurar** (necesitas tu token).
En otro ordenador o navegador repites el paso 3 (necesitas el token).

## Seguridad
- Nadie puede cambiar tu web sin tu token: la contraseña solo protege el token guardado en tu navegador.
- Usa una contraseña larga y no compartas el token. Si crees que se filtró, bórralo en GitHub y crea otro.
- El panel necesita https (GitHub Pages) o `localhost`. Para probar en local: `python3 -m http.server` dentro de la carpeta.
