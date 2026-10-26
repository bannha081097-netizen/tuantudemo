const PRODUCT_PRICE = 69000;
const PRODUCT_NAME = "Xà phòng sinh học Khổ Qua Skin";
const splashStartedAt = performance.now();
let quantity = 1;
let cartQuantity = 0;
let toastTimer;

const $ = (selector) => document.querySelector(selector);
const formatPrice = (value) => `${new Intl.NumberFormat("vi-VN").format(value)}đ`;

function showHomeAfterLoading() {
  const splash = $("#site-splash");
  const minimumSplashTime = 1000;
  const remainingTime = Math.max(0, minimumSplashTime - (performance.now() - splashStartedAt));
  const navigateHome = () => {
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    document.documentElement.style.removeProperty("scroll-behavior");
  };

  window.setTimeout(() => {
    navigateHome();
    splash.classList.add("is-leaving");
    window.setTimeout(() => {
      navigateHome();
      splash.hidden = true;
      document.body.classList.remove("is-loading");
    }, 450);
  }, remainingTime);
}

if (document.readyState === "complete") {
  showHomeAfterLoading();
} else {
  window.addEventListener("load", showHomeAfterLoading, { once: true });
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2700);
}

function syncCart() {
  $("#cart-count").textContent = cartQuantity;
  $("#drawer-count").textContent = `(${cartQuantity})`;
  $("#cart-total").textContent = formatPrice(cartQuantity * PRODUCT_PRICE);
  $("#checkout-total").textContent = formatPrice(cartQuantity * PRODUCT_PRICE);
  $("#drawer-bottom").hidden = cartQuantity === 0;
  $("#drawer-content").innerHTML = cartQuantity === 0
    ? '<div class="empty-cart">Giỏ hàng đang chờ điều lành đầu tiên 🌿<br><br><a class="text-link" href="#product">Khám phá sản phẩm →</a></div>'
    : `<div class="cart-item">
        <img src="1793018990755_3448550435315116323_3448550435315116323_0c70ef9fa6287ccdbf87a00d3327fcce.jpg" alt="Bánh xà phòng và hộp Khổ Qua Skin">
        <div><strong>${PRODUCT_NAME}</strong><small>Bánh 100g · 69.000đ</small>
          <div class="cart-item-controls"><button data-cart-change="-1" aria-label="Giảm số lượng">−</button><span>${cartQuantity}</span><button data-cart-change="1" aria-label="Tăng số lượng">+</button><button class="cart-remove" data-cart-remove>Xóa</button></div>
        </div><strong class="cart-item-price">${formatPrice(cartQuantity * PRODUCT_PRICE)}</strong>
      </div>`;
}

function openDrawer() {
  $("#overlay").hidden = false;
  $("#cart-drawer").classList.add("open");
  $("#cart-drawer").setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeDrawer() {
  $("#cart-drawer").classList.remove("open");
  $("#cart-drawer").setAttribute("aria-hidden", "true");
  $("#overlay").hidden = true;
  document.body.style.overflow = "";
}

$("#quantity-minus").addEventListener("click", () => {
  quantity = Math.max(1, quantity - 1);
  $("#quantity").textContent = quantity;
});
$("#quantity-plus").addEventListener("click", () => {
  quantity += 1;
  $("#quantity").textContent = quantity;
});
$("#add-to-cart").addEventListener("click", () => {
  cartQuantity += quantity;
  syncCart();
  showToast(`Đã thêm ${quantity} bánh vào giỏ hàng`);
});
document.querySelectorAll("[data-add-quantity]").forEach((button) => {
  button.addEventListener("click", () => {
    const amount = Number(button.dataset.addQuantity);
    cartQuantity += amount;
    syncCart();
    showToast(`Đã thêm ${amount} ${amount === 1 ? "bánh" : "bánh"} vào giỏ hàng`);
  });
});
$("#cart-open").addEventListener("click", openDrawer);
$("#overlay").addEventListener("click", closeDrawer);
document.querySelectorAll("[data-close-drawer]").forEach((button) => button.addEventListener("click", closeDrawer));

$("#drawer-content").addEventListener("click", (event) => {
  const changeButton = event.target.closest("[data-cart-change]");
  if (changeButton) {
    cartQuantity = Math.max(0, cartQuantity + Number(changeButton.dataset.cartChange));
    syncCart();
  }
  if (event.target.closest("[data-cart-remove]")) {
    cartQuantity = 0;
    syncCart();
  }
});

$("#checkout-open").addEventListener("click", () => {
  $("#checkout-modal").showModal();
});
$("#checkout-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;
  const name = new FormData(event.currentTarget).get("name").trim();
  $("#checkout-modal").close();
  closeDrawer();
  cartQuantity = 0;
  syncCart();
  event.currentTarget.reset();
  showToast(`Cảm ơn ${name}! Đây là xác nhận mô phỏng, chưa tạo đơn thật.`);
});

