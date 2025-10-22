/**
 * Single script file for the Cushion Skin website.
 *
 * This script checks which page is currently active and runs the
 * appropriate logic. This makes it much easier to maintain than
 * multiple script files.
 *
 * - Homepage Logic: Handles the copyright year.
 * - "Wholesale" Product Page Logic: Handles the retail/wholesale toggle and pricing.
 * - "Simple" Product Page Logic: Handles quantity/pricing for single-price items.
 */

// --- Global Utilities ---
// FIXED: Moved formatter and clampQty to the global scope so all functions can access them.
const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function clampQty(v) {
  let n = parseInt(v, 10);
  if (isNaN(n) || n < 1) n = 1;
  return n;
}

// --- Router ---
document.addEventListener('DOMContentLoaded', () => {
  
  // --- Homepage Logic ---
  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // --- "Wholesale" Product Page Logic (foodology.html) ---
  const pricingEl = document.getElementById('pricing');
  if (pricingEl) {
    runWholesaleLogic();
  }

  // --- "Simple" Product Page Logic (lacto-fit.html) ---
  const simplePriceEl = document.getElementById('displayPrice');
  // Check for simple price *and* that it's not the wholesale page
  if (simplePriceEl && !pricingEl) {
    runSimpleLogic();
  }
});


/**
 * Logic for the "Wholesale" product page (e.g., foodology.html)
 */
function runWholesaleLogic() {
  const pricingEl = document.getElementById('pricing'); // container with data-retail / data-wholesale
  const displayRetailEl = document.getElementById('displayRetail');
  const displayWholesaleEl = document.getElementById('displayWholesale');
  
  const retailPrice = parseFloat(pricingEl?.dataset?.retail) || 0;
  const wholesalePrice = parseFloat(pricingEl?.dataset?.wholesale) || 0;

  const decreaseBtn = document.getElementById('decreaseBtn');
  const increaseBtn = document.getElementById('increaseBtn');
  const qtyInput = document.getElementById('quantityInput');

  const subtotalEl = document.getElementById('subtotal');
  const discountRow = document.getElementById('discountRow');
  const discountAmountEl = document.getElementById('discountAmount');
  const totalPriceEl = document.getElementById('totalPrice');

  const addToCartBtn = document.getElementById('addToCartBtn');

  // Get all pricing tiers
  const pricingRows = Array.from(document.querySelectorAll('.pricing-row')).map(row => {
    const minQty = parseInt(row.dataset.minQty || '0', 10);
    // FIXED: Read discount from data-attribute for robustness
    const discount = parseFloat(row.dataset.discount || '0');
    const priceTextEl = row.querySelector('.price-text');
    return { row, minQty, discount, priceTextEl };
  }).sort((a,b) => a.minQty - b.minQty);

  // Get current buy mode radio
  function getBuyMode(){
    const node = document.querySelector('input[name="buyOption"]:checked');
    return node ? node.value : 'retail';
  }

  // Update the per-tier price labels (always based on wholesale price)
  function updatePricingRows() {
    pricingRows.forEach(t => {
      if (!t.priceTextEl) return;
      const priceEach = wholesalePrice * (1 - t.discount / 100);
      t.priceTextEl.textContent = formatter.format(priceEach) + ' USD';
    });
  }

  function updateUI() {
    let q = clampQty(qtyInput.value);
    qtyInput.value = q;
    const mode = getBuyMode();

    // Determine base price depending on mode
    const base = mode === 'wholesale' ? wholesalePrice : retailPrice;

    // Only apply tier discounts when wholesale selected
    let activeDiscount = 0;
    let activeTier = null;
    if (mode === 'wholesale') {
      // Find the highest applicable discount tier
      activeTier = [...pricingRows].filter(t => q >= t.minQty).pop();
      activeDiscount = activeTier ? activeTier.discount : 0;
    }

    // Toggle active class for rows
    pricingRows.forEach(t => {
      if (mode === 'wholesale' && activeTier && t.minQty === activeTier.minQty) {
        t.row.classList.add('active');
      } else {
        t.row.classList.remove('active');
      }
    });

    const subtotalBefore = base * q;
    const discountAmount = subtotalBefore * (activeDiscount / 100);
    const total = subtotalBefore - discountAmount;

    // Update displayed price labels
    if (displayRetailEl) displayRetailEl.textContent = formatter.format(retailPrice);
    if (displayWholesaleEl) displayWholesaleEl.textContent = formatter.format(wholesalePrice);

    if (subtotalEl) subtotalEl.textContent = formatter.format(subtotalBefore);
    
    if (mode === 'wholesale' && activeDiscount > 0) {
      if (discountRow) discountRow.style.display = 'flex';
      if (discountAmountEl) discountAmountEl.textContent = '-' + formatter.format(discountAmount);
    } else {
      if (discountRow) discountRow.style.display = 'none';
      if (discountAmountEl) discountAmountEl.textContent = '-$0.00';
    }
    
    if (totalPriceEl) totalPriceEl.textContent = formatter.format(total);

    // Refresh per-tier displayed prices (always wholesale-based)
    updatePricingRows();
  }

  // Wire controls
  if (decreaseBtn) decreaseBtn.addEventListener('click', () => {
    qtyInput.value = clampQty(parseInt(qtyInput.value || '1', 10) - 1);
    updateUI();
  });
  if (increaseBtn) increaseBtn.addEventListener('click', () => {
    qtyInput.value = clampQty(parseInt(qtyInput.value || '1', 10) + 1);
    updateUI();
  });

  if (qtyInput) qtyInput.addEventListener('input', () => {
    qtyInput.value = clampQty(qtyInput.value);
    updateUI();
  });

  // When buy mode changes, recompute UI
  Array.from(document.querySelectorAll('input[name="buyOption"]')).forEach(r => {
    r.addEventListener('change', () => {
      updateUI();
    });
  });

  // Clicking a pricing row sets quantity at least to that tier (only wholesale)
  pricingRows.forEach(t => {
    t.row.addEventListener('click', () => {
      if (getBuyMode() !== 'wholesale') return;
      const min = Math.max(1, t.minQty || 1);
      const currentQty = clampQty(qtyInput.value);
      if (currentQty < min) {
        qtyInput.value = min;
        updateUI();
      }
    });
  });

  if (addToCartBtn) addToCartBtn.addEventListener('click', () => {
    const q = clampQty(qtyInput.value);
    console.log(`${q} item(s) added to cart — Total: ${totalPriceEl.textContent}`);
    // Add real add-to-cart logic here
  });

  // Initial render
  updatePricingRows();
  updateUI();
}


