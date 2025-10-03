// ========== Fetch Products from JSON ==========
const fetchProducts = async (category = 'all') => {
  try {
    const response = await fetch('products.json')
    if (!response.ok) {
      throw new Error('Failed to fetch products')
    }
    const data = await response.json()

    if (category === 'all') {
      return data
    } else {
      const filteredCategory = data.filter(item => item.category === category)

      return filteredCategory
    }
  } catch (error) {
    console.error('Error fetching products:', error)
    throw error
  }
}
let cart = JSON.parse(localStorage.getItem('cart')) || []
const cartCount = document.querySelector('.cart-count')

// ========== Display Products in Grid ==========
const displayProducts = async (category = 'all') => {
  cartCount.textContent = JSON.parse(localStorage.getItem('cart'))?.length || 0

  try {
    const products = await fetchProducts(category)
    const productContainer = document.getElementById('products')

    // Clear container before adding products
    productContainer.innerHTML = ''

    // Loop through each product and create card
    products.forEach(product => {
      const productCard = document.createElement('div')
      productCard.classList.add('product-card')

      // Build product card HTML structure
      productCard.innerHTML = `
        <div class="product-thumb">
          <img src="${product.image || './imgs/not-found.jpg'}" alt="${
        product.title
      }">
        </div>
        <div class="product-body">
          <h3 class="product-title">${product.title}</h3>
          <p class="product-desc">${product.description}</p>
        </div>
        <div class="product-footer">
          <span class="product-category">${product.category}</span>
          <button class="product-add-btn" data-id="${
            product.id || ''
          }" data-title="${product.title}" data-price="${
        product.price
      }" data-category="${product.category}" data-image="${
        product.image || './imgs/not-found.jpg'
      }">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          <span class="product-price">${product.price}</span>
          </button>
        </div>
      `

      // Append card to container
      productContainer.appendChild(productCard)
    })
  } catch (error) {
    console.error('Error displaying products:', error)
    const productContainer = document.getElementById('products')
    productContainer.innerHTML =
      '<div class="empty">Failed to load products. Please try again later.</div>'
  }
}

// ========== Initialize App ==========
addEventListener('DOMContentLoaded', () => {
  displayProducts()
  loadCartFromStorage()
  calculateTotal()
  renderCategories()
})

// ========== Cart Functionality (Add your logic here) ==========

//  Implement cart toggle functionality => Toggle cart open/closed by adding/removing 'active' class
addEventListener('DOMContentLoaded', () => {
  const cartContainer = document.querySelector('.cart-container')
  const cartToggle = document.querySelector('.cart-toggle')
  const cartClose = document.querySelector('.cart-close')
  const cartOverlay = document.querySelector('.cart-overlay')

  // TODO:
  //
  if (cartToggle) {
    cartToggle.addEventListener('click', () => {
      cartContainer.classList.add('active')
    })
  }

  if (cartClose) {
    cartClose.addEventListener('click', () => {
      cartContainer.classList.remove('active')
    })
  }

  if (cartOverlay) {
    cartOverlay.addEventListener('click', () => {
      cartContainer.classList.remove('active')
    })
  }
})

//Implement add to cart functionality
addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', e => {
    if (e.target.closest('.product-add-btn')) {
      const button = e.target.closest('.product-add-btn')
      const productData = {
        id: button.dataset.id,
        title: button.dataset.title,
        price: Number(button.dataset.price).toFixed(1),
        category: button.dataset.category,
        image: button.dataset.image
      }

      // TODO: Add your cart logic here

      createAndSaveItem(productData)
      // TODO: Update cart count badge
      cartCount.textContent =
        JSON.parse(localStorage.getItem('cart'))?.length || 0

      // TODO: Calculate and update cart totals
    }
  })
})

