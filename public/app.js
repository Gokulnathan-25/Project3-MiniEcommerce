const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const money = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
const imageByProduct = {
  1: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=750&q=85',
  2: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=750&q=85',
  3: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=750&q=85',
  4: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=750&q=85',
  5: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=750&q=85',
  6: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=750&q=85',
  7: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=750&q=85',
  8: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=750&q=85'
};
const productImage = product => imageByProduct[product.id]
  || `https://images.pexels.com/photos/${product.imageId}/pexels-photo-${product.imageId}.jpeg?auto=compress&cs=tinysrgb&w=750`;
const state = { products: [], categories: ['All'], category: 'All', sort: 'featured', query: '', cart: { items: [], subtotal: 0, shipping: 0, total: 0, itemCount: 0 }, user: null, authMode: 'login', toastTimer: null, busy: false };

async function api(url, options = {}) {
  const config = { credentials: 'same-origin', ...options, headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) } };
  const response = await fetch(url, config);
  let data = {};
  try { data = await response.json(); } catch { data = {}; }
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
  return data;
}
function toast(message) {
  const node = $('#toast'); node.textContent = message; node.classList.add('show');
  clearTimeout(state.toastTimer); state.toastTimer = setTimeout(() => node.classList.remove('show'), 2800);
}
function setBusy(button, busy, label = 'Please wait…') {
  if (!button) return;
  if (busy) { button.dataset.originalText = button.innerHTML; button.disabled = true; button.innerHTML = label; }
  else { button.disabled = false; if (button.dataset.originalText) button.innerHTML = button.dataset.originalText; }
}
function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }

