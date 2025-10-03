// ========== Configuration ==========
const CONFIG = {
  productsFile: 'products.json',
  shippingCost: 20,
  defaultImage: './imgs/not-found.jpg'
}

// ========== State Management ==========
let cart = getCartFromStorage()

// ========== DOM Elements (Cached) ==========
const DOM = {
  productContainer: null,
  cartContainer: null,
  cartItemsContainer: null,
  cartCount: null,
  cartSubtotal: null,
  cartTotal: null,
  cartEmpty: null,
  categoriesContainer: null,

  init() {
    this.productContainer = document.getElementById('products')
    this.cartContainer = document.querySelector('.cart-container')
    this.cartItemsContainer = document.querySelector('.cart-items')
    this.cartCount = document.querySelector('.cart-count')
    this.cartSubtotal = document.querySelector('.cart-subtotal')
    this.cartTotal = document.querySelector('.cart-total')
    this.cartEmpty = document.querySelector('.cart-empty')
    this.categoriesContainer = document.querySelector('.categories-container')
  }
}

// ========== Helper Functions ==========
function getCartFromStorage() {
  try {
    return JSON.parse(localStorage.getItem('cart')) || []
  } catch (error) {
    console.error('Error parsing cart from localStorage:', error)
    return []
  }
}

function saveCartToStorage() {
  try {
    localStorage.setItem('cart', JSON.stringify(cart))
  } catch (error) {
    console.error('Error saving cart to localStorage:', error)
  }
}

function updateCartCount() {
  if (DOM.cartCount) {
    DOM.cartCount.textContent = cart.length
  }
}

function toggleEmptyState() {
  if (DOM.cartEmpty) {
    DOM.cartEmpty.style.display = cart.length === 0 ? 'flex' : 'none'
  }
}

function findCartItem(itemId) {
  return cart.find(item => item.id === itemId)
}

function findCartItemIndex(itemId) {
  return cart.findIndex(item => item.id === itemId)
}

function ensureUnitPrice(item) {
  if (!item.unitPrice) {
    item.unitPrice =
      item.quantity === 1 ? item.price : item.price / item.quantity
  }
}

// ========== API Functions ==========
async function fetchProducts(category = 'all') {
  try {
    const response = await fetch(CONFIG.productsFile)
    if (!response.ok) {
      throw new Error('Failed to fetch products')
    }
    const data = await response.json()

    return category === 'all'
      ? data
      : data.filter(item => item.category === category)
  } catch (error) {
    console.error('Error fetching products:', error)
    throw error
  }
}

// ========== Render Functions ==========
function createProductCardHTML(product) {
  const { image, title, description, category, id, price } = product
  const imageSrc = image || CONFIG.defaultImage

  return `
    <div class="product-thumb">
      <img src="${imageSrc}" alt="${title}">
    </div>
    <div class="product-body">
      <h3 class="product-title">${title}</h3>
      <p class="product-desc">${description}</p>
    </div>
    <div class="product-footer">
      <span class="product-category">${category}</span>
      <button class="product-add-btn"
        data-id="${id || ''}"
        data-title="${title}"
        data-price="${price}"
        data-category="${category}"
        data-image="${imageSrc}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        <span class="product-price">$${price}</span>
      </button>
    </div>
  `
}

function createCartItemHTML(product) {
  const { image, title, category, id, price, quantity = 1 } = product

  return `
    <div class="cart-item-image">
      <img src="${image}" alt="${title}">
    </div>
    <div class="cart-item-details">
      <h4 class="cart-item-title">${title}</h4>
      <span class="cart-item-category">${category}</span>
      <div class="cart-item-footer">
        <div class="cart-item-quantity">
          <button class="qty-decrease" data-id="${id}">-</button>
          <span class="qty-value">${quantity}</span>
          <button class="qty-increase" data-id="${id}">+</button>
        </div>
        <span class="cart-item-price">$${Number(price).toFixed(2)}</span>
      </div>
    </div>
    <button class="cart-item-remove" data-id="${id}">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `
}