// ========== Helper Function: Create and Save Cart Item ==========
function createAndSaveItem(product) {
  // Step 2: Check if product already exists in cart
  const existingItemIndex = cart.findIndex(item => item.id === product.id)

  if (existingItemIndex > -1) {
    // Product exists, increase quantity
    cart[existingItemIndex].quantity =
      (cart[existingItemIndex].quantity || 1) + 1
  } else {
    // Product doesn't exist, add it with quantity 1 and store original unit price
    cart.push({ ...product, quantity: 1, unitPrice: product.price })
  }

  // Step 3: Save updated cart to localStorage
  localStorage.setItem('cart', JSON.stringify(cart))

  // Step 4: Get the cart items container
  const cartItemsContainer = document.querySelector('.cart-items')

  // Step 5: Hide the empty state message
  const emptyState = document.querySelector('.cart-empty')
  if (emptyState) emptyState.style.display = 'none'

  // Step 6: Check if this product card already exists in the display
  const existingCard = document.querySelector(
    `.cart-item[data-product-id="${product.id}"]`
  )

  if (existingCard) {
    // Update the quantity display in existing card
    const qtyDisplay = existingCard.querySelector('.qty-value')
    if (qtyDisplay) {
      qtyDisplay.textContent = cart[existingItemIndex].quantity
    }
  } else {
    // Create new cart item card
    const cartItem = document.createElement('div')
    cartItem.classList.add('cart-item')
    cartItem.dataset.productId = product.id

    cartItem.innerHTML = renderCartItem(product)

    // Add to cart display
    cartItemsContainer.appendChild(cartItem)
  }

  // Step 7: Open the cart panel
  const cartContainer = document.querySelector('.cart-container')
  if (cartContainer) cartContainer.classList.add('active')

  calculateTotal()
}
function renderCartItem(product) {
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
        <span class="cart-item-price">${price}</span>
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

// ========== Load Cart from localStorage on Page Load ==========
// This function reads the cart from localStorage and displays all items
function loadCartFromStorage() {
  // Step 2: If cart is empty, show empty state
  if (cart.length === 0) {
    return
  }

  // Step 3: Get cart items container
  const cartItemsContainer = document.querySelector('.cart-items')
  const emptyState = document.querySelector('.cart-empty')

  // Step 4: Hide empty state
  if (emptyState) emptyState.style.display = 'none'

  // Step 5: Loop through each item and create card
  cart.forEach(product => {
    const cartItem = document.createElement('div')
    cartItem.classList.add('cart-item')
    cartItem.dataset.productId = product.id

    cartItem.innerHTML = renderCartItem(product)
    // Add to cart display
    cartItemsContainer.appendChild(cartItem)
  })

  // Step 6: Update cart count badge
  const cartCount = document.querySelector('.cart-count')
  if (cartCount) cartCount.textContent = cart.length

  calculateTotal()
}

// plus and minus item on cart logic - Using event delegation

addEventListener('DOMContentLoaded', () => {
  const cartItemsContainer = document.querySelector('.cart-items')

  cartItemsContainer.addEventListener('click', e => {
    // Check if increase button was clicked
    if (e.target.classList.contains('qty-increase')) {
      const clickedItemId = e.target.dataset.id
      const item = cart.find(card => card.id === clickedItemId)
      if (item) {
        // Store unitPrice if not already stored (for old items)
        if (!item.unitPrice) {
          item.unitPrice =
            item.quantity === 1 ? item.price : item.price / item.quantity
        }

        item.quantity = item.quantity + 1
        item.price = item.unitPrice * item.quantity

        const priceDisplay = e.target.parentElement.nextElementSibling
        priceDisplay.textContent = item.price.toFixed(1)
        localStorage.setItem('cart', JSON.stringify(cart))

        // Update only the quantity display
        const qtyDisplay = e.target.previousElementSibling
        qtyDisplay.textContent = item.quantity

        calculateTotal()
      }
    }

    // Check if decrease button was clicked
    if (e.target.classList.contains('qty-decrease')) {
      const clickedItemId = e.target.dataset.id
      const item = cart.find(card => card.id === clickedItemId)
      if (item && item.quantity > 1) {
        // Store unitPrice if not already stored (for old items)
        if (!item.unitPrice) {
          item.unitPrice = item.price / item.quantity
        }

        item.quantity = item.quantity - 1
        item.price = item.unitPrice * item.quantity

        const priceDisplay = e.target.parentElement.nextElementSibling
        priceDisplay.textContent = item.price.toFixed(1)
        localStorage.setItem('cart', JSON.stringify(cart))

        // Update only the quantity display
        const qtyDisplay = e.target.nextElementSibling
        qtyDisplay.textContent = item.quantity
        calculateTotal()
      }
    }
  })
})

// TODO: Implement remove from cart functionality
// Add click listeners to remove buttons

addEventListener('DOMContentLoaded', () => {
  const cartItemsContainer = document.querySelector('.cart-items')

  cartItemsContainer.addEventListener('click', e => {
    if (e.target.closest('.cart-item-remove')) {
      const button = e.target.closest('.cart-item-remove')
      const itemId = button.dataset.id

      const itemIndex = cart.findIndex(item => item.id === itemId)

      if (itemIndex > -1) {
        cart.splice(itemIndex, 1)
        localStorage.setItem('cart', JSON.stringify(cart))
      }

      const itemContainer = button.closest('.cart-item')
      itemContainer.remove()
      calculateTotal()
      document.querySelector('.cart-count').textContent = cart.length
      if (cart.length === 0) {
        document.querySelector('.cart-empty').style.display = 'flex'
      }
    }
  })
})

// Implement cart total calculation

function calculateTotal() {
  const totalPrice = cart.reduce((acc, item) => {
    if (item.quantity > 1) {
      return acc + Number(item.unitPrice) * Number(item.quantity)
    } else {
      return acc + Number(item.price)
    }
  }, 0)
  const shipping = 20
  document.querySelector('.cart-subtotal').textContent = `$${totalPrice}`
  document.querySelector('.cart-total').textContent = `$${
    totalPrice + shipping
  }`
}

// filter by category

async function renderCategories() {
  const products = await fetchProducts()

  const duplicatedCategories = products.map(item => item.category)
  const uniqueCategories = ['All', ...new Set(duplicatedCategories)]

  const categoriesContainer = document.querySelector('.categories-container')
  categoriesContainer.innerHTML = ''

  uniqueCategories.forEach(category => {
    const categoryButton = document.createElement('button')
    categoryButton.classList.add('category-btn')
    categoryButton.dataset.category = category
    categoryButton.textContent = category
    if (categoryButton.textContent.toLowerCase() === 'all') {
      categoryButton.classList.add('active')
    }

    categoriesContainer.appendChild(categoryButton)

    categoryButton.addEventListener('click', e => {
      document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active')
      })
      e.target.classList.add('active')
      filterByCategory(category)
    })
  })
}

function filterByCategory(category) {
  if (category.toLowerCase() === 'all') {
    displayProducts()
  } else {
    displayProducts(category)
  }
}
