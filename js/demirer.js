/* DEMİRER İnşaat — ön yüz etkileşimleri (bağımlılıksız) */
(function () {
	"use strict";

	var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	var $ = function (sel, root) { return (root || document).querySelector(sel); };
	var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

	/* ---------------------------------------------------------- Üst bar */
	var header = $(".d-header");
	if (header) {
		var onScroll = function () {
			header.classList.toggle("is-stuck", window.scrollY > 8);
		};
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
	}

	/* ------------------------------------------------------ Mobil menü */
	var drawer = $("#menu-drawer");
	var scrim = $("#menu-scrim");
	var burger = $(".d-burger");
	var lastFocus = null;

	function openDrawer() {
		if (!drawer) { return; }
		lastFocus = document.activeElement;
		drawer.classList.add("is-open");
		if (scrim) { scrim.classList.add("is-open"); }
		drawer.setAttribute("aria-hidden", "false");
		if (burger) { burger.setAttribute("aria-expanded", "true"); }
		document.body.style.overflow = "hidden";
		var first = drawer.querySelector("button, a");
		if (first) { first.focus(); }
	}

	function closeDrawer() {
		if (!drawer) { return; }
		drawer.classList.remove("is-open");
		if (scrim) { scrim.classList.remove("is-open"); }
		drawer.setAttribute("aria-hidden", "true");
		if (burger) { burger.setAttribute("aria-expanded", "false"); }
		document.body.style.overflow = "";
		if (lastFocus) { lastFocus.focus(); }
	}

	if (burger) { burger.addEventListener("click", openDrawer); }
	if (scrim) { scrim.addEventListener("click", closeDrawer); }
	$$("[data-close-drawer]").forEach(function (el) { el.addEventListener("click", closeDrawer); });

	/* -------------------------------------------------------- Yukarı çık */
	var topBtn = $(".d-top");
	if (topBtn) {
		var toggleTop = function () {
			topBtn.classList.toggle("is-visible", window.scrollY > 700);
		};
		toggleTop();
		window.addEventListener("scroll", toggleTop, { passive: true });
		topBtn.addEventListener("click", function () {
			window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
		});
	}

	/* --------------------------------------------------- Görünüme girince */
	var revealables = $$(".d-reveal");
	if (revealables.length) {
		if (reduce || !("IntersectionObserver" in window)) {
			revealables.forEach(function (el) { el.classList.add("is-in"); });
		} else {
			var io = new IntersectionObserver(function (entries) {
				entries.forEach(function (entry) {
					if (entry.isIntersecting) {
						entry.target.classList.add("is-in");
						io.unobserve(entry.target);
					}
				});
			}, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
			revealables.forEach(function (el) { io.observe(el); });
		}
	}

	/* ------------------------------------------------------ IBAN kopyala */
	$$("[data-copy]").forEach(function (btn) {
		btn.addEventListener("click", function () {
			var value = btn.getAttribute("data-copy") || "";
			var label = $(".d-copy-text", btn);
			var done = function () {
				btn.classList.add("is-done");
				if (label) {
					var old = label.textContent;
					label.textContent = btn.getAttribute("data-copied") || "Kopyalandı";
					window.setTimeout(function () {
						label.textContent = old;
						btn.classList.remove("is-done");
					}, 2200);
				}
			};
			if (navigator.clipboard && navigator.clipboard.writeText) {
				navigator.clipboard.writeText(value).then(done);
			} else {
				var tmp = document.createElement("textarea");
				tmp.value = value;
				document.body.appendChild(tmp);
				tmp.select();
				try { document.execCommand("copy"); done(); } catch (e) { /* yoksay */ }
				document.body.removeChild(tmp);
			}
		});
	});

	/* ----------------------------------------------- Proje detay galerisi */
	var gallery = $("[data-gallery]");
	if (gallery) {
		var mainImg = $("[data-gallery-main]", gallery);
		var thumbs = $$("[data-gallery-thumb]", gallery);
		thumbs.forEach(function (thumb, index) {
			thumb.addEventListener("click", function () {
				if (!mainImg) { return; }
				mainImg.src = thumb.getAttribute("data-full");
				mainImg.alt = thumb.getAttribute("data-alt") || mainImg.alt;
				mainImg.setAttribute("data-index", String(index));
				thumbs.forEach(function (t) { t.classList.remove("is-active"); });
				thumb.classList.add("is-active");
			});
		});
	}

	/* --------------------------------------------------------- Işık kutusu */
	var lb = $("#lightbox");
	if (lb) {
		var lbImg = $("[data-lb-img]", lb);
		var lbCount = $("[data-lb-count]", lb);
		var items = [];
		var current = 0;

		var render = function () {
			if (!items.length) { return; }
			var item = items[current];
			lbImg.src = item.src;
			lbImg.alt = item.alt;
			if (lbCount) { lbCount.textContent = (current + 1) + " / " + items.length; }
		};

		var open = function (index) {
			current = index;
			render();
			var nav = lb.querySelector(".d-lightbox-nav");
			if (nav) { nav.hidden = items.length < 2; }
			lb.classList.add("is-open");
			lb.setAttribute("aria-hidden", "false");
			document.body.style.overflow = "hidden";
			var closeBtn = $("[data-lb-close]", lb);
			if (closeBtn) { closeBtn.focus(); }
		};

		var close = function () {
			lb.classList.remove("is-open");
			lb.setAttribute("aria-hidden", "true");
			document.body.style.overflow = "";
		};

		var step = function (dir) {
			if (!items.length) { return; }
			current = (current + dir + items.length) % items.length;
			render();
		};

		var galleryRoot = $("[data-gallery]");
		var galleryThumbs = galleryRoot ? $$("[data-gallery-thumb]", galleryRoot) : [];

		if (galleryThumbs.length) {
			// Proje galerisi: küçük görsellerin tamamı ışık kutusuna girer.
			galleryThumbs.forEach(function (thumb) {
				items.push({
					src: thumb.getAttribute("data-full"),
					alt: thumb.getAttribute("data-alt") || ""
				});
			});
			var mainTrigger = galleryRoot.querySelector("[data-lb]");
			if (mainTrigger) {
				mainTrigger.addEventListener("click", function (event) {
					event.preventDefault();
					var aktif = 0;
					galleryThumbs.forEach(function (thumb, i) {
						if (thumb.classList.contains("is-active")) { aktif = i; }
					});
					open(aktif);
				});
			}
		} else {
			$$("[data-lb]").forEach(function (trigger, index) {
				items.push({
					src: trigger.getAttribute("data-lb"),
					alt: trigger.getAttribute("data-lb-alt") || ""
				});
				trigger.addEventListener("click", function (event) {
					event.preventDefault();
					open(index);
				});
			});
		}

		var closeEl = $("[data-lb-close]", lb);
		if (closeEl) { closeEl.addEventListener("click", close); }
		var prevEl = $("[data-lb-prev]", lb);
		if (prevEl) { prevEl.addEventListener("click", function () { step(-1); }); }
		var nextEl = $("[data-lb-next]", lb);
		if (nextEl) { nextEl.addEventListener("click", function () { step(1); }); }
		lb.addEventListener("click", function (event) {
			if (event.target === lb) { close(); }
		});
	}

	/* ---------------------------------------------------------- Klavye */
	document.addEventListener("keydown", function (event) {
		if (event.key !== "Escape") { return; }
		if (drawer && drawer.classList.contains("is-open")) { closeDrawer(); }
		var box = $("#lightbox");
		if (box && box.classList.contains("is-open")) {
			box.classList.remove("is-open");
			box.setAttribute("aria-hidden", "true");
			document.body.style.overflow = "";
		}
	});

	document.addEventListener("keydown", function (event) {
		var box = $("#lightbox");
		if (!box || !box.classList.contains("is-open")) { return; }
		if (event.key === "ArrowRight") { var n = $("[data-lb-next]", box); if (n) { n.click(); } }
		if (event.key === "ArrowLeft") { var p = $("[data-lb-prev]", box); if (p) { p.click(); } }
	});
})();
