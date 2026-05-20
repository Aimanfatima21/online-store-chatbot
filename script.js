const defaultProducts = [
  {
    name: "lawn suit",
    price: "Rs. 3,500",
    sizes: "Small, Medium, Large",
    colors: "Pink, Black, Blue",
    stock: "Available",
    category: "Women Clothing",
    image: "images/lawn.jpg"
  },
  {
    name: "kurti",
    price: "Rs. 1,800",
    sizes: "Small, Medium, Large",
    colors: "White, Green, Black",
    stock: "Available",
    category: "Casual Wear",
    image: "images/kurti.jpg"
  },
  {
    name: "abaya",
    price: "Rs. 4,000",
    sizes: "Medium, Large, XL",
    colors: "Black, Navy Blue",
    stock: "Available",
    category: "Modest Wear",
    image: "images/abaya.jpg"
  }
];

let products = JSON.parse(localStorage.getItem("products")) || defaultProducts;
let orders = JSON.parse(localStorage.getItem("orders")) || [];

const storeWhatsAppNumber = "923015628548";

let orderMode = false;
let orderStep = 0;
let uploadedImage = "";
let selectedOrderProduct = "";

let orderData = {
  name: "",
  phone: "",
  city: "",
  product: "",
  size: "",
  color: ""
};

function sendMessage() {
  const input = document.getElementById("userInput");
  if (!input) return;

  const userText = input.value.trim();
  if (userText === "") return;

  addMessage(userText, "user-message");
  input.value = "";

  setTimeout(() => {
    const reply = getBotReply(userText);

    if (reply && reply.type === "orderComplete") {
      addMessage(reply.text, "bot-message");
      addWhatsAppButton(reply.whatsappText);
    } else if (reply && reply.type === "productCard") {
      addProductCard(reply.product);
    } else if (reply && reply.type === "allProducts") {
      addMessage("Here are our available products:", "bot-message");
      showAllProductCards();
    } else if (reply && reply.type === "categoryProducts") {
      showCategoryProducts(reply.category);
    } else if (reply && reply.type === "matchedProducts") {
      addMessage("Here are matching products:", "bot-message");
      reply.products.forEach(product => addProductCard(product));
    } else {
      addMessage(reply, "bot-message");
    }
  }, 500);
}

function addMessage(text, className) {
  const chatBody = document.getElementById("chatBody");
  if (!chatBody) return;

  const message = document.createElement("div");
  message.className = `message ${className}`;
  message.innerText = text;

  chatBody.appendChild(message);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function addProductCard(product) {
  const chatBody = document.getElementById("chatBody");
  if (!chatBody) return;

  const card = document.createElement("div");
  card.className = "product-card";

  let buttonHTML = "";

  if (product.stock.toLowerCase().includes("out")) {
    buttonHTML = `<button class="out-stock-btn" disabled>Out of Stock</button>`;
  } else {
    buttonHTML = `<button onclick='startOrderForProduct(${JSON.stringify(product.name)})'>Order Now</button>`;
  }

  card.innerHTML = `
    <img src="${product.image}" alt="${product.name}">
    <h3>${product.name}</h3>
    <p class="category">${product.category}</p>
    <p><strong>Price:</strong> ${product.price}</p>
    <p><strong>Sizes:</strong> ${product.sizes}</p>
    <p><strong>Colors:</strong> ${product.colors}</p>
    <p><strong>Status:</strong> ${product.stock}</p>
    ${buttonHTML}
  `;

  chatBody.appendChild(card);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function showAllProductCards() {
  products.forEach(product => addProductCard(product));
}

function showCategoryProducts(categoryName) {
  const matchedProducts = products.filter(product =>
    product.category.toLowerCase().includes(categoryName.toLowerCase())
  );

  if (matchedProducts.length === 0) {
    addMessage(`Sorry, ${categoryName} is not available right now.`, "bot-message");
    return;
  }

  addMessage(`Here are products in ${categoryName}:`, "bot-message");
  matchedProducts.forEach(product => addProductCard(product));
}

function searchBySizeOrColor(message) {
  const matchedProducts = products.filter(product => {
    return (
      product.sizes.toLowerCase().split(",").some(size => message.includes(size.trim().toLowerCase())) ||
      product.colors.toLowerCase().split(",").some(color => message.includes(color.trim().toLowerCase()))
    );
  });

  if (matchedProducts.length === 0) {
    return "Sorry, no matching product found. Please click Products to see available items.";
  }

  return {
    type: "matchedProducts",
    products: matchedProducts
  };
}

function addWhatsAppButton(orderText) {
  const chatBody = document.getElementById("chatBody");
  if (!chatBody) return;

  const button = document.createElement("button");
  button.className = "whatsapp-button";
  button.innerText = "Send Order on WhatsApp";

  const encodedMessage = encodeURIComponent(orderText);
  const whatsappLink = `https://wa.me/${storeWhatsAppNumber}?text=${encodedMessage}`;

  button.onclick = function () {
    window.open(whatsappLink, "_blank");
  };

  chatBody.appendChild(button);
  chatBody.scrollTop = chatBody.scrollHeight;
}

const userInput = document.getElementById("userInput");

if (userInput) {
  userInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      sendMessage();
    }
  });
}

