# Premios de Oro 2026

Web de votaciones para el Balón, el Mojón y el Pony de Oro. Gala el 12 de diciembre en Casa Club.

- `/` es la web para votar, con clasificación en directo y normas.
- `/admin.html` es el panel del admin, protegido con contraseña.

Los votos se guardan en el servidor y los nombres que siguen tapados nunca llegan al navegador, así que nadie puede verlos antes de tiempo.

## Ponerla en marcha en Vercel

1. **Sube el proyecto a GitHub.** Crea un repositorio nuevo, por ejemplo `premios-de-oro`, y sube el contenido de esta carpeta.
2. **Importa el repositorio en Vercel.** Ve a Add New → Project y elige el repositorio. En Framework Preset deja «Other» y no cambies nada más.
3. **Crea la base de datos.** En el proyecto de Vercel ve a Storage → Create Database → Upstash for Redis, con el plan gratuito. Conéctala al proyecto. Las variables de conexión se crean solas.
4. **Prepara el correo.** El PIN se manda desde una cuenta de Gmail:
   - En esa cuenta de Google, activa la verificación en dos pasos.
   - Entra en https://myaccount.google.com/apppasswords y crea una contraseña de aplicación llamada «Premios».
   - Te dará 16 letras. Esa es la `SMTP_PASS`.
5. **Añade las variables de entorno.** Están en Settings → Environment Variables:

   | Variable | Valor |
   |---|---|
   | `ADMIN_PASSWORD` | La contraseña que usarás para entrar en /admin.html |
   | `SESSION_SECRET` | Una frase larga y aleatoria, por ejemplo 40 letras al azar |
   | `SMTP_USER` | Tu dirección de Gmail |
   | `SMTP_PASS` | La contraseña de aplicación del paso 4 |
   | `SITE_URL` | La dirección final de la web, por ejemplo `https://premios-de-oro.vercel.app` |

6. **Vuelve a desplegar.** Ve a Deployments → ⋯ → Redeploy para que coja las variables.

## Cambiar nombres o fechas

- Los participantes están en `lib/config.js`.
- Las fechas del calendario están en ese mismo archivo, en hora de Madrid.
- Las fotos de los candidatos van en `public/fotos/`, una por persona, con el id como nombre (`borao.jpg`, `admin.jpg` para Mario…). Si falta alguna, salen sus iniciales.

## Calendario automático

| Fecha | Qué pasa |
|---|---|
| 1 de noviembre | Se abren las votaciones |
| 6 de diciembre a medianoche | Se cierran las votaciones |
| 7 de diciembre | Se desvelan los 10 últimos; quedan tapados los 7 primeros |
| 12 de diciembre, 9:00 | Se desvela hasta el top 3 |
| Comida del 12 de diciembre | El admin revela el 3º, el 2º y el ganador desde /admin.html |

Para probar antes del 1 de noviembre:

1. En el panel del admin, pulsa «Forzar abierta».
2. Haz las pruebas que quieras.
3. Pulsa «Borrar todos los votos».
4. Vuelve a «Según calendario».