$("#guarantee-open").addEventListener("click", () => $("#guarantee-modal").showModal());
$("#guarantee-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;
  $("#guarantee-modal").close();
  event.currentTarget.reset();
  showToast("Đã ghi nhận yêu cầu demo trên trình duyệt.");
});
document.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
});

const REVIEWS_STORAGE_KEY = "kho-qua-skin-reviews-v1";
let reviews = [];
let reviewStorageAvailable = true;

function parseReviews(rawReviews) {
  if (rawReviews === null) return [];
  const parsedReviews = JSON.parse(rawReviews);
  if (!Array.isArray(parsedReviews) || !parsedReviews.every((review) =>
    Number.isInteger(review.rating) &&
    review.rating >= 1 &&
    review.rating <= 5 &&
    typeof review.name === "string" &&
    review.name.length <= 50 &&
    typeof review.text === "string" &&
    review.text.trim().length > 0 &&
    review.text.length <= 1000 &&
    typeof review.createdAt === "string" &&
    !Number.isNaN(Date.parse(review.createdAt))
  )) {
    throw new Error("Dữ liệu đánh giá đã lưu không đúng định dạng.");
  }
  return parsedReviews;
}

function showReviewStorageError(error) {
  console.error("Không thể tải hoặc lưu đánh giá trên trình duyệt.", error);
  reviewStorageAvailable = false;
  const errorMessage = document.createElement("p");
  errorMessage.className = "review-storage-error";
  errorMessage.textContent = "Không thể truy cập dữ liệu đánh giá đã lưu trên trình duyệt này. Vui lòng kiểm tra cài đặt lưu trữ của trình duyệt.";
  $("#review-list").replaceChildren(errorMessage);
  $("#review-storage-note").textContent = "Chức năng lưu đánh giá hiện không khả dụng trên trình duyệt này.";
  $("#review-form").querySelector('[type="submit"]').disabled = true;
}

function renderReviews() {
  const average = reviews.length
    ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
    : 0;
  const roundedAverage = Math.round(average);
  $("#review-average").textContent = average.toFixed(1);
  $("#review-average-stars").textContent = "★".repeat(roundedAverage) + "☆".repeat(5 - roundedAverage);
  $("#review-average-stars").setAttribute(
    "aria-label",
    reviews.length ? `${average.toFixed(1)} trên 5 sao` : "Chưa có đánh giá"
  );
  $("#review-count").textContent = `${reviews.length} đánh giá`;

  const reviewList = $("#review-list");
  reviewList.replaceChildren();
  if (reviews.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "review-empty";
    emptyMessage.textContent = "Chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ trải nghiệm!";
    reviewList.append(emptyMessage);
    return;
  }

  const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" });
  reviews.forEach((review) => {
    const item = document.createElement("article");
    item.className = "review-item";

    const header = document.createElement("div");
    header.className = "review-item-head";
    const person = document.createElement("div");
    const name = document.createElement("strong");
    name.className = "review-item-name";
    name.textContent = review.name || "Khách ẩn danh";
    const date = document.createElement("time");
    date.className = "review-item-date";
    date.dateTime = review.createdAt;
    date.textContent = dateFormatter.format(new Date(review.createdAt));
    person.append(name, date);

    const stars = document.createElement("span");
    stars.className = "review-item-stars";
    stars.setAttribute("aria-label", `${review.rating} trên 5 sao`);
    stars.textContent = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
    header.append(person, stars);

    const text = document.createElement("p");
    text.className = "review-item-text";
    text.textContent = review.text;
    item.append(header, text);
    reviewList.append(item);
  });
}

