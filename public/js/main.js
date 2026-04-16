// INDIAN WEB - Main JavaScript

// Update cart count globally
function updateCartCount() {
    fetch('/api/cart-count')
        .then(res => res.json())
        .then(data => {
            const cartBadges = document.querySelectorAll('#cartCount');
            cartBadges.forEach(badge => {
                if (badge) badge.innerText = data.count || 0;
            });
        })
        .catch(() => {});
}

// Add to cart function
function addToCart(softwareId, name, price) {
    fetch('/add-to-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ softwareId, name, price })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            updateCartCount();
            showToast('✅ ' + name + ' added to cart!', 'success');
        }
    })
    .catch(() => showToast('Failed to add to cart', 'error'));
}

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white z-50 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} animate-bounce`;
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Initialize AOS if available
if (typeof AOS !== 'undefined') {
    AOS.init({ duration: 1000, once: true });
}

// Load cart count on page load
document.addEventListener('DOMContentLoaded', updateCartCount);