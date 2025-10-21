(() => {
  const parseCurrency = (str) => parseFloat(String(str).replace(/[^0-9.-]+/g, '')) || 0;
  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  const basePriceEl = document.getElementById('displayPrice');
  const basePrice = parseCurrency(basePriceEl.textContent);

  const decreaseBtn = document.getElementById('decreaseBtn');
  const increaseBtn = document.getElementById('increaseBtn');
  const qtyInput = document.getElementById('quantityInput');

  const subtotalEl = document.getElementById('subtotal');
  const discountRow = document.getElementById('discountRow');
  const discountAmountEl = document.getElementById('discountAmount');
  const totalPriceEl = document.getElementById('totalPrice');

  const addToCartBtn = document.getElementById('addToCartBtn');
  const buyNowBtn = document.getElementById('buyNowBtn');

  const pricingRows = Array.from(document.querySelectorAll('.pricing-row')).map(row => {
    const minQty = parseInt(row.dataset.minQty || '0', 10);
    const badge = row.querySelector('.discount-badge');
    const discount = badge ? parseFloat(String(badge.textContent).replace('%', '')) || 0 : 0;
    const priceTextEl = row.querySelector('.price-text');
    return { row, minQty, discount, priceTextEl };
  }).sort((a,b) => a.minQty - b.minQty);

  function clampQty(v){
    v = parseInt(v, 10);
    if (isNaN(v) || v < 1) return 1;
    return v;
  }

  function updatePricingRows() {
    pricingRows.forEach(t => {
      const priceEach = basePrice * (1 - t.discount / 100);
      if (t.priceTextEl) t.priceTextEl.textContent = formatter.format(priceEach) + ' USD';
    });
  }

  function updateUI() {
    let q = clampQty(qtyInput.value);
    qtyInput.value = q;

    // pick the highest applicable discount (largest minQty <= q)
    const applicable = [...pricingRows].filter(t => q >= t.minQty).sort((a,b) => b.minQty - a.minQty)[0];
    const activeDiscount = applicable ? applicable.discount : 0;

    // toggle active class for rows
    pricingRows.forEach(t => {
      if (q >= t.minQty && t.minQty > 0) t.row.classList.add('active');
      else t.row.classList.remove('active');
    });

    const subtotalBefore = basePrice * q;
    const discountAmount = subtotalBefore * (activeDiscount / 100);
    const total = subtotalBefore - discountAmount;

    subtotalEl.textContent = formatter.format(subtotalBefore);
    if (activeDiscount > 0) {
      discountRow.style.display = 'flex';
      discountAmountEl.textContent = '-' + formatter.format(discountAmount);
    } else {
      discountRow.style.display = 'none';
      discountAmountEl.textContent = '-$0.00';
    }
    totalPriceEl.textContent = formatter.format(total);

    // little visual pulse on base price
    const priceAmount = document.querySelector('.price-amount');
    if (priceAmount) {
      priceAmount.classList.remove('updated');
      // force reflow
      void priceAmount.offsetWidth;
      priceAmount.classList.add('updated');
    }
  }

  // wire controls
  decreaseBtn.addEventListener('click', () => {
    qtyInput.value = clampQty(parseInt(qtyInput.value || '1', 10) - 1);
    updateUI();
  });
  increaseBtn.addEventListener('click', () => {
    qtyInput.value = clampQty(parseInt(qtyInput.value || '1', 10) + 1);
    updateUI();
  });

  qtyInput.addEventListener('input', () => {
    qtyInput.value = clampQty(qtyInput.value);
    updateUI();
  });

  // clicking a pricing row sets quantity at least to that tier
  pricingRows.forEach(t => {
    t.row.addEventListener('click', () => {
      const min = Math.max(1, t.minQty || 1);
      qtyInput.value = Math.max(min, clampQty(qtyInput.value));
      updateUI();
    });
  });

  addToCartBtn.addEventListener('click', () => {
   
  });

  buyNowBtn.addEventListener('click', () => {
    // No alert — let the anchor's default navigation/behavior happenz
  });

  // initial render
  updatePricingRows();
  updateUI();
})();