try {
  reviews = parseReviews(window.localStorage.getItem(REVIEWS_STORAGE_KEY));
  renderReviews();
} catch (error) {
  showReviewStorageError(error);
}

$("#review-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;
  if (!reviewStorageAvailable) return;

  const formData = new FormData(event.currentTarget);
  const review = {
    rating: Number(formData.get("rating")),
    name: String(formData.get("name")).trim(),
    text: String(formData.get("review")).trim(),
    createdAt: new Date().toISOString()
  };
  if (!review.text) {
    $("#review-form-status").classList.add("is-error");
    $("#review-form-status").textContent = "Vui lòng nhập nội dung nhận xét.";
    $("#review-text").focus();
    return;
  }
  const nextReviews = [review, ...reviews];

  try {
    window.localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(nextReviews));
  } catch (error) {
    console.error("Không thể lưu đánh giá trên trình duyệt.", error);
    $("#review-form-status").classList.add("is-error");
    $("#review-form-status").textContent = "Chưa lưu được đánh giá. Bộ nhớ trình duyệt có thể đã đầy hoặc bị chặn.";
    return;
  }

  reviews = nextReviews;
  renderReviews();
  event.currentTarget.reset();
  $("#review-form-status").classList.remove("is-error");
  $("#review-form-status").textContent = "Cảm ơn bạn! Đánh giá đã được lưu trên trình duyệt này.";
});

window.addEventListener("storage", (event) => {
  if (event.key !== REVIEWS_STORAGE_KEY || !reviewStorageAvailable) return;
  try {
    reviews = parseReviews(event.newValue);
    renderReviews();
  } catch (error) {
    showReviewStorageError(error);
  }
});

const questions = [
  {
    prompt: "Bạn đang quan tâm điều gì ở vùng da lưng?",
    options: ["Mụn sưng / đỏ", "Mụn li ti / mụn ẩn", "Da dầu, dễ bí", "Chỉ muốn tìm routine làm sạch"]
  },
  {
    prompt: "Sau khi tắm, da bạn thường có cảm giác thế nào?",
    options: ["Dễ đổ dầu", "Khô hoặc căng", "Khá cân bằng", "Mình chưa rõ"]
  },
  {
    prompt: "Tình trạng này đã kéo dài bao lâu?",
    options: ["Dưới 1 tháng", "1–3 tháng", "Trên 3 tháng", "Không có mụn, muốn chăm sóc"]
  }
];
const answers = [];
let questionIndex = 0;

function renderQuestion() {
  $("#quiz-step-count").textContent = `CÂU ${questionIndex + 1} / ${questions.length}`;
  $("#quiz-progress-bar").style.width = `${((questionIndex + 1) / questions.length) * 100}%`;
  $("#quiz-content").innerHTML = `<h3 class="quiz-question">${questions[questionIndex].prompt}</h3>
    <div class="quiz-options">${questions[questionIndex].options.map((option, index) =>
      `<button class="quiz-option ${answers[questionIndex] === index ? "selected" : ""}" data-answer="${index}">${option}</button>`
    ).join("")}</div>`;
  $("#quiz-back").hidden = questionIndex === 0;
  $("#quiz-next").disabled = answers[questionIndex] === undefined;
  $("#quiz-next").innerHTML = questionIndex === questions.length - 1 ? "Xem gợi ý <span>→</span>" : 'Tiếp tục <span>→</span>';
}

