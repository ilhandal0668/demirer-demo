/* DEMİRER İnşaat — ön yüz etkileşimleri (bağımlılıksız) */
(function () {
	"use strict";

	var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	var $ = function (sel, root) { return (root || document).querySelector(sel); };
	var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

	/* --------------------------------------- Ana sayfa videosu: hafif ve koşullu yükleme */
	var heroVideo = $(".d-hero-video");
	if (heroVideo) {
		var heroFigure = heroVideo.closest ? heroVideo.closest(".d-hero-figure") : null;
		var heroButon = heroFigure ? heroFigure.querySelector("[data-video-oynat]") : null;
		var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
		// Yalnizca cok yavas baglantida ve veri tasarrufu acikken atlanir. Mobilde de oynar.
		var effective = (connection && connection.effectiveType) || "";
		var slowConnection = !!connection && (effective === "slow-2g" || effective === "2g" || connection.saveData === true);
		var heroLoaded = false;

		// Dar ekranda hafif surum, genis ekranda tam surum
		var kaynakSec = function () {
			var mobil = heroVideo.getAttribute("data-src-mobil");
			var darEkran = window.matchMedia("(max-width: 767px)").matches;
			return (darEkran && mobil) ? mobil : heroVideo.getAttribute("data-src");
		};

		var butonGoster = function (goster) {
			if (heroFigure) { heroFigure.classList.toggle("video-elle", !!goster); }
		};

		// iOS dusuk guc modunda otomatik oynatma reddedilir; o durumda dugme gosterilir.
		var oynatmayiDene = function () {
			var sonuc = heroVideo.play();
			if (sonuc && sonuc.then) {
				sonuc.then(function () { butonGoster(false); })
				     .catch(function () { butonGoster(true); });
			}
		};

		var loadHeroVideo = function () {
			if (heroLoaded || reduce || slowConnection) { return; }
			heroLoaded = true;
			// iOS icin sessizlik hem oznitelik hem ozellik olarak ayarli olmali
			heroVideo.muted = true;
			heroVideo.setAttribute("muted", "");
			heroVideo.setAttribute("playsinline", "");
			heroVideo.src = kaynakSec();
			heroVideo.load();
			oynatmayiDene();
		};

		var queueHeroVideo = function () {
			if ("requestIdleCallback" in window) {
				window.requestIdleCallback(loadHeroVideo, { timeout: 1800 });
			} else {
				window.setTimeout(loadHeroVideo, 600);
			}
		};
		if (document.readyState === "complete") { queueHeroVideo(); }
		else { window.addEventListener("load", queueHeroVideo, { once: true }); }

		// Ilk dokunus/tiklama: otomatik oynatma engellendiyse kullanici hareketi cozer
		var ilkTemas = function () {
			loadHeroVideo();
			if (heroLoaded && heroVideo.paused) { oynatmayiDene(); }
		};
		["touchstart", "click", "keydown"].forEach(function (olay) {
			window.addEventListener(olay, ilkTemas, { once: true, passive: true });
		});

		if (heroButon) {
			heroButon.addEventListener("click", function (olay) {
				olay.preventDefault();
				olay.stopPropagation();
				loadHeroVideo();
				oynatmayiDene();
			});
		}

		if ("IntersectionObserver" in window) {
			new IntersectionObserver(function (girisler) {
				girisler.forEach(function (giris) {
					if (!heroLoaded) { return; }
					if (giris.isIntersecting) { oynatmayiDene(); }
					else { heroVideo.pause(); }
				});
			}, { threshold: 0.08 }).observe(heroVideo);
		}
	}

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

	/* ------------------------------------------ Kat karşılığı hesaplayıcı */
	var hesap = $("[data-hesap]");
	if (hesap) {
		var arsaEl = $("[data-hesap-arsa]", hesap);
		var emsalEl = $("[data-hesap-emsal]", hesap);
		var daireEl = $("[data-hesap-daire]", hesap);
		var oranEl = $("[data-hesap-oran]", hesap);
		var oranYazi = $("[data-hesap-oran-yazi]", hesap);
		var toplamEl = $("[data-hesap-toplam]", hesap);
		var adetEl = $("[data-hesap-adet]", hesap);
		var payEl = $("[data-hesap-pay]", hesap);
		var payAlanEl = $("[data-hesap-payalan]", hesap);
		var aktarBtn = $("[data-hesap-aktar]", hesap);
		var ingilizce = document.documentElement.lang === "en";

		var bicim = function (sayi) {
			return Math.round(sayi).toLocaleString(ingilizce ? "en-US" : "tr-TR");
		};

		var sayi = function (el, enAz, enCok, varsayilan) {
			var v = parseFloat(String(el.value).replace(",", "."));
			if (!isFinite(v)) { return varsayilan; }
			return Math.min(enCok, Math.max(enAz, v));
		};

		var hesapla = function () {
			var arsa = sayi(arsaEl, 1, 200000, 500);
			var emsal = sayi(emsalEl, 0.1, 10, 1.5);
			var daire = sayi(daireEl, 30, 600, 120);
			var oran = sayi(oranEl, 0, 100, 45);

			var toplam = arsa * emsal;
			var adet = Math.floor(toplam / daire);
			var payAlan = toplam * (oran / 100);
			var payAdetAlt = Math.floor(adet * oran / 100);
			var payAdetUst = Math.ceil(adet * oran / 100);

			oranYazi.textContent = "%" + Math.round(oran);
			toplamEl.textContent = bicim(toplam) + " m²";
			adetEl.textContent = adet > 0 ? bicim(adet) : "—";
			payAlanEl.textContent = bicim(payAlan) + " m²";

			var birim = ingilizce ? " flats" : " daire";
			if (adet <= 0) {
				payEl.textContent = "—";
			} else if (payAdetAlt === payAdetUst) {
				payEl.textContent = payAdetAlt + birim;
			} else {
				payEl.textContent = payAdetAlt + " – " + payAdetUst + birim;
			}
		};

		[arsaEl, emsalEl, daireEl, oranEl].forEach(function (el) {
			if (el) { el.addEventListener("input", hesapla); }
		});
		hesapla();

		// Sonuçları teklif formuna taşı
		if (aktarBtn) {
			aktarBtn.addEventListener("click", function () {
				var konu = $("#konu");
				var detay = $("#detay");
				if (konu) {
					konu.value = ingilizce ? "Revenue-share pre-assessment" : "Kat karşılığı ön değerlendirme";
				}
				if (detay) {
					var satirlar = ingilizce
						? ["Plot area: " + arsaEl.value + " m²", "Floor area ratio: " + emsalEl.value,
						   "Average flat size: " + daireEl.value + " m²", "Requested share: %" + oranEl.value,
						   "Estimated buildable area: " + toplamEl.textContent, "Estimated flats: " + adetEl.textContent,
						   "My share: " + payEl.textContent + " (" + payAlanEl.textContent + ")"]
						: ["Arsa alanı: " + arsaEl.value + " m²", "İmar emsali: " + emsalEl.value,
						   "Ortalama daire: " + daireEl.value + " m²", "Beklenen pay: %" + oranEl.value,
						   "Hesaplanan inşaat alanı: " + toplamEl.textContent, "Hesaplanan daire sayısı: " + adetEl.textContent,
						   "Bana düşen: " + payEl.textContent + " (" + payAlanEl.textContent + ")"];
					detay.value = satirlar.join("\n");
				}
				var hedef = $("#teklif-formu");
				if (hedef) { hedef.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }
				window.setTimeout(function () { if (detay) { detay.focus(); } }, reduce ? 0 : 600);
			});
		}
	}

	/* --------------------------------------------- Şakül: bölüm göstergesi */
	var sakul = $("#sakul");
	if (sakul && window.matchMedia("(min-width: 1400px)").matches) {
		var ana = $("#main");
		var bolumler = ana ? $$("section", ana).filter(function (b) {
			var baslik = b.querySelector("h1, h2");
			return baslik && baslik.textContent.trim().length > 1 && b.offsetHeight > 200;
		}) : [];

		if (bolumler.length > 1) {
			var liste = $(".d-sakul-liste", sakul);
			var govde = $(".d-sakul-govde", sakul);
			var aktifYazi = $(".d-sakul-aktif", sakul);
			var noktalar = [];

			bolumler.forEach(function (bolum, i) {
				var baslik = bolum.querySelector("h1, h2").textContent.trim();
				var li = document.createElement("li");
				var btn = document.createElement("button");
				btn.type = "button";
				btn.className = "d-sakul-nokta";
				btn.innerHTML = '<span class="d-sakul-etiket"></span>';
				btn.querySelector(".d-sakul-etiket").textContent = baslik.slice(0, 28);
				btn.setAttribute("aria-label", baslik);
				btn.addEventListener("click", function () {
					bolum.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
				});
				li.appendChild(btn);
				liste.appendChild(li);
				noktalar.push({ dugme: btn, bolum: bolum, li: li, baslik: baslik.slice(0, 24) });
			});

			sakul.hidden = false;

			var koyuMu = function (el) {
				while (el && el !== document.body) {
					if (el.classList && (el.classList.contains("d-bg-ink") || el.classList.contains("on-dark") ||
						el.classList.contains("d-cta") || el.classList.contains("d-footer") ||
						el.classList.contains("d-pagehead") || el.classList.contains("d-hero-figure"))) { return true; }
					el = el.parentElement;
				}
				return false;
			};

			var bekliyor = false;
			var guncelle = function () {
				bekliyor = false;
				var belge = document.documentElement;
				var toplam = belge.scrollHeight - belge.clientHeight;
				var oran = toplam > 0 ? Math.min(1, Math.max(0, window.scrollY / toplam)) : 0;
				var kutu = sakul.getBoundingClientRect();

				govde.style.top = (oran * kutu.height) + "px";
				sakul.classList.toggle("is-visible", window.scrollY > 220);

				// Noktaları belge içindeki konumlarına göre yerleştir
				var belgeYuksekligi = belge.scrollHeight;
				noktalar.forEach(function (n) {
					var ust = n.bolum.getBoundingClientRect().top + window.scrollY;
					n.li.style.top = Math.min(100, Math.max(0, (ust / belgeYuksekligi) * 100)) + "%";
					var r = n.bolum.getBoundingClientRect();
					var aktif = r.top <= belge.clientHeight * 0.4 && r.bottom > belge.clientHeight * 0.4;
					n.dugme.classList.toggle("is-active", aktif);
					if (aktif && aktifYazi) { aktifYazi.textContent = n.baslik; }
				});

				// Arka plan koyuysa rengi tersine çevir
				var arkadaki = document.elementFromPoint(kutu.left + kutu.width / 2, kutu.top + oran * kutu.height);
				sakul.classList.toggle("is-koyu", koyuMu(arkadaki));
			};

			var istek = function () {
				if (!bekliyor) { bekliyor = true; window.requestAnimationFrame(guncelle); }
			};
			window.addEventListener("scroll", istek, { passive: true });
			window.addEventListener("resize", istek);
			guncelle();
		}
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
