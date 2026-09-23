/* DROP. — comportamiento del tema: parallax, intro, transiciones, carrito, producto y pedidos */
(function () {
  'use strict';

  var D = window.DROP || { routes: {}, whatsapp: {}, strings: {} };
  var html = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var designMode = !!(window.Shopify && window.Shopify.designMode);

  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---------- utilidades ---------- */
  function money(cents) {
    var frac = Math.round(cents) % 100 === 0 ? 0 : 2;
    try {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: D.currency || 'MXN',
        minimumFractionDigits: frac,
        maximumFractionDigits: frac
      }).format(cents / 100);
    } catch (e) {
      return '$' + (cents / 100).toFixed(frac);
    }
  }

  var toastTimer;
  function toast(msg) {
    var el = qs('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-visible'); }, 2600);
  }

  /* ---------- aparición al hacer scroll ---------- */
  var io = null;
  function initReveal(root) {
    var els = qsa('.reveal:not(.is-visible)', root);
    if (!('IntersectionObserver' in window) || designMode) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    }
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- parallax relativo al viewport ---------- */
  var layers = [];
  var ticking = false;

  function refreshLayers() { layers = qsa('[data-speed]'); applyParallax(); }

  function applyParallax() {
    ticking = false;
    if (reduce) return;
    var center = window.innerHeight / 2;
    layers.forEach(function (el) {
      if (!el.isConnected) return;
      var speed = parseFloat(el.getAttribute('data-speed'));
      if (isNaN(speed)) speed = 0.6;
      var rect = el.getBoundingClientRect();
      var dist = rect.top + rect.height / 2 - center;
      var offset = dist * (speed - 1) * 0.3;
      if (offset > 160) offset = 160;
      if (offset < -160) offset = -160;
      el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
    });
  }

  function onScroll() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(applyParallax); }
  }

  /* ---------- intro ---------- */
  function initIntro() {
    var intro = qs('#intro');
    if (!intro) return;
    if (!html.classList.contains('has-intro')) { intro.style.display = 'none'; return; }
    if (designMode) { html.classList.remove('has-intro'); return; }

    var q = qs('#intro-q'), a = qs('#intro-a'), btn = qs('#intro-btn'), page = qs('#page');
    var timers = [];
    function after(ms, fn) { timers.push(setTimeout(fn, ms)); }

    html.style.overflow = 'hidden';

    if (reduce) {
      q.classList.add('is-visible');
      after(700, function () { q.classList.remove('is-visible'); a.classList.add('is-visible'); });
      after(1100, function () { btn.classList.add('is-visible'); btn.focus(); });
    } else {
      after(300, function () { q.classList.add('is-visible'); });
      after(2300, function () { q.classList.remove('is-visible'); });
      after(3150, function () { a.classList.add('is-visible'); });
      after(5150, function () { a.classList.remove('is-visible'); });
      after(5850, function () { btn.classList.add('is-visible'); btn.focus(); });
    }

    btn.addEventListener('click', function () {
      timers.forEach(clearTimeout);
      try { sessionStorage.setItem('dropIntroSeen', '1'); } catch (e) {}
      intro.classList.add('intro--zoom');
      page.classList.add('page--visible');
      html.style.overflow = '';
      setTimeout(function () {
        intro.style.display = 'none';
        html.classList.remove('has-intro');
      }, reduce ? 320 : 1200);
    });
  }

  /* ---------- transición parallax entre páginas ---------- */
  function setVeilFigure(fig) {
    var holder = qs('#route-veil-figure');
    if (!holder) return;
    var tpl = fig ? qs('#figure-' + fig) : null;
    holder.innerHTML = tpl ? tpl.innerHTML : '';
  }

  function goWithVeil(el, href) {
    var veil = qs('#route-veil');
    if (!veil) { window.location.href = href; return; }
    var label = el.getAttribute('data-veil') || 'DROP.';
    var fig = el.getAttribute('data-veil-figure') || '';
    var r = el.getBoundingClientRect();
    veil.style.transformOrigin = (r.left + r.width / 2) + 'px ' + (r.top + r.height / 2) + 'px';
    qs('#route-veil-label').textContent = label;
    setVeilFigure(fig);
    try { sessionStorage.setItem('dropVeil', JSON.stringify({ label: label, figure: fig })); } catch (e) {}
    veil.classList.remove('is-clearing');
    veil.classList.add('is-covering');
    setTimeout(function () { window.location.href = href; }, 560);
  }

  function clearArrival() {
    var veil = qs('#route-veil');
    if (!veil) return;
    if (!html.classList.contains('veil-arrive')) return;
    setTimeout(function () {
      veil.classList.add('is-clearing');
      html.classList.remove('veil-arrive');
      try { sessionStorage.removeItem('dropVeil'); } catch (e) {}
      setTimeout(function () { veil.classList.remove('is-clearing'); }, 650);
    }, reduce ? 0 : 200);
  }

  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    var veil = qs('#route-veil');
    if (veil) { veil.classList.remove('is-covering', 'is-clearing'); }
    html.classList.remove('veil-arrive');
    try { sessionStorage.removeItem('dropVeil'); } catch (err) {}
    refreshCart();
  });

  /* ---------- carrito ---------- */
  var drawer = null;
  var isCartPage = false;

  function setCount(n) {
    qsa('[data-cart-count]').forEach(function (el) { el.textContent = n; });
  }

  function openCart() {
    if (isCartPage) return;
    if (!drawer) { window.location.href = D.routes.cart; return; }
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    html.classList.add('js-lock');
    var close = qs('.icon-btn', drawer);
    if (close) close.focus();
  }

  function closeCart() {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    html.classList.remove('js-lock');
  }

  function refreshCart() {
    if (!drawer) return Promise.resolve();
    return fetch(D.routes.root + '?sections=cart-drawer', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var doc = new DOMParser().parseFromString(data['cart-drawer'] || '', 'text/html');
        var fresh = qs('[data-cart-content]', doc);
        var cur = qs('[data-cart-content]', drawer);
        if (fresh && cur) cur.innerHTML = fresh.innerHTML;
        var panel = qs('.cart-drawer__panel', doc);
        setCount(panel ? parseInt(panel.getAttribute('data-count'), 10) || 0 : 0);
      })
      .catch(function () { /* sin conexión: se deja el estado actual */ });
  }

  function jsonPost(url, body) {
    return fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify(body)
    }).then(function (r) {
      return r.json().then(function (data) {
        if (!r.ok) { var err = new Error(data.description || data.message || D.strings.error); err.data = data; throw err; }
        return data;
      });
    });
  }

  function afterCartChange(openDrawer) {
    if (isCartPage) { window.location.reload(); return Promise.resolve(); }
    return refreshCart().then(function () { if (openDrawer) openCart(); });
  }

  function changeLine(key, qty) {
    return jsonPost(D.routes.cartChange + '.js', { id: key, quantity: qty })
      .then(function () { return afterCartChange(false); })
      .catch(function (err) { toast(err.message || D.strings.error); });
  }

  function quickAdd(btn) {
    var id = parseInt(btn.getAttribute('data-quick-add'), 10);
    btn.disabled = true;
    return jsonPost(D.routes.cartAdd + '.js', { items: [{ id: id, quantity: 1 }] })
      .then(function () { toast(D.strings.added); return afterCartChange(true); })
      .catch(function (err) { toast(err.message || D.strings.error); })
      .then(function () { btn.disabled = false; });
  }

  /* ---------- página de producto ---------- */
  function initProduct() {
    var section = qs('[data-product-section]');
    if (!section) return;
    var jsonEl = qs('[data-product-json]', section);
    var form = qs('#product-form', section);
    if (!jsonEl || !form) return;
    var product = JSON.parse(jsonEl.textContent);
    var idInput = qs('[data-variant-id]', form);
    var btn = qs('[data-add-to-cart]', form);

    function selected() {
      return qsa('fieldset.option', form).map(function (fs) {
        var c = qs('input:checked', fs);
        return c ? c.value : null;
      });
    }

    function findVariant(opts) {
      for (var i = 0; i < product.variants.length; i++) {
        var v = product.variants[i], ok = true;
        for (var j = 0; j < opts.length; j++) {
          if (v['option' + (j + 1)] !== opts[j]) { ok = false; break; }
        }
        if (ok) return v;
      }
      return null;
    }

    function showImage(src, id) {
      var main = qs('[data-main-img]', section);
      if (main && src) main.src = src;
      qsa('[data-thumb]', section).forEach(function (t) {
        t.setAttribute('aria-current', String(t.getAttribute('data-image-id') === String(id)));
      });
    }

    function update() {
      var v = findVariant(selected());
      var price = qs('[data-price]', section);
      var old = qs('[data-price-old]', section);
      var disc = qs('[data-discount]', section);
      if (!v) {
        btn.disabled = true;
        btn.textContent = D.strings.unavailable;
        return;
      }
      idInput.value = v.id;
      idInput.dispatchEvent(new Event('change', { bubbles: true }));
      price.textContent = money(v.price) + ' ' + (D.currency || '');
      if (v.compare_at_price && v.compare_at_price > v.price) {
        old.textContent = money(v.compare_at_price);
        old.hidden = false;
        disc.textContent = '-' + Math.round((v.compare_at_price - v.price) * 100 / v.compare_at_price) + '%';
        disc.hidden = false;
      } else {
        old.hidden = true;
        disc.hidden = true;
      }
      btn.disabled = !v.available;
      btn.textContent = v.available ? D.strings.add : D.strings.soldOut;
      if (window.history && history.replaceState) history.replaceState(null, '', '?variant=' + v.id);
      if (v.featured_image) showImage(v.featured_image.src, v.featured_image.id);
    }

    form.addEventListener('change', function (e) {
      if (e.target && e.target.name && e.target.name.indexOf('option-') === 0) update();
    });

    section.addEventListener('click', function (e) {
      var step = e.target.closest('[data-qty-step]');
      if (step) {
        var input = qs('[data-qty-input]', form);
        var next = (parseInt(input.value, 10) || 1) + parseInt(step.getAttribute('data-qty-step'), 10);
        input.value = Math.min(99, Math.max(1, next));
        return;
      }
      var thumb = e.target.closest('[data-thumb]');
      if (thumb) showImage(thumb.getAttribute('data-thumb'), thumb.getAttribute('data-image-id'));
    });

    form.addEventListener('submit', function (e) {
      if (e.submitter && e.submitter.name === 'checkout') return;
      e.preventDefault();
      var err = qs('[data-form-error]', form);
      if (err) err.textContent = '';
      btn.disabled = true;
      var qty = parseInt(qs('[data-qty-input]', form).value, 10) || 1;
      jsonPost(D.routes.cartAdd + '.js', { items: [{ id: parseInt(idInput.value, 10), quantity: qty }] })
        .then(function () { toast(D.strings.added); return afterCartChange(true); })
        .catch(function (ex) { if (err) err.textContent = ex.message || D.strings.error; })
        .then(function () { btn.disabled = false; });
    });
  }

  /* ---------- pedido por WhatsApp desde el formulario ---------- */
  function sendOrderToWhatsApp() {
    var form = qs('#order-form');
    if (!form) return;
    function val(name) {
      var el = form.elements[name];
      return el && el.value ? el.value.trim() : '';
    }
    var name = val('contact[name]');
    var body = val('contact[body]');
    if (!name || !body) {
      toast('Escribe tu nombre y qué prenda(s) quieres.');
      var focusEl = !name ? form.elements['contact[name]'] : form.elements['contact[body]'];
      if (focusEl) focusEl.focus();
      return;
    }
    var lines = ['Hola buen día. Quisiera hacer un pedido.'];
    lines.push('Nombre: ' + name);
    if (val('contact[phone]')) lines.push('Teléfono: ' + val('contact[phone]'));
    lines.push('Prenda(s): ' + body);
    if (val('contact[Talla]')) lines.push('Talla: ' + val('contact[Talla]'));
    if (val('contact[Cantidad]')) lines.push('Cantidad: ' + val('contact[Cantidad]'));
    if (val('contact[Entrega]')) lines.push('Entrega en: ' + val('contact[Entrega]'));
    var number = (D.whatsapp.number || '').replace(/\D/g, '');
    window.open('https://wa.me/' + number + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
  }

  /* ---------- eventos delegados ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t.closest) return;

    // menú Productos
    var trigger = t.closest('#productos-trigger');
    var panel = qs('#productos-menu');
    var triggerEl = qs('#productos-trigger');
    if (trigger && panel) {
      var open = !panel.classList.contains('is-open');
      panel.classList.toggle('is-open', open);
      trigger.setAttribute('aria-expanded', String(open));
    } else if (panel && !t.closest('#productos-menu')) {
      panel.classList.remove('is-open');
      if (triggerEl) triggerEl.setAttribute('aria-expanded', 'false');
    }

    // menú móvil
    var toggle = t.closest('[data-menu-toggle]');
    var menu = qs('[data-mobile-menu]');
    if (toggle && menu) {
      var isOpen = !menu.classList.contains('is-open');
      menu.classList.toggle('is-open', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
      html.classList.toggle('js-lock', isOpen);
    } else if (menu && menu.classList.contains('is-open') && t.closest('a', menu)) {
      menu.classList.remove('is-open');
      var tg = qs('[data-menu-toggle]');
      if (tg) tg.setAttribute('aria-expanded', 'false');
      html.classList.remove('js-lock');
    }

    // carrito
    if (t.closest('[data-cart-open]')) { e.preventDefault(); openCart(); return; }
    if (t.closest('[data-cart-close]')) { closeCart(); }
    var qtyBtn = t.closest('[data-cart-qty]');
    if (qtyBtn) { changeLine(qtyBtn.getAttribute('data-cart-qty'), parseInt(qtyBtn.getAttribute('data-qty'), 10)); return; }
    var quick = t.closest('[data-quick-add]');
    if (quick) { e.preventDefault(); quickAdd(quick); return; }

    // pedido por WhatsApp
    if (t.closest('[data-order-whatsapp]')) { sendOrderToWhatsApp(); return; }

    // transición con velo
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var link = t.closest('a[data-veil]');
    if (link && !reduce) {
      var href = link.getAttribute('href');
      if (href && href.charAt(0) !== '#' && link.target !== '_blank') {
        e.preventDefault();
        goWithVeil(link, href);
      }
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    closeCart();
    var panel = qs('#productos-menu');
    if (panel && panel.classList.contains('is-open')) {
      panel.classList.remove('is-open');
      var tr = qs('#productos-trigger');
      if (tr) { tr.setAttribute('aria-expanded', 'false'); tr.focus(); }
    }
    var menu = qs('[data-mobile-menu]');
    if (menu && menu.classList.contains('is-open')) {
      menu.classList.remove('is-open');
      html.classList.remove('js-lock');
    }
  });

  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.matches && t.matches('[data-sort-select]')) {
      var url = new URL(window.location.href);
      url.searchParams.set('sort_by', t.value);
      url.searchParams.delete('page');
      window.location.href = url.toString();
    }
    if (t.matches && t.matches('[data-cart-note]')) {
      jsonPost(D.routes.cartUpdate + '.js', { note: t.value }).catch(function () {});
    }
  });

  /* ---------- arranque ---------- */
  function init() {
    drawer = qs('[data-cart-drawer]');
    isCartPage = !!qs('[data-cart-page]');
    initReveal(document);
    refreshLayers();
    initIntro();
    initProduct();
    clearArrival();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  }

  document.addEventListener('shopify:section:load', function (e) {
    initReveal(e.target);
    refreshLayers();
    initProduct();
  });

  init();
})();
