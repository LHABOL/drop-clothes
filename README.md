# DROP. — tema de Shopify

Tienda de ropa de marca (dropshipping) como **tema de Shopify (Liquid)**. Shopify se encarga de los productos, el inventario, el carrito, el checkout, los pagos (tarjeta, PayPal, etc.) y de llevar tus finanzas; el tema pone el diseño (parallax, intro animada, transiciones entre páginas), el botón de WhatsApp y el formulario de pedidos.

## Qué incluye

- **Catálogo con espacios en blanco para tus fotos**: cada tarjeta de producto muestra un recuadro "Foto próximamente" hasta que subas la imagen del producto en Shopify. Si no hay productos todavía, la portada muestra 8 tarjetas vacías.
- **Carrito y compra**: cajón de carrito, cantidades, notas del pedido y botón **Finalizar compra** (checkout de Shopify). En la página de producto: **Agregar al carrito** y botones de pago rápido (PayPal, Shop Pay, Apple Pay…) cuando los activas en Shopify.
- **WhatsApp**: botón flotante en todas las páginas hacia **+52 33 3301 4958** con el mensaje precargado *"Hola buen día. Quisiera hacer un pedido, pero pudieras decirme como es el proceso"*. También hay botón de consulta en cada producto.
- **Formulario de pedidos**: sección "Haz tu pedido" en el inicio (`#pedido`) y plantilla de página `page.pedido`. Llega a tu correo de la tienda y también se puede enviar ya redactado por WhatsApp. Los contactos quedan como clientes con la etiqueta `pedido`.
- **Páginas por categoría** con transición parallax: colecciones `calzado`, `pantalones`, `playeras`, `camisas`, `hombres` y `mujeres`.
- Los textos, las fotos del inicio, el número y mensaje de WhatsApp, las redes y la intro se editan en **Personalizar** (editor de temas).

## Instalación (una vez)

### Opción A — subir el .zip
1. Genera el paquete: `tar -a -c -f drop-clothes-theme.zip assets config layout locales sections snippets templates` (dentro de esta carpeta).
2. Shopify Admin → **Tienda online → Temas → Agregar tema → Subir archivo ZIP**.
3. **Personalizar** y, cuando esté listo, **Publicar**.

### Opción B — conectar este repositorio de GitHub
1. Shopify Admin → **Tienda online → Temas → Agregar tema → Conectar desde GitHub**.
2. Elige `LHABOL/drop-clothes`, rama `main`. Cada cambio que se suba a GitHub se refleja en el tema.

## Configuración en Shopify (una vez)

1. **Pagos** — Configuración → Pagos: activa Shopify Payments y/o **PayPal**. Todo cobro se procesa en el checkout de Shopify y queda registrado en tus reportes financieros.
2. **Colecciones** — Productos → Colecciones: crea `Calzado`, `Pantalones`, `Playeras`, `Camisas`, `Hombres` y `Mujeres` (los handles deben quedar `calzado`, `pantalones`, `playeras`, `camisas`, `hombres`, `mujeres`). Una prenda puede estar en varias (p. ej. una playera en `playeras` y `mujeres`).
3. **Productos** — en cada producto: *Proveedor* = marca, *Tipo* = categoría, precio y "Precio de comparación" (para ver el precio tachado y el % de descuento), variantes de talla y **las fotos** (aquí van las imágenes del catálogo).
4. **Catálogo de la portada** — Personalizar → Inicio → "Catálogo destacado" → elige una colección.
5. **Correos del formulario** — Configuración → Notificaciones: el formulario de pedidos llega al correo de la tienda.
6. **Página de pedido** (opcional) — Contenido → Páginas → nueva página "Pedido" con plantilla `page.pedido`.
7. **Logo, WhatsApp, intro y redes** — Personalizar → Configuración del tema.

## Estructura

```
assets/     theme.css, commerce.css, theme.js, fotos editoriales (hero, hombre, mujer)
config/     ajustes del tema
layout/     theme.liquid, password.liquid
sections/   header, hero, marquee, manifesto, featured-collection, story, how-it-works,
            explore, order-form, cta-band, footer, cart-drawer, main-*
snippets/   product-card, price, cart-contents, intro, route-veil, whatsapp-button…
templates/  index, collection, product, cart, page, page.pedido, search, 404…
static-preview/  versión estática anterior (solo referencia, no se sube a Shopify)
```

Las fotos editoriales incluidas provienen de Unsplash (licencia libre); sustitúyelas por las tuyas en Personalizar cuando quieras.