function showQuizResult() {
  const isSensitive = answers[1] === 1;
  const longTerm = answers[2] === 2;
  const steps = [
    "Làm sạch nhẹ nhàng; tránh chà xát mạnh và thay áo sau khi vận động.",
    isSensitive ? "Ưu tiên sản phẩm dịu nhẹ, thử trên vùng da nhỏ trước khi dùng rộng." : "Giữ routine tối giản và theo dõi phản ứng da sau mỗi thay đổi.",
    "Nếu tình trạng kéo dài, đau, sưng hoặc để lại sẹo, cân nhắc hỏi ý kiến bác sĩ da liễu."
  ];
  $("#quiz-step-count").textContent = "GỢI Ý DÀNH CHO BẠN";
  $("#quiz-progress-bar").style.width = "100%";
  $("#quiz-content").innerHTML = `<div class="quiz-result"><h3>Lộ trình chăm sóc cơ bản 🌿</h3>
    <p>Dựa trên câu trả lời của bạn, hãy bắt đầu từ việc làm sạch nhẹ nhàng và quan sát cách da phản hồi.</p>
    <ul>${steps.map((step) => `<li>${step}</li>`).join("")}</ul>
    <p>${longTerm ? "Vì tình trạng đã kéo dài, lời khuyên chuyên môn sẽ hữu ích hơn việc tự thử nhiều sản phẩm." : "Xà phòng Khổ Qua Skin có thể được cân nhắc như một bước làm sạch; không phải thuốc điều trị mụn."}</p>
    <div class="quiz-result-actions"><button class="quiz-restart" id="quiz-restart">↺ Làm lại quiz</button><a class="button button-dark" href="#product">Xem sản phẩm <span>→</span></a></div>
    </div>`;
  $("#quiz-back").hidden = true;
  $("#quiz-next").hidden = true;
  $("#quiz-progress-bar").scrollIntoView({ behavior: "smooth", block: "center" });
}

$("#quiz-content").addEventListener("click", (event) => {
  const option = event.target.closest("[data-answer]");
  if (!option) return;
  answers[questionIndex] = Number(option.dataset.answer);
  renderQuestion();
});
$("#quiz-next").addEventListener("click", () => {
  if (answers[questionIndex] === undefined) return;
  if (questionIndex < questions.length - 1) {
    questionIndex += 1;
    renderQuestion();
  } else {
    showQuizResult();
  }
});
$("#quiz-back").addEventListener("click", () => {
  if (questionIndex > 0) {
    questionIndex -= 1;
    renderQuestion();
  }
});
$("#quiz-content").addEventListener("click", (event) => {
  if (event.target.closest("#quiz-restart")) {
    answers.length = 0;
    questionIndex = 0;
    $("#quiz-next").hidden = false;
    renderQuestion();
  }
});
renderQuestion();

$("#menu-toggle").addEventListener("click", () => {
  const nav = $("#main-nav");
  const isOpen = nav.classList.toggle("open");
  $("#menu-toggle").setAttribute("aria-expanded", String(isOpen));
});
$("#main-nav").addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    $("#main-nav").classList.remove("open");
    $("#menu-toggle").setAttribute("aria-expanded", "false");
  }
});

$("#chat-launcher").addEventListener("click", () => {
  $("#chat-panel").hidden = !$("#chat-panel").hidden;
});
$("#chat-close").addEventListener("click", () => { $("#chat-panel").hidden = true; });
$("#chat-body").addEventListener("click", (event) => {
  const option = event.target.closest(".chat-option");
  if (!option) return;
  if (option.dataset.action === "buy") {
    cartQuantity += 1;
    syncCart();
    showToast("Đã thêm 1 bánh Khổ Qua Skin vào giỏ hàng");
  }
  const reply = document.createElement("div");
  reply.className = "chat-message";
  reply.textContent = option.dataset.action === "buy"
    ? "Xà phòng Khổ Qua Skin 100g có giá 69.000đ/bánh 🌿 Mình đã thêm 1 bánh vào giỏ demo cho bạn. Bạn có thể mở giỏ hàng để tiếp tục; chưa có đơn thật được tạo."
    : option.dataset.reply;
  $("#chat-body").append(reply);
  $("#chat-body").scrollTop = $("#chat-body").scrollHeight;
});

syncCart();