function quickReply(text) {
  const input = document.getElementById("userInput");
  if (!input) return;

  input.value = text;
  sendMessage();
}

function startOrderForProduct(productName) {
  const selectedProduct = products.find(product =>
    product.name.toLowerCase() === productName.toLowerCase()
  );

  addMessage(`I want to order ${productName}`, "user-message");

  if (selectedProduct && selectedProduct.stock.toLowerCase().includes("out")) {
    setTimeout(() => {
      addMessage(`Sorry, ${productName} is currently out of stock.`, "bot-message");
    }, 500);
    return;
  }

  selectedOrderProduct = productName;
  orderData.product = productName;
  orderMode = true;
  orderStep = 1;

  setTimeout(() => {
    addMessage(`Sure! You selected ${productName}. Please tell me your name. Type cancel to stop order.`, "bot-message");
  }, 500);
}

function getBotReply(message) {
  message = message.toLowerCase();

  if (orderMode) {
    if (
      message.includes("cancel") ||
      message.includes("stop") ||
      message.includes("exit") ||
      message.includes("back")
    ) {
      resetOrder();
      return "Order process cancelled. You can now ask about products, price, delivery, COD, return, or start a new order.";
    }

    return collectOrderDetails(message);
  }

  if (
    message.includes("hello") ||
    message.includes("hi") ||
    message.includes("hey") ||
    message.includes("salam") ||
    message.includes("assalam") ||
    message.includes("aoa")
  ) {
    return "Hello! Welcome to Style Store. How can I help you today?";
  }

  for (let product of products) {
    if (message.includes(product.name.toLowerCase())) {
      return {
        type: "productCard",
        product: product
      };
    }
  }

  const categoryKeywords = [
    "casual wear",
    "casual waer",
    "women clothing",
    "modest wear",
    "party wear",
    "kids wear",
    "abaya collection",
    "western wear",
    "formal wear",
    "bridal wear",
    "summer collection",
    "fancy",
    "fancy wear"
  ];

  for (let category of categoryKeywords) {
    if (message.includes(category)) {
      const matchedProducts = products.filter(product =>
        product.category.toLowerCase().includes(category)
      );

      if (matchedProducts.length > 0) {
        return {
          type: "categoryProducts",
          category: category
        };
      } else {
        return `Sorry, ${category} is not available right now. Please click Products to see available items.`;
      }
    }
  }

  if (
    message.includes("products") ||
    message.includes("items") ||
    message.includes("collection") ||
    message.includes("available") ||
    message.includes("kya hai") ||
    message.includes("kya kya")
  ) {
    return {
      type: "allProducts"
    };
  }

  if (
    message.includes("price") ||
    message.includes("rate") ||
    message.includes("cost") ||
    message.includes("amount") ||
    message.includes("kitny ka") ||
    message.includes("kitne ka") ||
    message.includes("qeemat")
  ) {
    return "Please tell me the product name to check price.";
  }

  if (
    message.includes("delivery") ||
    message.includes("deliver") ||
    message.includes("parcel") ||
    message.includes("shipping") ||
    message.includes("kab tak") ||
    message.includes("kitny din") ||
    message.includes("kitne din")
  ) {
    return "Our delivery time is 3 to 5 working days.";
  }

  if (
    message.includes("charges") ||
    message.includes("delivery fee") ||
    message.includes("shipping fee")
  ) {
    return "Delivery charges are Rs. 250 nationwide.";
  }

  if (
    message.includes("cod") ||
    message.includes("cash") ||
    message.includes("payment") ||
    message.includes("pay") ||
    message.includes("cash on delivery") ||
    message.includes("jazzcash") ||
    message.includes("easypaisa")
  ) {
    return "Yes, Cash on Delivery is available. We also accept JazzCash and Easypaisa.";
  }

  if (
    message.includes("return") ||
    message.includes("exchange") ||
    message.includes("replace") ||
    message.includes("wapis") ||
    message.includes("change")
  ) {
    return "Exchange is available within 7 days. Product must be unused and in original condition.";
  }

  if (
    message.includes("black") ||
    message.includes("pink") ||
    message.includes("blue") ||
    message.includes("white") ||
    message.includes("green") ||
    message.includes("small") ||
    message.includes("medium") ||
    message.includes("large") ||
    message.includes("xl")
  ) {
    return searchBySizeOrColor(message);
  }

  if (
    message.includes("order") ||
    message.includes("buy") ||
    message.includes("purchase") ||
    message.includes("book") ||
    message.includes("lena") ||
    message.includes("mangwana")
  ) {
    const selectedProduct = products.find(product =>
      message.includes(product.name.toLowerCase())
    );

    if (selectedProduct && selectedProduct.stock.toLowerCase().includes("out")) {
      return `Sorry, ${selectedProduct.name} is currently out of stock.`;
    }

    if (selectedProduct) {
      selectedOrderProduct = selectedProduct.name;
      orderData.product = selectedProduct.name;
    }

    orderMode = true;
    orderStep = 1;

    if (selectedOrderProduct) {
      return `Sure! You selected ${selectedOrderProduct}. Please tell me your name. Type cancel to stop order.`;
    }

    return "Sure! Please tell me your name. Type cancel to stop order.";
  }

  if (
    message.includes("thanks") ||
    message.includes("thank you") ||
    message.includes("shukriya")
  ) {
    return "You're welcome! Let me know if you need help with product, price, delivery, or order.";
  }

  return "Sorry, this item/category is not available right now. Please click Products to see available items.";
}