async function displayProducts(category = 'all') {
  try {
    const products = await fetchProducts(category)

    if (!DOM.productContainer) return

    DOM.productContainer.innerHTML = ''

    products.forEach(product => {
      const productCard = document.createElement('div')
      productCard.classList.add('product-card')
      productCard.innerHTML = createProductCardHTML(product)
      DOM.productContainer.appendChild(productCard)
    })
  } catch (error) {
    console.error('Error displaying products:', error)
    if (DOM.productContainer) {
      DOM.productContainer.innerHTML =
        '<div class="empty">Failed to load products. Please try again later.</div>'
    }
  }
}

function loadCartFromStorage() {
  if (cart.length === 0) return

  toggleEmptyState()

  cart.forEach(product => {
    renderCartItem(product)
  })

  updateCartCount()
  calculateTotal()
}

function renderCartItem(product) {
  if (!DOM.cartItemsContainer) return

  const cartItem = document.createElement('div')
  cartItem.classList.add('cart-item')
  cartItem.dataset.productId = product.id
  cartItem.innerHTML = createCartItemHTML(product)

  DOM.cartItemsContainer.appendChild(cartItem)
}

async function renderCategories() {
  try {
    const products = await fetchProducts()
    const categories = products.map(item => item.category)
    const uniqueCategories = ['All', ...new Set(categories)]

    if (!DOM.categoriesContainer) return

    DOM.categoriesContainer.innerHTML = ''

    uniqueCategories.forEach((category, index) => {
      const categoryButton = document.createElement('button')
      categoryButton.classList.add('category-btn')
      categoryButton.dataset.category = category

      if (index === 0) {
        categoryButton.classList.add('active')
      }

      categoryButton.textContent = category
      DOM.categoriesContainer.appendChild(categoryButton)
    })
  } catch (error) {
    console.error('Error rendering categories:', error)
  }
}

// ========== Cart Logic ==========
function addToCart(productData) {
  const existingItemIndex = findCartItemIndex(productData.id)

  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity++
    updateCartItemDisplay(productData.id, cart[existingItemIndex].quantity)
  } else {
    const newItem = {
      ...productData,
      quantity: 1,
      unitPrice: productData.price
    }
    cart.push(newItem)
    renderCartItem(newItem)
  }

  saveCartToStorage()
  updateCartCount()
  toggleEmptyState()
  openCart()
  calculateTotal()
}

function updateCartItemDisplay(itemId, quantity) {
  const existingCard = document.querySelector(
    `.cart-item[data-product-id="${itemId}"]`
  )
  if (existingCard) {
    const qtyDisplay = existingCard.querySelector('.qty-value')
    if (qtyDisplay) {
      qtyDisplay.textContent = quantity
    }
  }
}

function updateItemQuantity(itemId, delta) {
  const item = findCartItem(itemId)
  if (!item) return

  ensureUnitPrice(item)

  const newQuantity = item.quantity + delta

  if (newQuantity < 1) return

  item.quantity = newQuantity
  item.price = item.unitPrice * item.quantity

  saveCartToStorage()
  calculateTotal()

  return item
}

function removeFromCart(itemId) {
  const itemIndex = findCartItemIndex(itemId)

  if (itemIndex > -1) {
    cart.splice(itemIndex, 1)
    saveCartToStorage()
  }

  const itemElement = document.querySelector(
    `.cart-item[data-product-id="${itemId}"]`
  )
  if (itemElement) {
    itemElement.remove()
  }

  updateCartCount()
  calculateTotal()
  toggleEmptyState()
}

function calculateTotal() {
  const subtotal = cart.reduce((total, item) => {
    const itemPrice = item.unitPrice || item.price
    return total + itemPrice * item.quantity
  }, 0)

  const total = subtotal + CONFIG.shippingCost

  if (DOM.cartSubtotal) {
    DOM.cartSubtotal.textContent = `$${subtotal.toFixed(2)}`
  }
  if (DOM.cartTotal) {
    DOM.cartTotal.textContent = `$${total.toFixed(2)}`
  }
}

function openCart() {
  if (DOM.cartContainer) {
    DOM.cartContainer.classList.add('active')
  }
}

function closeCart() {
  if (DOM.cartContainer) {
    DOM.cartContainer.classList.remove('active')
  }
}