/**
 * Logic for the "Simple" product page (e.g., lacto-fit.html)
 */
function runSimpleLogic() {
  const displayPriceEl = document.getElementById('displayPrice');
  const basePrice = parseFloat(displayPriceEl?.dataset?.basePrice) || 0;

  const decreaseBtn = document.getElementById('decreaseBtn');
  const increaseBtn = document.getElementById('increaseBtn');
  const qtyInput = document.getElementById('quantityInput');

  const subtotalEl = document.getElementById('subtotal');
  const discountRow = document.getElementById('discountRow');
  const discountAmountEl = document.getElementById('discountAmount');
  const totalPriceEl = document.getElementById('totalPrice');

  // Get all pricing tiers
  const pricingRows = Array.from(document.querySelectorAll('.pricing-row')).map(row => {
    const minQty = parseInt(row.dataset.minQty || '0', 10);
    const discount = parseFloat(row.dataset.discount || '0');
    return { row, minQty, discount };
  }).sort((a,b) => a.minQty - b.minQty); // Sort by minQty ascending

  function updateUI() {
    let q = clampQty(qtyInput.value);
    qtyInput.value = q;

    // Find the highest applicable discount tier
    let activeDiscount = 0;
    let activeTier = null;
    activeTier = [...pricingRows].filter(t => q >= t.minQty).pop(); // .pop() gets the last (highest) one
    if (activeTier) {
      activeDiscount = activeTier.discount;
    }

    // Toggle active class for rows
    pricingRows.forEach(t => {
      if (activeTier && t.minQty === activeTier.minQty) {
        t.row.classList.add('active');
      } else {
        t.row.classList.remove('active');
      }
    });

    const subtotalBefore = basePrice * q;
    const discountAmount = subtotalBefore * (activeDiscount / 100);
    const total = subtotalBefore - discountAmount;

    // Update total display
    if (subtotalEl) subtotalEl.textContent = formatter.format(subtotalBefore);
    
    if (activeDiscount > 0) {
      if (discountRow) discountRow.style.display = 'flex';
      if (discountAmountEl) discountAmountEl.textContent = '-' + formatter.format(discountAmount);
    } else {
      if (discountRow) discountRow.style.display = 'none';
      if (discountAmountEl) discountAmountEl.textContent = '-$0.00';
    }
    
    if (totalPriceEl) totalPriceEl.textContent = formatter.format(total);
  }

  // Wire controls
  if (decreaseBtn) decreaseBtn.addEventListener('click', () => {
    qtyInput.value = clampQty(parseInt(qtyInput.value || '1', 10) - 1);
    updateUI();
  });

  if (increaseBtn) increaseBtn.addEventListener('click', () => {
    qtyInput.value = clampQty(parseInt(qtyInput.value || '1', 10) + 1);
    updateUI();
  });

  if (qtyInput) qtyInput.addEventListener('input', () => {
    qtyInput.value = clampQty(qtyInput.value);
    updateUI();
  });

  // Clicking a pricing row sets quantity at least to that tier
  pricingRows.forEach(t => {
    t.row.addEventListener('click', () => {
      const min = Math.max(1, t.minQty || 1);
      const currentQty = clampQty(qtyInput.value);
      if (currentQty < min) {
        qtyInput.value = min;
        updateUI();
      }
    });
  });

  // Initial render
  updateUI();
}