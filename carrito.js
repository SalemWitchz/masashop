/* Masashop: el pedido (carrito) y su mensaje de WhatsApp.
   Para cambiar el número de WhatsApp, edita WHATSAPP (solo dígitos, con código de país). */
(function () {
  'use strict';
  var WHATSAPP = '5219681240597';
  var KEY = 'masashop-pedido';
  var SVG = 'http://www.w3.org/2000/svg';

  var list = document.getElementById('cart-list');
  var empty = document.getElementById('cart-empty');
  var totalEl = document.getElementById('cart-total');
  var send = document.getElementById('cart-send');
  var status = document.getElementById('cart-status');
  if (!list || !send) return;

  var items = [];
  try { items = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { items = []; }
  if (!Array.isArray(items)) items = [];

  function money(n) { return '$' + Number(n).toLocaleString('es-MX'); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) { /* sin almacenamiento: el pedido vive mientras la página esté abierta */ } }
  function label(it) { return it.name + (it.size ? ', talla ' + it.size : ''); }

  function icon(d) {
    var s = document.createElementNS(SVG, 'svg');
    s.setAttribute('viewBox', '0 0 16 16');
    s.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS(SVG, 'path');
    p.setAttribute('d', d);
    s.appendChild(p);
    return s;
  }

  function message() {
    if (!items.length) return 'Hola Masashop, quiero hacer un pedido.';
    var lines = ['Hola Masashop, quiero hacer este pedido:'];
    var total = 0;
    items.forEach(function (it) {
      total += it.price * it.qty;
      lines.push('- ' + it.qty + ' x ' + label(it) + ': ' + money(it.price * it.qty));
    });
    lines.push('Total: ' + money(total));
    return lines.join('\n');
  }

  /* fresh: el índice de la fila recién agregada; solo esa entra con movimiento */
  function render(fresh) {
    list.textContent = '';
    var total = 0;
    items.forEach(function (it, i) {
      total += it.price * it.qty;
      var li = document.createElement('li');
      if (i === fresh) li.className = 'is-new';

      var name = document.createElement('span');
      name.className = 'rows__name';
      name.textContent = label(it);

      var qty = document.createElement('span');
      qty.className = 'cart__qty';
      var minus = document.createElement('button');
      minus.type = 'button';
      minus.appendChild(icon('M3.5 8h9'));
      minus.setAttribute('aria-label', (it.qty === 1 ? 'Quitar del pedido: ' : 'Quitar una pieza de ') + label(it));
      minus.addEventListener('click', function () { change(i, -1); });
      var n = document.createElement('span');
      n.textContent = it.qty;
      var plus = document.createElement('button');
      plus.type = 'button';
      plus.appendChild(icon('M3.5 8h9M8 3.5v9'));
      plus.setAttribute('aria-label', 'Agregar una pieza de ' + label(it));
      plus.addEventListener('click', function () { change(i, 1); });
      qty.append(minus, n, plus);

      var price = document.createElement('span');
      price.className = 'rows__value';
      price.textContent = money(it.price * it.qty);

      li.append(name, price, qty);
      list.append(li);
    });
    empty.hidden = items.length > 0;
    totalEl.textContent = money(total);
    send.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(message());
  }

  function count() { return items.reduce(function (s, it) { return s + it.qty; }, 0); }

  function change(i, d) {
    var it = items[i];
    if (!it) return;
    var name = label(it);
    it.qty += d;
    var removed = it.qty <= 0;
    if (removed) items.splice(i, 1);
    save(); render(-1);
    if (status) status.textContent = removed
      ? 'Quitaste ' + name + ' de tu pedido.'
      : 'Llevas ' + it.qty + (it.qty === 1 ? ' pieza' : ' piezas') + ' de ' + name + '.';
    /* el foco no se pierde al redibujar la lista */
    var row = list.children[Math.min(i, list.children.length - 1)];
    var btn = row && row.querySelectorAll('button')[d > 0 && !removed ? 1 : 0];
    if (btn) btn.focus({ preventScroll: true }); else if (removed) send.focus({ preventScroll: true });
  }

  function add(name, price, size) {
    var idx = -1;
    items.forEach(function (it, i) { if (it.name === name && it.size === size) idx = i; });
    var fresh = -1;
    if (idx >= 0) items[idx].qty += 1; else { items.push({ name: name, price: price, size: size, qty: 1 }); fresh = items.length - 1; }
    save(); render(fresh);
    var c = count();
    if (status) status.textContent = 'Agregaste ' + name + (size ? ', talla ' + size : '') + '. Llevas ' + c + (c === 1 ? ' pieza' : ' piezas') + ' en tu pedido.';
  }

  document.querySelectorAll('[data-add]').forEach(function (btn) {
    var lab = btn.querySelector('.btn__label');
    if (!lab) return;
    var original = lab.textContent;
    var timer = 0;
    function swap(text, done) {
      lab.classList.add('is-swapping');
      setTimeout(function () {
        lab.textContent = text;
        if (done) lab.prepend(icon('M3.5 8.5l3 3 6-7'));
        lab.classList.remove('is-swapping');
      }, 110);
    }
    btn.addEventListener('click', function () {
      var sel = btn.dataset.size ? document.getElementById(btn.dataset.size) : null;
      add(btn.dataset.name, Number(btn.dataset.price), sel ? sel.value : '');
      clearTimeout(timer);
      swap('Agregado', true);
      timer = setTimeout(function () { swap(original, false); }, 1500);
    });
  });

  render(-1);
})();
