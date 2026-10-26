# Premios de Oro 2026

Web de votaciones para el Balón, el Mojón y el Pony de Oro. Gala el 12 de diciembre en Casa Club.

- `/` es la web para votar, con candidatos, clasificación en directo y normas.
- `/admin.html` es el panel del admin, protegido con contraseña.

---

## Guía paso a paso

### 1. Copiar los archivos al repositorio (GitHub Desktop)

1. Descomprime `premios-de-oro.zip`. Se crea una carpeta llamada `premios-oro`.
2. Abre GitHub Desktop, elige tu repositorio y ve a **Repository → Show in Finder** (en Windows, **Show in Explorer**). Se abre la carpeta de tu repositorio.
3. Abre la carpeta `premios-oro` que acabas de descomprimir. Selecciona **todo lo que hay dentro**, no la carpeta en sí, y cópialo.
   - En Mac, pulsa `Cmd + Shift + .` para ver los archivos ocultos y copiar también `.gitignore`.
4. Pégalo en la carpeta de tu repositorio. Cuando te pregunte, elige **Reemplazar**.
   - No borres la carpeta oculta `.git` del repositorio.
   - `package.json`, `vercel.json`, `api`, `lib` y `public` tienen que quedar directamente en la carpeta del repositorio, no dentro de otra subcarpeta.
5. Vuelve a GitHub Desktop. A la izquierda verás los archivos cambiados.
6. Abajo a la izquierda, en **Summary**, escribe algo como «Actualizar web» y pulsa **Commit to main**.
7. Arriba, pulsa **Push origin**.

Vercel detecta el cambio y vuelve a publicar la web sola en 1 o 2 minutos.

Para futuros cambios repite los pasos 3 a 7. También puedes reemplazar solo los archivos que hayan cambiado.

### 2. Fotos de los candidatos

1. Prepara una foto por persona en formato `.jpg`. Mejor si es cuadrada y con la cara centrada, porque se recorta en cuadrado.
2. Cambia el nombre de cada foto por el id de la persona:

   | Persona | Archivo |
   |---|---|
   | Borao | `borao.jpg` |
   | Blasco | `blasco.jpg` |
   | Civi | `civi.jpg` |
   | Diego | `diego.jpg` |
   | Domin | `domin.jpg` |
   | Eduardo Polo | `eduardo.jpg` |
   | Guille | `guille.jpg` |
   | Rafael Gomez | `rafael.jpg` |
   | Julian | `julian.jpg` |
   | Juanjo | `juanjo.jpg` |
   | Kike | `kike.jpg` |
   | Maroto | `maroto.jpg` |
   | Moyano | `moyano.jpg` |
   | Portillo | `portillo.jpg` |
   | Pablito | `pablito.jpg` |
   | Juanma | `juanma.jpg` |
   | Mario | `admin.jpg` |

   Todo en minúsculas, sin tildes ni espacios. La extensión tiene que ser `.jpg`, no `.jpeg` ni `.png`.
3. Copia las fotos dentro de la carpeta `public/fotos/` de tu repositorio.
4. En GitHub Desktop: **Commit to main** y **Push origin**.

Si falta alguna foto, en su tarjeta salen sus iniciales.

### 3. Base de datos (si no la has creado aún)

1. En Vercel, entra en el proyecto y abre la pestaña **Storage**.
2. Pulsa **Create Database** (o **Browse Marketplace**) y elige **Upstash for Redis**.
3. Plan **Free**, región **Frankfurt (eu-central-1)**.
4. Pulsa **Connect Project** para conectarla a este proyecto.

### 4. Correo electrónico para enviar los PINs

Los PINs salen desde una cuenta de Gmail personal. No uses la del trabajo, suelen tener esto bloqueado.

1. Entra en https://myaccount.google.com/security con esa cuenta y activa la **Verificación en dos pasos**.
2. Ve a https://myaccount.google.com/apppasswords.
3. En «Nombre de la aplicación» escribe `Premios` y pulsa **Crear**.
4. Copia las 16 letras que aparecen, sin espacios. Solo se muestran una vez.

### 5. Variables de entorno en Vercel

En el proyecto de Vercel, ve a **Settings → Environment Variables** y añade:

| Variable | Valor |
|---|---|
| `SMTP_USER` | Tu dirección de Gmail completa |
| `SMTP_PASS` | Las 16 letras del paso 4 |
| `ADMIN_PASSWORD` | La contraseña que usarás para entrar en `/admin.html` |
| `SESSION_SECRET` | Una frase larga y aleatoria (por ejemplo 40 letras al azar). No hace falta recordarla |
| `SITE_URL` | La dirección de tu web, por ejemplo `https://premios-de-oro.vercel.app` |

Después ve a **Deployments**, pulsa **⋯** en el último despliegue y elige **Redeploy**. Las variables solo se aplican al volver a desplegar.

### 6. Comprobar que todo funciona

1. Abre la web y pulsa «¿No tienes PIN o lo has perdido? Pídelo aquí».
2. Elige «Mario», pon tu correo y pide el PIN. Tiene que llegarte en unos segundos. Mira también en spam.
3. Entra con ese PIN.
4. Abre `/admin.html` con tu `ADMIN_PASSWORD`.
5. Para probar a votar antes del 1 de noviembre:
   1. En el admin, pulsa **Forzar abierta** y vota.
   2. Al terminar, pulsa **Borrar todos los votos**.
   3. Vuelve a **Según calendario**.

---

## Calendario automático

| Fecha | Qué pasa |
|---|---|
| 1 de noviembre | Se abren las votaciones |
| 6 de diciembre a medianoche | Se cierran las votaciones |
| 7 de diciembre | Se desvelan los 10 últimos; quedan tapados los 7 primeros |
| 12 de diciembre, 9:00 | Se desvela hasta el top 3 |
| Comida del 12 de diciembre | El admin revela el 3º, el 2º y el ganador desde `/admin.html` |

## Cambiar nombres o fechas

- Los participantes y las fechas están en `lib/config.js`.
- Puedes cambiar el `name` de cualquiera cuando quieras.
- No cambies el `id` una vez empiecen las votaciones, porque sus votos y su PIN van ligados a él.