function collectOrderDetails(message) {
  if (orderStep === 1) {
    orderData.name = message;
    orderStep = 2;
    return "Thank you. Please enter your phone number.";
  }

  if (orderStep === 2) {
    const phonePattern = /^[0-9]{10,13}$/;

    if (!phonePattern.test(message)) {
      return "Please enter a valid phone number. Example: 03001234567";
    }

    orderData.phone = message;
    orderStep = 3;
    return "Please enter your city.";
  }

  if (orderStep === 3) {
    orderData.city = message;

    if (selectedOrderProduct) {
      orderStep = 5;
      return `Product selected: ${selectedOrderProduct}. Please enter your size.`;
    }

    orderStep = 4;
    return "Which product do you want to order?";
  }

  if (orderStep === 4) {
    const selectedProduct = products.find(product =>
      message.includes(product.name.toLowerCase())
    );

    if (!selectedProduct) {
      return "Sorry, this product is not available. Please type an available product name.";
    }

    if (selectedProduct.stock.toLowerCase().includes("out")) {
      return `Sorry, ${selectedProduct.name} is currently out of stock. Please choose another product.`;
    }

    orderData.product = selectedProduct.name;
    selectedOrderProduct = selectedProduct.name;
    orderStep = 5;
    return "Please enter your size.";
  }

  if (orderStep === 5) {
    const selectedProduct = products.find(product =>
      product.name.toLowerCase() === selectedOrderProduct.toLowerCase()
    );

    if (selectedProduct) {
      const availableSizes = selectedProduct.sizes.toLowerCase();

      if (!availableSizes.includes(message.toLowerCase())) {
        return `Sorry, this size is not available. Available sizes: ${selectedProduct.sizes}`;
      }
    }

    orderData.size = message;
    orderStep = 6;
    return "Please enter your color choice.";
  }

  if (orderStep === 6) {
    const selectedProduct = products.find(product =>
      product.name.toLowerCase() === selectedOrderProduct.toLowerCase()
    );

    if (selectedProduct) {
      const availableColors = selectedProduct.colors.toLowerCase();

      if (!availableColors.includes(message.toLowerCase())) {
        return `Sorry, this color is not available. Available colors: ${selectedProduct.colors}`;
      }
    }

    orderData.color = message;

    const completedOrder = {
      name: orderData.name,
      phone: orderData.phone,
      city: orderData.city,
      product: orderData.product,
      size: orderData.size,
      color: orderData.color,
      date: new Date().toLocaleString()
    };

    saveOrder(completedOrder);

    const orderSummary = `Order received successfully!

Name: ${completedOrder.name}
Phone: ${completedOrder.phone}
City: ${completedOrder.city}
Product: ${completedOrder.product}
Size: ${completedOrder.size}
Color: ${completedOrder.color}

Our team will contact you shortly for confirmation.`;

    const whatsappText = `New Order Details:

Name: ${completedOrder.name}
Phone: ${completedOrder.phone}
City: ${completedOrder.city}
Product: ${completedOrder.product}
Size: ${completedOrder.size}
Color: ${completedOrder.color}`;

    resetOrder();

    return {
      type: "orderComplete",
      text: orderSummary,
      whatsappText: whatsappText
    };
  }
}

