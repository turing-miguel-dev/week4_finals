document.addEventListener("DOMContentLoaded", function () {

  const CART_KEY = "dealsDoughHubCart";

  // GET CART DATA
  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (error) {
      return [];
    }
  }

  // SAVE CART DATA
  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
  }

  // FORMAT MONEY
  function money(value) {
    return "₱" + Number(value).toFixed(2);
  }

  // UPDATE CART COUNTER

  function updateCartCount() {

    const cart = getCart();

    const count = cart.reduce(function (total, item) {
      return total + item.quantity;
    }, 0);

    document.querySelectorAll("[data-cart-count]").forEach(function (element) {
      element.textContent = count;
    });

    document.querySelectorAll("[data-cart-dot]").forEach(function (dot) {
      dot.classList.toggle("active", count > 0);
    });

  }


  // SHOW NOTIFICATION
  let toastTimer;

  function showToast(message) {
    const toast = document.getElementById("toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(function () {
      toast.classList.remove("show");
    }, 2500);
  }

  // ADD ITEMS TO CART
  document.addEventListener("click", function (event) {

    const button = event.target.closest(".add-to-cart");

    if (!button) return;

    const id = button.dataset.id;
    const name = button.dataset.name;
    const price = Number(button.dataset.price);

    if (!id || !name || !Number.isFinite(price) || price < 0) {
      showToast("Unable to add this item.");
      return;
    }

    const cart = getCart();

    const existingItem = cart.find(function (item) {
      return item.id === id;
    });

    if (existingItem) {
      existingItem.quantity++;
    } else {
      cart.push({
        id: id,
        name: name,
        price: price,
        quantity: 1
      });
    }

    saveCart(cart);

    const originalText = button.textContent;

    button.textContent = "Added ✓";
    button.classList.add("added");

    showToast("✓ " + name + " added to your cart!");

    setTimeout(function () {
      button.textContent = originalText;
      button.classList.remove("added");
    }, 1200);

  });

  // RENDER CART
  function renderCart() {

    const container = document.getElementById("cart-items");

    if (!container) return;

    const cart = getCart();
    const totalElement = document.getElementById("cart-total");

    container.innerHTML = "";

    if (cart.length === 0) {

      container.innerHTML = `
        <div class="empty-cart">
          <h2>Your cart is empty!</h2>
          <p>You haven't added any delicious items yet.</p>
          <a class="btn" href="orders.html">Browse Our Menu →</a>
        </div>
      `;

      if (totalElement) {
        totalElement.textContent = money(0);
      }

      return;
    }

    let total = 0;

    cart.forEach(function (item) {

      const lineTotal = item.price * item.quantity;
      total += lineTotal;

      const row = document.createElement("article");
      row.className = "cart-row";

      const details = document.createElement("div");

      const name = document.createElement("h3");
      name.textContent = item.name;

      const price = document.createElement("p");
      price.textContent = money(item.price) + " each";

      details.append(name, price);

      // QUANTITY CONTROLS
      const controls = document.createElement("div");
      controls.className = "quantity-controls";

      const minus = document.createElement("button");
      minus.type = "button";
      minus.textContent = "−";
      minus.setAttribute("aria-label", "Decrease quantity");

      minus.addEventListener("click", function () {
        changeQuantity(item.id, -1);
      });

      const quantity = document.createElement("span");
      quantity.textContent = item.quantity;

      const plus = document.createElement("button");
      plus.type = "button";
      plus.textContent = "+";
      plus.setAttribute("aria-label", "Increase quantity");

      plus.addEventListener("click", function () {
        changeQuantity(item.id, 1);
      });

      controls.append(minus, quantity, plus);

      // ITEM TOTAL
      const line = document.createElement("strong");
      line.className = "line-total";
      line.textContent = money(lineTotal);

      // REMOVE ITEM
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "remove-item";
      remove.textContent = "Remove";

      remove.addEventListener("click", function () {

        const updatedCart = getCart().filter(function (cartItem) {
          return cartItem.id !== item.id;
        });

        saveCart(updatedCart);
        renderCart();

        showToast(item.name + " removed from your cart.");

      });

      row.append(details, controls, line, remove);
      container.append(row);

    });

    if (totalElement) {
      totalElement.textContent = money(total);
    }
  }

  // CHANGE QUANTITY
  function changeQuantity(id, amount) {

    const cart = getCart();

    const item = cart.find(function (entry) {
      return entry.id === id;
    });

    if (!item) return;

    item.quantity += amount;

    const updatedCart = cart.filter(function (entry) {
      return entry.quantity > 0;
    });

    saveCart(updatedCart);
    renderCart();

    showToast("Cart updated successfully!");

  }

  // CLEAR CART
  const clearButton = document.getElementById("clear-cart");

  if (clearButton) {

    clearButton.addEventListener("click", function () {

      if (getCart().length === 0) {
        showToast("Your cart is already empty.");
        return;
      }

      if (confirm("Are you sure you want to clear your cart?")) {
        saveCart([]);
        renderCart();
        showToast("Your cart has been cleared.");
      }

    });

  }

  // CHECKOUT
  const checkoutForm = document.getElementById("checkout-form");

  if (checkoutForm) {

    checkoutForm.addEventListener("submit", function (event) {

      event.preventDefault();

      const cart = getCart();

      if (cart.length === 0) {
        alert("Your cart is empty! Please add items before checking out.");
        return;
      }

      const form = new FormData(checkoutForm);

      const customerName = form.get("customerName");
      const phone = form.get("phone");
      const address = form.get("address");
      const method = form.get("method");
      const notes = form.get("notes");

      if (method === "Delivery" && !address.trim()) {
        alert("Please enter your delivery address.");
        return;
      }

      const total = cart.reduce(function (sum, item) {
        return sum + item.price * item.quantity;
      }, 0);

      const itemLines = cart.map(function (item) {
        return (
          item.name +
          " x " +
          item.quantity +
          " = " +
          money(item.price * item.quantity)
        );
      }).join("\n");

      const message = [
        "NEW ORDER - DEALS DOUGH HUB PIZZA HOUSE",
        "",
        "ORDER DETAILS:",
        itemLines,
        "",
        "TOTAL: " + money(total),
        "",
        "CUSTOMER INFORMATION:",
        "Name: " + customerName,
        "Phone: " + phone,
        "Address: " + (address || "Not provided"),
        "Method: " + method,
        "Notes: " + (notes || "None")
      ].join("\n");

      const subject = encodeURIComponent(
        "Pizza Order - Deals Dough Hub"
      );

      const body = encodeURIComponent(message);

      const emailLink =
        "mailto:orders@dealsdoughhub.example?subject=" +
        subject +
        "&body=" +
        body;

      window.location.href = emailLink;

      showToast("Your order is ready in your email app!");

    });

  }

  // AUTOMATIC IMAGE SLIDESHOW
  const slider = document.getElementById("slider");

  if (slider) {

    const slides = Array.from(
      slider.querySelectorAll(".slide")
    );

    const dotsContainer = document.getElementById("dots");

    if (slides.length > 0 && dotsContainer) {

      let current = 0;

      slides.forEach(function (slide, index) {

        const dot = document.createElement("button");

        dot.type = "button";
        dot.className = "dot";

        if (index === 0) {
          dot.classList.add("is-active");
        }

        dot.setAttribute("aria-label", "Show slide " + (index + 1));

        dot.addEventListener("click", function () {
          showSlide(index);
        });

        dotsContainer.append(dot);

      });

      const dots = Array.from(dotsContainer.children);

      function showSlide(index) {

        slides[current].classList.remove("is-active");
        dots[current].classList.remove("is-active");

        current = index;

        slides[current].classList.add("is-active");
        dots[current].classList.add("is-active");

      }

      if (slides.length > 1) {

        setInterval(function () {
          showSlide((current + 1) % slides.length);
        }, 3500);

      }

    }

  }

  // INITIALIZE WEBSITE
  updateCartCount();
  renderCart();

}); function updateCartCount() {
    const cart = getCart();

    const count = cart.reduce(function(total, item) {
        return total + item.quantity;
    }, 0);

    document.querySelectorAll("[data-cart-count]").forEach(function(element) {
        element.textContent = count;
    });

    document.querySelectorAll("[data-cart-dot]").forEach(function(dot) {
        dot.classList.toggle("active", count > 0);
    });
}