function filterByCategory(category) {
  const targetCategory = category.toLowerCase() === 'all' ? 'all' : category
  displayProducts(targetCategory)
}

// ========== Event Handlers ==========
function handleAddToCart(event) {
  const button = event.target.closest('.product-add-btn')
  if (!button) return

  const productData = {
    id: button.dataset.id,
    title: button.dataset.title,
    price: Number(button.dataset.price),
    category: button.dataset.category,
    image: button.dataset.image
  }

  addToCart(productData)
}

function handleQuantityChange(event) {
  const increaseBtn = event.target.closest('.qty-increase')
  const decreaseBtn = event.target.closest('.qty-decrease')

  if (increaseBtn) {
    const itemId = increaseBtn.dataset.id
    const item = updateItemQuantity(itemId, 1)

    if (item) {
      const qtyDisplay = increaseBtn.previousElementSibling
      const priceDisplay = increaseBtn.parentElement.nextElementSibling

      if (qtyDisplay) qtyDisplay.textContent = item.quantity
      if (priceDisplay) priceDisplay.textContent = `$${item.price.toFixed(2)}`
    }
  } else if (decreaseBtn) {
    const itemId = decreaseBtn.dataset.id
    const item = updateItemQuantity(itemId, -1)

    if (item) {
      const qtyDisplay = decreaseBtn.nextElementSibling
      const priceDisplay = decreaseBtn.parentElement.nextElementSibling

      if (qtyDisplay) qtyDisplay.textContent = item.quantity
      if (priceDisplay) priceDisplay.textContent = `$${item.price.toFixed(2)}`
    }
  }
}

function handleRemoveFromCart(event) {
  const button = event.target.closest('.cart-item-remove')
  if (!button) return

  const itemId = button.dataset.id
  removeFromCart(itemId)
}

function handleCategoryClick(event) {
  const button = event.target.closest('.category-btn')
  if (!button) return

  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.classList.remove('active')
  })

  button.classList.add('active')
  filterByCategory(button.dataset.category)
}

function handleCheckout() {
  if (cart.length === 0) {
    alert('Your cart is empty!')
    return
  }

  // Calculate total
  const subtotal = cart.reduce((total, item) => {
    const itemPrice = item.unitPrice || item.price
    return total + itemPrice * item.quantity
  }, 0)
  const total = subtotal + CONFIG.shippingCost

  // Generate order number
  const orderNumber =
    '#' + Math.random().toString(36).substr(2, 9).toUpperCase()

  // Save order data to localStorage
  const orderData = {
    orderNumber: orderNumber,
    items: cart.length,
    total: `$${total.toFixed(2)}`
  }
  localStorage.setItem('lastOrder', JSON.stringify(orderData))

  // Clear cart
  cart = []
  saveCartToStorage()

  // Redirect to success page
  window.location.href = 'checkout-success.html'
}

// ========== Event Listeners Setup ==========
function setupEventListeners() {
  const cartToggle = document.querySelector('.cart-toggle')
  const cartClose = document.querySelector('.cart-close')
  const cartOverlay = document.querySelector('.cart-overlay')
  const checkoutBtn = document.querySelector('.cart-checkout')

  if (cartToggle) {
    cartToggle.addEventListener('click', openCart)
  }

  if (cartClose) {
    cartClose.addEventListener('click', closeCart)
  }

  if (cartOverlay) {
    cartOverlay.addEventListener('click', closeCart)
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', handleCheckout)
  }

  document.addEventListener('click', handleAddToCart)

  if (DOM.cartItemsContainer) {
    DOM.cartItemsContainer.addEventListener('click', handleQuantityChange)
    DOM.cartItemsContainer.addEventListener('click', handleRemoveFromCart)
  }

  if (DOM.categoriesContainer) {
    DOM.categoriesContainer.addEventListener('click', handleCategoryClick)
  }
}

// ========== App Initialization ==========
async function initApp() {
  DOM.init()
  setupEventListeners()
  await displayProducts()
  loadCartFromStorage()
  await renderCategories()
  updateCartCount()
}

// ========== Start App ==========
document.addEventListener('DOMContentLoaded', initApp)