function saveOrder(order) {
  orders.push(order);
  localStorage.setItem("orders", JSON.stringify(orders));
}

function resetOrder() {
  orderMode = false;
  orderStep = 0;
  selectedOrderProduct = "";

  orderData = {
    name: "",
    phone: "",
    city: "",
    product: "",
    size: "",
    color: ""
  };
}

/* Admin Panel */

const imageInput = document.getElementById("productImage");

if (imageInput) {
  imageInput.addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (event) {
      uploadedImage = event.target.result;

      const preview = document.getElementById("imagePreview");
      if (preview) {
        preview.src = uploadedImage;
        preview.style.display = "block";
      }
    };

    reader.readAsDataURL(file);
  });
}

function showAdminProducts() {
  const adminProductList = document.getElementById("adminProductList");
  if (!adminProductList) return;

  adminProductList.innerHTML = "";

  products.forEach((product, index) => {
    const item = document.createElement("div");
    item.className = "admin-product-item";

    item.innerHTML = `
      <img src="${product.image}" style="width:80px;height:80px;object-fit:cover;border-radius:12px;margin-bottom:8px;">
      <h3>${product.name}</h3>
      <p><strong>Price:</strong> ${product.price}</p>
      <p><strong>Sizes:</strong> ${product.sizes}</p>
      <p><strong>Colors:</strong> ${product.colors}</p>
      <p><strong>Category:</strong> ${product.category}</p>
      <p><strong>Status:</strong> ${product.stock}</p>

      <button class="edit-btn" onclick="editProduct(${index})">Edit</button>
      <button class="delete-btn" onclick="deleteProduct(${index})">Delete</button>

      <div class="inline-edit-box" id="editBox-${index}" style="display:none;">
        <input type="text" id="editPrice-${index}" value="${product.price}" placeholder="Edit Price">
        <input type="text" id="editSizes-${index}" value="${product.sizes}" placeholder="Edit Sizes">
        <input type="text" id="editColors-${index}" value="${product.colors}" placeholder="Edit Colors">
        <input type="text" id="editCategory-${index}" value="${product.category}" placeholder="Edit Category">
        <input type="text" id="editStock-${index}" value="${product.stock}" placeholder="Edit Stock">

        <button class="save-btn" onclick="saveEditedProduct(${index})">Save</button>
        <button class="cancel-btn" onclick="cancelEdit(${index})">Cancel</button>
      </div>
    `;

    adminProductList.appendChild(item);
  });
}

