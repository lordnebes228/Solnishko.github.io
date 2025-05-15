// scripts/cart.js

import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

export async function addToCart(product) {
  const user = auth.currentUser;
  if (!user) return alert("Войдите в аккаунт");

  const cartRef = doc(db, "carts", user.uid);
  const cartSnap = await getDoc(cartRef);

  let items = [];
  if (cartSnap.exists()) items = cartSnap.data().items || [];

  const existingItem = items.find(item => item.id === product.id);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    items.push({ ...product, quantity: 1 });
  }

  await setDoc(cartRef, { items }, { merge: true });
}

export async function removeFromCart(productId) {
  const user = auth.currentUser;
  if (!user) return;
  const cartRef = doc(db, "carts", user.uid);
  const cartSnap = await getDoc(cartRef);
  if (!cartSnap.exists()) return;
  const items = cartSnap.data().items.filter(item => item.id !== productId);
  await setDoc(cartRef, { items }, { merge: true });
  renderCart();
}

export async function increaseQuantity(productId) {
  const user = auth.currentUser;
  if (!user) return;
  const cartRef = doc(db, "carts", user.uid);
  const cartSnap = await getDoc(cartRef);
  if (!cartSnap.exists()) return;
  const items = cartSnap.data().items.map(item => {
    if (item.id === productId) item.quantity += 1;
    return item;
  });
  await setDoc(cartRef, { items }, { merge: true });
  renderCart();
}

export async function decreaseQuantity(productId) {
  const user = auth.currentUser;
  if (!user) return;
  const cartRef = doc(db, "carts", user.uid);
  const cartSnap = await getDoc(cartRef);
  if (!cartSnap.exists()) return;
  const items = cartSnap.data().items.map(item => {
    if (item.id === productId && item.quantity > 1) item.quantity -= 1;
    return item;
  });
  await setDoc(cartRef, { items }, { merge: true });
  renderCart();
}

export async function checkout() {
  const user = auth.currentUser;
  if (!user) return;
  const cartRef = doc(db, "carts", user.uid);
  await setDoc(cartRef, { items: [] }, { merge: true });
  alert("Спасибо за заказ!");
  renderCart();
}

export async function renderCart() {
  const user = auth.currentUser;
  if (!user) return;
  const cartRef = doc(db, "carts", user.uid);
  const cartSnap = await getDoc(cartRef);
  const container = document.getElementById("cart");
  container.innerHTML = "";

  if (!cartSnap.exists() || !cartSnap.data().items.length) {
    container.innerHTML = "<p>Корзина пуста</p>";
    return;
  }

  const items = cartSnap.data().items;
  let total = 0;

  items.forEach(item => {
    total += item.price * item.quantity;
    container.innerHTML += `
      <div style="padding:10px; margin:10px; border:1px solid #ccc; border-radius:8px;">
        <strong>${item.name}</strong> — ${item.price}₽ × ${item.quantity} = ${item.price * item.quantity}₽<br/>
        <button onclick="decreaseQuantity('${item.id}')">➖</button>
        <button onclick="increaseQuantity('${item.id}')">➕</button>
        <button onclick="removeFromCart('${item.id}')">❌</button>
      </div>
    `;
  });

  container.innerHTML += `<h3>Итого: ${total}₽</h3>`;
}