async function loadProducts() {
  const params = new URLSearchParams({ category: state.category, sort: state.sort, q: state.query });
  const data = await api(`/api/products?${params}`); state.products = data.products; state.categories = data.categories;
  $$('.category-chip').forEach(chip => {
    let count = chip.querySelector('span');
    if (!count) { count = document.createElement('span'); chip.append(count); }
    count.textContent = data.categoryCounts[chip.dataset.category] ?? 0;
  });
  renderProducts();
}
function renderProducts() {
  const grid = $('#productGrid'); const empty = $('#emptyState');
  $('#resultsCount').textContent = `${state.products.length} ${state.products.length === 1 ? 'piece' : 'pieces'} to love`;
  if (!state.products.length) { grid.innerHTML = ''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  grid.innerHTML = state.products.map((p, index) => `
    <article class="product-card" style="animation-delay:${Math.min(index * 45, 250)}ms">
      <div class="product-image" style="background:${p.color}">
        ${p.badge ? `<span class="product-badge">${escapeHtml(p.badge)}</span>` : ''}
        <img src="${productImage(p)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.style.display='none';this.parentElement.insertAdjacentHTML('beforeend','<span style=&quot;font-size:64px&quot;>${escapeHtml(p.emoji)}</span>')" />
        <button class="product-quick-add" data-add="${p.id}">Add to bag <span>＋</span></button>
      </div>
      <div class="product-info"><div class="product-category">${escapeHtml(p.category)}</div>
        <div class="product-title-row"><h3 class="product-title">${escapeHtml(p.name)}</h3><span class="product-rating"><span>★</span> ${p.rating}</span></div>
        <div class="product-price-row"><span class="product-price">${money(p.price)}</span><span class="old-price">${money(p.oldPrice)}</span><span class="discount">${Math.round((1-p.price/p.oldPrice)*100)}% off</span></div>
      </div>
    </article>`).join('');
}
async function loadCart() { state.cart = await api('/api/cart'); renderCart(); }
function renderCart() {
  const cart = state.cart; $('#bagCount').textContent = cart.itemCount; $('#drawerCount').textContent = `(${cart.itemCount})`;
  $('#cartSubtotal').textContent = money(cart.subtotal); $('#cartShipping').textContent = cart.shipping === 0 ? 'Complimentary' : money(cart.shipping); $('#cartTotal').textContent = money(cart.total);
  const left = Math.max(0, 1999 - cart.subtotal); $('#shippingLeft').textContent = money(left); $('#shippingProgressBar').style.width = `${Math.min(100, cart.subtotal / 1999 * 100)}%`;
  $('#shippingProgress').classList.toggle('hidden', cart.itemCount === 0 || cart.subtotal >= 1999);
  $('#cartEmpty').classList.toggle('hidden', cart.itemCount > 0); $('#cartFooter').classList.toggle('hidden', cart.itemCount === 0);
  $('#cartItems').innerHTML = cart.items.map(item => `<div class="cart-line"><div class="cart-line-image"><img src="${productImage(item)}" alt="${escapeHtml(item.name)}" /></div><div><div class="cart-line-category">${escapeHtml(item.category)}</div><h3 class="cart-line-title">${escapeHtml(item.name)}</h3><div class="cart-line-price">${money(item.price)}</div><div class="quantity-control"><button data-quantity="${item.id}" data-next="${item.quantity-1}" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button data-quantity="${item.id}" data-next="${item.quantity+1}" aria-label="Increase quantity">+</button></div></div><div class="cart-line-end"><strong>${money(item.lineTotal)}</strong><br /><button class="remove-item" data-remove="${item.id}">Remove</button></div></div>`).join('');
}
function openOverlay() { $('#overlay').classList.add('open'); document.body.classList.add('locked'); }
function closeAll() {
  $('#overlay').classList.remove('open'); document.body.classList.remove('locked');
  $('#cartDrawer').classList.remove('open'); $('#cartDrawer').setAttribute('aria-hidden', 'true');
  $$('.modal').forEach(modal => modal.classList.remove('open'));
}
function openCart() { closeAll(); openOverlay(); $('#cartDrawer').classList.add('open'); $('#cartDrawer').setAttribute('aria-hidden', 'false'); }
function openModal(id) { closeAll(); openOverlay(); $(`#${id}`).classList.add('open'); }
function updateAccountUI() { $('#accountLabel').textContent = state.user ? state.user.name.split(' ')[0] : 'Sign in'; }
function openAuth(mode = 'login') {
  setAuthMode(mode); $('#authError').textContent = ''; openModal('authModal');
  setTimeout(() => $(mode === 'register' ? '#authName' : '#authEmail').focus(), 100);
}
function setAuthMode(mode) {
  state.authMode = mode;
  $$('[data-auth-tab]').forEach(tab => tab.classList.toggle('active', tab.dataset.authTab === mode));
  $('#nameField').classList.toggle('hidden', mode !== 'register'); $('#authName').required = mode === 'register';
  $('#authPassword').autocomplete = mode === 'register' ? 'new-password' : 'current-password';
  $('#authTitle').innerHTML = mode === 'register' ? 'Make yourself <em>at home.</em>' : 'Good to have <em>you here.</em>';
  $('#authSubmit').innerHTML = mode === 'register' ? 'Create my account <span>→</span>' : 'Sign in <span>→</span>';
}
function openCheckout() {
  if (!state.cart.itemCount) return toast('Your bag is empty. Find something you love first.');
  if (!state.user) { state.afterAuth = 'checkout'; openAuth('login'); toast('Sign in or create an account to continue checkout.'); return; }
  $('#checkoutEmail').value = state.user.email || ''; $('#checkoutFullName').value = state.user.name || '';
  $('#checkoutAccountEmail').textContent = state.user.email || '';
  $('#checkoutError').textContent = ''; renderCheckoutSummary(); togglePaymentFields(); openModal('checkoutModal');
}
function renderCheckoutSummary() {
  const cart = state.cart;
  $('#checkoutSummaryItems').innerHTML = cart.items.map(item => `<div class="summary-item"><div class="summary-thumb"><img src="${productImage(item)}" alt=""/><span class="summary-qty">${item.quantity}</span></div><div><div class="summary-item-name">${escapeHtml(item.name)}</div><div class="summary-item-category">${escapeHtml(item.category)}</div></div><div class="summary-item-price">${money(item.lineTotal)}</div></div>`).join('');
  $('#summarySubtotal').textContent = money(cart.subtotal); $('#summaryShipping').textContent = cart.shipping === 0 ? 'Complimentary' : money(cart.shipping); $('#summaryTotal').textContent = money(cart.total);
}
function togglePaymentFields() { $('#testCardFields').classList.toggle('hidden', $('input[name="paymentMethod"]:checked')?.value !== 'card'); }

$('#productGrid').addEventListener('click', async event => {
  const button = event.target.closest('[data-add]'); if (!button) return;
  const id = Number(button.dataset.add); setBusy(button, true, 'Adding…');
  try { const data = await api('/api/cart', { method: 'POST', body: JSON.stringify({ productId: id, quantity: 1 }) }); state.cart = data; renderCart(); toast(data.message); button.innerHTML = 'Added ✓'; setTimeout(() => { if (button.isConnected) { button.disabled = false; button.innerHTML = 'Add to bag <span>＋</span>'; } }, 900); }
  catch (error) { setBusy(button, false); toast(error.message); }
});
$('#cartItems').addEventListener('click', async event => {
  const remove = event.target.closest('[data-remove]'); const quantity = event.target.closest('[data-quantity]');
  try {
    if (remove) { state.cart = await api(`/api/cart/${remove.dataset.remove}`, { method: 'DELETE' }); renderCart(); toast('Removed from your bag.'); }
    if (quantity) { const next = Number(quantity.dataset.next); if (next < 1) { state.cart = await api(`/api/cart/${quantity.dataset.quantity}`, { method: 'DELETE' }); toast('Removed from your bag.'); } else { state.cart = await api(`/api/cart/${quantity.dataset.quantity}`, { method: 'PATCH', body: JSON.stringify({ quantity: next }) }); } renderCart(); }
  } catch (error) { toast(error.message); }
});
$('#categoryRow').addEventListener('click', async event => { const chip = event.target.closest('[data-category]'); if (!chip) return; state.category = chip.dataset.category; $$('.category-chip').forEach(el => el.classList.toggle('active', el === chip)); await loadProducts(); });
$('#sortSelect').addEventListener('change', async event => { state.sort = event.target.value; await loadProducts(); });
let searchDelay;
$('#searchInput').addEventListener('input', event => { state.query = event.target.value; clearTimeout(searchDelay); searchDelay = setTimeout(() => loadProducts().catch(err => toast(err.message)), 180); });
$('#clearFilters').addEventListener('click', async () => { state.category = 'All'; state.sort = 'featured'; state.query = ''; $('#searchInput').value = ''; $('#sortSelect').value = 'featured'; $$('.category-chip').forEach(el => el.classList.toggle('active', el.dataset.category === 'All')); await loadProducts(); });
$('#searchToggle').addEventListener('click', () => { $('#searchBox').scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => $('#searchInput').focus(), 300); });
$$('[data-nav-category]').forEach(link => link.addEventListener('click', async () => { state.category = link.dataset.navCategory; $$('.category-chip').forEach(el => el.classList.toggle('active', el.dataset.category === state.category)); await loadProducts(); }));
$('#openCart').addEventListener('click', async () => { try { await loadCart(); openCart(); } catch (error) { toast(error.message); } });
$('#continueShopping').addEventListener('click', closeAll);
$('#checkoutButton').addEventListener('click', openCheckout);
$('#overlay').addEventListener('click', closeAll);
$$('[data-close]').forEach(button => button.addEventListener('click', closeAll));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeAll(); });
$('#accountButton').addEventListener('click', async () => {
  if (!state.user) return openAuth('login');
  try { const data = await api('/api/orders'); const latest = data.orders[0]; const action = latest ? `You have ${data.orders.length} order(s). Latest: ${latest.id} — ${latest.status}.` : 'You have not placed any orders yet.'; if (confirm(`${state.user.name}\n${state.user.email}\n\n${action}\n\nPress OK to sign out, or Cancel to stay signed in.`)) { await api('/api/auth/logout', { method: 'POST' }); state.user = null; updateAccountUI(); toast('You have signed out.'); } }
  catch (error) { toast(error.message); }
});
$$('[data-auth-tab]').forEach(tab => tab.addEventListener('click', () => { setAuthMode(tab.dataset.authTab); $('#authError').textContent = ''; }));
$('#authForm').addEventListener('submit', async event => {
  event.preventDefault(); if (state.busy) return;
  const button = $('#authSubmit'); const payload = { email: $('#authEmail').value.trim(), password: $('#authPassword').value };
  if (state.authMode === 'register') payload.name = $('#authName').value.trim();
  state.busy = true; setBusy(button, true, 'One moment…'); $('#authError').textContent = '';
  try {
    const data = await api(`/api/auth/${state.authMode === 'register' ? 'register' : 'login'}`, { method: 'POST', body: JSON.stringify(payload) });
    state.user = data.user; updateAccountUI(); $('#authForm').reset(); closeAll(); toast(data.message);
    if (state.afterAuth === 'checkout') { state.afterAuth = null; openCheckout(); }
  } catch (error) { $('#authError').textContent = error.message; }
  finally { state.busy = false; setBusy(button, false); }
});
$$('input[name="paymentMethod"]').forEach(input => input.addEventListener('change', togglePaymentFields));
$('#testCard').addEventListener('input', event => { const digits = event.target.value.replace(/\D/g, '').slice(0, 16); event.target.value = digits.replace(/(\d{4})(?=\d)/g, '$1 '); });
$('#checkoutForm').addEventListener('submit', async event => {
  event.preventDefault(); if (state.busy) return;
  const button = $('#placeOrderButton'); const form = new FormData(event.currentTarget);
  const payload = Object.fromEntries(form.entries());
  payload.testCard = payload.testCard || '';
  state.busy = true; setBusy(button, true, 'Placing your demo order…'); $('#checkoutError').textContent = '';
  try {
    const data = await api('/api/checkout', { method: 'POST', body: JSON.stringify(payload) });
    state.cart = await api('/api/cart'); renderCart(); closeAll();
    $('#orderReference').textContent = data.order.id; $('#successMessage').textContent = data.message;
    $('#successDetail').textContent = `${data.order.items.length} product line(s) · Total ${money(data.order.total)} · ${data.order.paymentStatus === 'paid-test-mode' ? 'Test payment approved' : data.order.paymentStatus === 'cash-on-delivery' ? 'Cash on delivery selected' : 'Demo card declined'}`;
    openModal('successModal'); event.currentTarget.reset(); $('#testCard').value = '4242 4242 4242 4242'; togglePaymentFields();
  } catch (error) { $('#checkoutError').textContent = error.message; }
  finally { state.busy = false; setBusy(button, false); }
});
$('#copyOrderId').addEventListener('click', async () => { try { await navigator.clipboard.writeText($('#orderReference').textContent); toast('Order reference copied.'); } catch { toast(`Order reference: ${$('#orderReference').textContent}`); } });
$('#backToShop').addEventListener('click', closeAll);
$('#newsletterForm').addEventListener('submit', event => { event.preventDefault(); const email = $('#newsletterEmail').value.trim(); if (email) { toast('Thanks for your interest! Newsletter sign-up is demo-only.'); event.currentTarget.reset(); } });
$('#mobileMenu').addEventListener('click', () => { $('.main-nav').classList.toggle('open'); });
$$('.main-nav a').forEach(link => link.addEventListener('click', () => $('.main-nav').classList.remove('open')));

(async function init() {
  try {
    const [me] = await Promise.all([api('/api/auth/me').then(data => { state.user = data.user; updateAccountUI(); }), loadProducts(), loadCart()]);
    updateAccountUI();
  } catch (error) { $('#productGrid').innerHTML = `<div class="loading-products">Could not load the store. Please refresh. <small>${escapeHtml(error.message)}</small></div>`; }
})();