function addAdminProduct() {
  const nameInput = document.getElementById("productName");
  const priceInput = document.getElementById("productPrice");
  const sizesInput = document.getElementById("productSizes");
  const colorsInput = document.getElementById("productColors");
  const categoryInput = document.getElementById("productCategory");

  if (!nameInput || !priceInput || !sizesInput || !colorsInput || !categoryInput) {
    alert("Admin form fields are missing. Please check admin.html IDs.");
    return;
  }

  const name = nameInput.value.trim().toLowerCase();
  const price = priceInput.value.trim();
  const sizes = sizesInput.value.trim();
  const colors = colorsInput.value.trim();
  const category = categoryInput.value.trim();

  if (!name || !price || !sizes || !colors || !category) {
    alert("Please fill product name, price, sizes, colors, and category.");
    return;
  }

  const productImage = uploadedImage || "https://via.placeholder.com/300x200?text=Product+Image";

  const newProduct = {
    name: name,
    price: price,
    sizes: sizes,
    colors: colors,
    stock: "Available",
    category: category,
    image: productImage
  };

  products.push(newProduct);
  localStorage.setItem("products", JSON.stringify(products));

  showAdminProducts();

  nameInput.value = "";
  priceInput.value = "";
  sizesInput.value = "";
  colorsInput.value = "";
  categoryInput.value = "";

  const imageField = document.getElementById("productImage");
  if (imageField) {
    imageField.value = "";
  }

  const preview = document.getElementById("imagePreview");
  if (preview) {
    preview.src = "";
    preview.style.display = "none";
  }

  uploadedImage = "";

  alert("Product added successfully!");
}
function deleteProduct(index) {
  const confirmDelete = confirm("Are you sure you want to delete this product?");
  if (!confirmDelete) return;

  products.splice(index, 1);
  localStorage.setItem("products", JSON.stringify(products));
  showAdminProducts();

  alert("Product deleted successfully!");
}

function editProduct(index) {
  const editBox = document.getElementById(`editBox-${index}`);
  if (!editBox) return;

  editBox.style.display = "block";
}

function cancelEdit(index) {
  const editBox = document.getElementById(`editBox-${index}`);
  if (!editBox) return;

  editBox.style.display = "none";
}

function saveEditedProduct(index) {
  const price = document.getElementById(`editPrice-${index}`).value.trim();
  const sizes = document.getElementById(`editSizes-${index}`).value.trim();
  const colors = document.getElementById(`editColors-${index}`).value.trim();
  const category = document.getElementById(`editCategory-${index}`).value.trim();
  const stock = document.getElementById(`editStock-${index}`).value.trim();

  if (!price || !sizes || !colors || !category || !stock) {
    alert("Please fill all edit fields.");
    return;
  }

  products[index].price = price;
  products[index].sizes = sizes;
  products[index].colors = colors;
  products[index].category = category;
  products[index].stock = stock;

  localStorage.setItem("products", JSON.stringify(products));
  showAdminProducts();

  alert("Product updated successfully!");
}

function showAdminOrders() {
  const adminOrderList = document.getElementById("adminOrderList");
  if (!adminOrderList) return;

  adminOrderList.innerHTML = "";

  if (orders.length === 0) {
    adminOrderList.innerHTML = "<p>No orders yet.</p>";
    return;
  }

  orders.forEach((order, index) => {
    const item = document.createElement("div");
    item.className = "admin-order-item";

    item.innerHTML = `
      <h3>Order #${index + 1}</h3>
      <p><strong>Name:</strong> ${order.name}</p>
      <p><strong>Phone:</strong> ${order.phone}</p>
      <p><strong>City:</strong> ${order.city}</p>
      <p><strong>Product:</strong> ${order.product}</p>
      <p><strong>Size:</strong> ${order.size}</p>
      <p><strong>Color:</strong> ${order.color}</p>
      <p><strong>Date:</strong> ${order.date}</p>
      <button class="delete-btn" onclick="deleteOrder(${index})">Delete Order</button>
    `;

    adminOrderList.appendChild(item);
  });
}

function deleteOrder(index) {
  const confirmDelete = confirm("Are you sure you want to delete this order?");
  if (!confirmDelete) return;

  orders.splice(index, 1);
  localStorage.setItem("orders", JSON.stringify(orders));
  showAdminOrders();

  alert("Order deleted successfully!");
}

showAdminProducts();
showAdminOrders();