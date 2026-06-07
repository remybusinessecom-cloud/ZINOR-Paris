/* ============================================================
   ZINOR PARIS — Script principal du thème
   Maison horlogère parisienne indépendante
   JavaScript vanilla — aucune dépendance externe
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     1. FADE-IN AU SCROLL — IntersectionObserver
     Anime les éléments .fade-in lorsqu'ils entrent dans le viewport
     ============================================================ */
  function initScrollAnimations() {
    // Sélection de tous les éléments avec la classe .fade-in
    const elements = document.querySelectorAll('.fade-in');

    if (elements.length === 0) return;

    // Si l'utilisateur préfère réduire les animations, on affiche tout immédiatement
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elements.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    // Configuration de l'observer — déclenche quand 15% de l'élément est visible
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.15,
    };

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          // On ajoute la classe qui déclenche l'animation CSS
          entry.target.classList.add('is-visible');
          // Une fois animé, on arrête d'observer pour économiser des ressources
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    elements.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ============================================================
     2. STICKY HEADER — état "scrolled"
     Ajoute la classe .is-scrolled au header dès qu'on défile
     ============================================================ */
  function initStickyHeader() {
    const header = document.querySelector('[data-sticky-header]');
    if (!header) return;

    let lastScrollY = 0;
    let ticking = false;

    function updateHeader() {
      const scrollY = window.scrollY;

      // Seuil de 20px — léger pour éviter un effet trop brutal au moindre mouvement
      if (scrollY > 20) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }

      lastScrollY = scrollY;
      ticking = false;
    }

    // requestAnimationFrame — performance optimale au scroll
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    }, { passive: true });

    // Appel initial pour gérer le cas où la page est déjà scrollée au chargement
    updateHeader();
  }

  /* ============================================================
     3. COMPTEUR STOCK DYNAMIQUE
     Affiche le nombre de pièces restantes — édition limitée 100 ex.
     Utilise [data-stock-counter] avec data-total et data-sold
     ============================================================ */
  function initStockCounter() {
    const counters = document.querySelectorAll('[data-stock-counter]');
    if (counters.length === 0) return;

    counters.forEach(function (counter) {
      const total = parseInt(counter.dataset.total, 10) || 100;
      const sold = parseInt(counter.dataset.sold, 10) || 0;
      const remaining = Math.max(0, total - sold);

      // Calcul du pourcentage restant pour la barre de progression visuelle
      const percentRemaining = (remaining / total) * 100;

      // Mise à jour du DOM — nombre restant
      const remainingEl = counter.querySelector('[data-stock-remaining]');
      if (remainingEl) remainingEl.textContent = remaining;

      const totalEl = counter.querySelector('[data-stock-total]');
      if (totalEl) totalEl.textContent = total;

      // Mise à jour de la barre de progression si présente
      const bar = counter.querySelector('[data-stock-bar]');
      if (bar) {
        bar.style.width = percentRemaining + '%';
      }

      // Classe d'alerte si stock faible (moins de 20% restant)
      if (percentRemaining <= 20) {
        counter.classList.add('is-low-stock');
      }
    });
  }

  /* ============================================================
     4. GALERIE PRODUIT — fiche produit (stacked images)
     Toutes les images sont rendues simultanément, empilées en
     absolute. Le swap se fait par toggle de classe .is-active
     (transition opacity gérée en CSS — pas de flash de src).
     Structure attendue :
       [data-product-gallery]
         [data-product-thumbs]
           [data-product-thumb data-image-index="N"]
         [data-product-main]
           [data-product-image data-image-index="N" data-image-zoom="..."]
         [data-product-dots]
           [data-product-thumb data-image-index="N"]
     ============================================================ */
  function initProductGallery() {
    const galleries = document.querySelectorAll('[data-product-gallery]');
    if (galleries.length === 0) return;

    galleries.forEach(function (gallery) {
      const images = Array.from(gallery.querySelectorAll('[data-product-image]'));
      const thumbs = Array.from(gallery.querySelectorAll('[data-product-thumb]'));

      if (images.length === 0 || thumbs.length === 0) return;

      // Active la paire image + thumbnails (desktop + mobile) via data-image-index
      function activate(index) {
        const target = String(index);

        images.forEach(function (img) {
          if (img.dataset.imageIndex === target) {
            img.classList.add('is-active');
          } else {
            img.classList.remove('is-active');
          }
        });

        thumbs.forEach(function (thumb) {
          if (thumb.dataset.imageIndex === target) {
            thumb.classList.add('is-active');
            thumb.setAttribute('aria-selected', 'true');
          } else {
            thumb.classList.remove('is-active');
            thumb.setAttribute('aria-selected', 'false');
          }
        });
      }

      // Clic sur une miniature ou un dot — swap immédiat
      thumbs.forEach(function (thumb) {
        thumb.addEventListener('click', function (event) {
          event.preventDefault();
          const index = parseInt(thumb.dataset.imageIndex, 10);
          if (!Number.isNaN(index)) activate(index);
        });
      });

      // Navigation clavier — flèches gauche/droite (et haut/bas pour les thumbs verticaux)
      const thumbContainers = gallery.querySelectorAll('[data-product-thumbs], [data-product-dots]');
      thumbContainers.forEach(function (container) {
        container.addEventListener('keydown', function (event) {
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' &&
              event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;

          const localThumbs = Array.from(container.querySelectorAll('[data-product-thumb]'));
          const currentIndex = localThumbs.indexOf(document.activeElement);
          if (currentIndex === -1) return;

          event.preventDefault();
          let nextIndex;
          if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            nextIndex = (currentIndex + 1) % localThumbs.length;
          } else {
            nextIndex = (currentIndex - 1 + localThumbs.length) % localThumbs.length;
          }
          localThumbs[nextIndex].focus();
          const targetIndex = parseInt(localThumbs[nextIndex].dataset.imageIndex, 10);
          if (!Number.isNaN(targetIndex)) activate(targetIndex);
        });
      });
    });
  }

  /* ============================================================
     4b. CURSEUR DIRECTIONNEL — image principale fiche produit
     Cercle 52px qui suit la souris dans .zinor-product__main.
     Flèche orientée selon la moitié (gauche : ← / droite : →).
     Clic gauche → image précédente, clic droite → suivante.
     Désactivé sur tactile.
     ============================================================ */
  function initProductCursor() {
    const galleries = document.querySelectorAll('[data-product-gallery]');
    if (galleries.length === 0) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    galleries.forEach(function (gallery) {
      const main = gallery.querySelector('[data-product-main]');
      const images = Array.from(gallery.querySelectorAll('[data-product-image]'));
      const thumbs = Array.from(gallery.querySelectorAll('[data-product-thumb]'));

      if (!main || images.length <= 1 || thumbs.length === 0) return;

      // Création du curseur (flèche ← par défaut, pivote sur moitié droite)
      const cursor = document.createElement('div');
      cursor.className = 'zinor-product__cursor';
      cursor.setAttribute('aria-hidden', 'true');
      cursor.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="20" y1="12" x2="4" y2="12"/><polyline points="10 18 4 12 10 6"/></svg>';
      main.appendChild(cursor);

      function getActiveIndex() {
        for (let i = 0; i < images.length; i++) {
          if (images[i].classList.contains('is-active')) return i;
        }
        return 0;
      }

      function navigate(direction) {
        const current = getActiveIndex();
        let next = current + direction;
        if (next < 0) next = images.length - 1;
        if (next >= images.length) next = 0;
        // Clique le premier thumbnail correspondant — réutilise la logique d'initProductGallery
        const targetThumb = thumbs.find(function (t) {
          return parseInt(t.dataset.imageIndex, 10) === next;
        });
        if (targetThumb) targetThumb.click();
      }

      main.addEventListener('mousemove', function (event) {
        const rect = main.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        cursor.style.left = x + 'px';
        cursor.style.top = y + 'px';
        cursor.classList.toggle('is-right', x > rect.width / 2);
      });

      main.addEventListener('mouseenter', function () {
        cursor.classList.add('is-visible');
      });

      main.addEventListener('mouseleave', function () {
        cursor.classList.remove('is-visible');
      });

      main.addEventListener('click', function (event) {
        // Ne pas naviguer si on a cliqué sur le bouton zoom
        if (event.target.closest('[data-product-zoom-trigger]')) return;
        const rect = main.getBoundingClientRect();
        const x = event.clientX - rect.left;
        navigate(x > rect.width / 2 ? 1 : -1);
      });
    });
  }

  /* ============================================================
     4c. LIGHTBOX ZOOM — fiche produit
     Bouton [data-product-zoom-trigger] ouvre la lightbox avec
     l'image actuellement active (via data-image-zoom HD).
     Fermeture : croix, Échap, clic hors image. Focus trap.
     ============================================================ */
  function initProductZoom() {
    const trigger = document.querySelector('[data-product-zoom-trigger]');
    const lightbox = document.querySelector('[data-product-lightbox]');
    const closeBtn = document.querySelector('[data-product-lightbox-close]');
    const lightboxImage = document.querySelector('[data-product-lightbox-image]');

    if (!trigger || !lightbox || !lightboxImage) return;

    let lastFocused = null;
    const isOpen = function () { return lightbox.classList.contains('is-open'); };

    function open() {
      // Récupère l'image actuellement active
      const activeWrapper = document.querySelector('[data-product-image].is-active');
      if (!activeWrapper) return;

      const zoomSrc = activeWrapper.dataset.imageZoom;
      const innerImg = activeWrapper.querySelector('img');
      const alt = innerImg ? innerImg.alt : '';

      if (zoomSrc) {
        lightboxImage.src = zoomSrc;
        lightboxImage.alt = alt;
      }

      lastFocused = document.activeElement;
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      lockScroll();
      if (closeBtn) setTimeout(function () { closeBtn.focus(); }, 100);
    }

    function close() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      unlockScroll();
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
    }

    trigger.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      open();
    });

    if (closeBtn) closeBtn.addEventListener('click', close);

    // Clic en dehors de l'image (sur le backdrop) ferme aussi
    lightbox.addEventListener('click', function (event) {
      if (event.target === lightbox) close();
    });

    // Touche Échap
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isOpen()) {
        event.preventDefault();
        close();
      }
    });

    // Focus trap
    attachFocusTrap(lightbox, isOpen);
  }

  /* ============================================================
     4b. GALERIE PRODUIT PHARE (homepage) — empilement absolu
     Les 4 images sont rendues en position absolue, superposées.
     Cliquer sur un dot bascule la classe .is-active sur l'image
     et le dot correspondants (transition opacity gérée en CSS).
     Structure attendue :
       [data-featured-gallery]
         [data-featured-image data-image-index="N"]
         [data-featured-dot   data-image-index="N"]
     ============================================================ */
  function initFeaturedGallery() {
    const galleries = document.querySelectorAll('[data-featured-gallery]');
    if (galleries.length === 0) return;

    galleries.forEach(function (gallery) {
      const images = gallery.querySelectorAll('[data-featured-image]');
      const dots = gallery.querySelectorAll('[data-featured-dot]');

      if (images.length === 0 || dots.length === 0) return;

      // Active une paire image + dot via leur data-image-index
      function activate(index) {
        const target = String(index);

        images.forEach(function (img) {
          if (img.dataset.imageIndex === target) {
            img.classList.add('is-active');
          } else {
            img.classList.remove('is-active');
          }
        });

        dots.forEach(function (dot) {
          if (dot.dataset.imageIndex === target) {
            dot.classList.add('is-active');
            dot.setAttribute('aria-selected', 'true');
          } else {
            dot.classList.remove('is-active');
            dot.setAttribute('aria-selected', 'false');
          }
        });
      }

      // Clic sur un dot — swap immédiat
      dots.forEach(function (dot) {
        dot.addEventListener('click', function () {
          const index = parseInt(dot.dataset.imageIndex, 10);
          if (!Number.isNaN(index)) activate(index);
        });
      });

      // Navigation clavier — flèches gauche / droite quand un dot a le focus
      gallery.addEventListener('keydown', function (event) {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

        const dotsArray = Array.from(dots);
        const focusedIndex = dotsArray.indexOf(document.activeElement);
        if (focusedIndex === -1) return; // pas sur un dot, on ignore

        event.preventDefault();
        let nextIndex;
        if (event.key === 'ArrowRight') {
          nextIndex = (focusedIndex + 1) % dotsArray.length;
        } else {
          nextIndex = (focusedIndex - 1 + dotsArray.length) % dotsArray.length;
        }
        dotsArray[nextIndex].focus();
        const targetIndex = parseInt(dotsArray[nextIndex].dataset.imageIndex, 10);
        if (!Number.isNaN(targetIndex)) activate(targetIndex);
      });
    });
  }

  /* ============================================================
     5. ACCORDÉON — sections déroulantes (fiche produit)
     Structure attendue :
       [data-accordion]
         [data-accordion-item]
           [data-accordion-trigger] (button avec aria-expanded)
           [data-accordion-panel]
     L'animation max-height est gérée en CSS (.is-open).
     ============================================================ */
  function initAccordion() {
    const accordions = document.querySelectorAll('[data-accordion]');
    if (accordions.length === 0) return;

    accordions.forEach(function (accordion) {
      const triggers = accordion.querySelectorAll('[data-accordion-trigger]');

      triggers.forEach(function (trigger) {
        trigger.addEventListener('click', function () {
          const item = trigger.closest('[data-accordion-item]');
          if (!item) return;

          const isOpen = item.classList.contains('is-open');

          // Bascule l'état — on ne ferme pas les autres (multi-ouvert autorisé)
          if (isOpen) {
            item.classList.remove('is-open');
            trigger.setAttribute('aria-expanded', 'false');
          } else {
            item.classList.add('is-open');
            trigger.setAttribute('aria-expanded', 'true');
          }
        });
      });
    });
  }

  /* ============================================================
     6. STICKY ATC — barre d'achat fixe en bas (mobile)
     Apparaît quand le bouton ATC principal sort du viewport.
     Le clic sur le bouton sticky déclenche la soumission du
     formulaire principal [data-product-form].
     ============================================================ */
  function initStickyATC() {
    const stickyBar = document.querySelector('[data-sticky-atc]');
    const mainButton = document.querySelector('[data-atc-button]');
    const mainForm = document.querySelector('[data-product-form]');
    const stickyTrigger = document.querySelector('[data-sticky-atc-trigger]');

    if (!stickyBar || !mainButton) return;

    // IntersectionObserver — détecte la visibilité du bouton ATC principal
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          // Le bouton est visible → cache la barre sticky
          stickyBar.classList.remove('is-visible');
          stickyBar.setAttribute('aria-hidden', 'true');
        } else {
          // Le bouton est hors viewport → affiche la barre sticky
          stickyBar.classList.add('is-visible');
          stickyBar.setAttribute('aria-hidden', 'false');
        }
      });
    }, {
      // Marge négative pour déclencher juste après que le bouton sort
      rootMargin: '0px 0px -10px 0px',
      threshold: 0,
    });

    observer.observe(mainButton);

    // Clic sur le bouton sticky → soumet le formulaire principal
    if (stickyTrigger && mainForm) {
      stickyTrigger.addEventListener('click', function (event) {
        event.preventDefault();
        if (stickyTrigger.disabled) return;

        // requestSubmit() respecte la validation HTML5 + déclenche l'event submit
        if (typeof mainForm.requestSubmit === 'function') {
          mainForm.requestSubmit();
        } else {
          mainForm.submit();
        }
      });
    }
  }

  /* ============================================================
     HELPERS PARTAGÉS — verrou de scroll & focus trap
     Utilisés par menu mobile, search overlay et account drawer.
     ============================================================ */

  // Compteur de verrous — permet à plusieurs overlays de cohabiter
  // sans déverrouiller le scroll prématurément
  let scrollLockCount = 0;

  function lockScroll() {
    scrollLockCount += 1;
    document.body.classList.add('no-scroll');
  }

  function unlockScroll() {
    scrollLockCount = Math.max(0, scrollLockCount - 1);
    if (scrollLockCount === 0) {
      document.body.classList.remove('no-scroll');
    }
  }

  // Sélecteur des éléments focusables dans un container
  const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  // Piège à focus générique : Tab et Shift+Tab cyclent à l'intérieur
  function attachFocusTrap(container, isOpenFn) {
    container.addEventListener('keydown', function (event) {
      if (event.key !== 'Tab') return;
      if (!isOpenFn()) return;

      const focusables = container.querySelectorAll(FOCUSABLE_SELECTOR);
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  /* ============================================================
     7. MENU MOBILE — overlay fullscreen (burger)
     ============================================================ */
  function initMobileMenu() {
    const toggle = document.querySelector('[data-menu-toggle]');
    const menu = document.querySelector('[data-mobile-menu]');
    const closeBtn = document.querySelector('[data-menu-close]');

    if (!toggle || !menu) return;

    let lastFocused = null;
    const isOpen = function () { return menu.classList.contains('is-open'); };

    function openMenu() {
      lastFocused = document.activeElement;
      menu.classList.add('is-open');
      menu.setAttribute('aria-hidden', 'false');
      toggle.setAttribute('aria-expanded', 'true');
      lockScroll();
      if (closeBtn) setTimeout(function () { closeBtn.focus(); }, 50);
    }

    function closeMenu() {
      menu.classList.remove('is-open');
      menu.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
      unlockScroll();
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
    }

    toggle.addEventListener('click', openMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);

    // Fermeture au clic sur un lien interne
    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    // Touche Échap
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isOpen()) {
        event.preventDefault();
        closeMenu();
      }
    });

    attachFocusTrap(menu, isOpen);
  }

  /* ============================================================
     8. SEARCH OVERLAY — recherche fullscreen avec blur
     Toggle [data-search-toggle], fermeture par croix / Échap.
     Focus automatique sur l'input à l'ouverture.
     ============================================================ */
  function initSearchOverlay() {
    const toggle = document.querySelector('[data-search-toggle]');
    const overlay = document.querySelector('[data-search-overlay]');
    const closeBtn = document.querySelector('[data-search-close]');
    const input = document.querySelector('[data-search-input]');

    if (!toggle || !overlay) return;

    let lastFocused = null;
    const isOpen = function () { return overlay.classList.contains('is-open'); };

    function open() {
      lastFocused = document.activeElement;
      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');
      toggle.setAttribute('aria-expanded', 'true');
      lockScroll();
      // Focus auto sur le champ — attend la fin de la transition pour éviter le scroll
      if (input) setTimeout(function () { input.focus(); }, 100);
    }

    function close() {
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
      unlockScroll();
      if (input) input.value = '';
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
    }

    toggle.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isOpen()) {
        event.preventDefault();
        close();
      }
    });

    attachFocusTrap(overlay, isOpen);
  }

  /* ============================================================
     9. ACCOUNT DRAWER — sidebar slide depuis la droite
     Pattern Daniel Wellington : backdrop sombre + drawer 480px.
     Toggle [data-account-toggle], fermeture par croix / backdrop
     / Échap. Focus trap, ARIA, scroll lock.
     ============================================================ */
  function initAccountDrawer() {
    const toggle = document.querySelector('[data-account-toggle]');
    const drawer = document.querySelector('[data-account-drawer]');
    const backdrop = document.querySelector('[data-account-backdrop]');
    const closeBtn = document.querySelector('[data-account-close]');

    if (!toggle || !drawer) return;

    let lastFocused = null;
    const isOpen = function () { return drawer.classList.contains('is-open'); };

    function open() {
      lastFocused = document.activeElement;
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      toggle.setAttribute('aria-expanded', 'true');
      if (backdrop) {
        backdrop.classList.add('is-visible');
        backdrop.setAttribute('aria-hidden', 'false');
      }
      lockScroll();
      if (closeBtn) setTimeout(function () { closeBtn.focus(); }, 100);
    }

    function close() {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
      if (backdrop) {
        backdrop.classList.remove('is-visible');
        backdrop.setAttribute('aria-hidden', 'true');
      }
      unlockScroll();
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
    }

    toggle.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    // Clic sur le backdrop ferme également
    if (backdrop) backdrop.addEventListener('click', close);

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isOpen()) {
        event.preventDefault();
        close();
      }
    });

    attachFocusTrap(drawer, isOpen);
  }

  /* ============================================================
     10. DRAWERS DE RÉASSURANCE — 4 drawers latéraux droite
     Chaque badge [data-reassurance="<key>"] ouvre le drawer
     [data-reassurance-drawer="<key>"]. Un seul drawer ouvert
     à la fois ; le clic sur un autre badge ferme le précédent.
     Réutilise lockScroll, attachFocusTrap déjà en place.
     ============================================================ */
  function initReassuranceDrawers() {
    const triggers = document.querySelectorAll('[data-reassurance]');
    const drawers = document.querySelectorAll('[data-reassurance-drawer]');
    const closeButtons = document.querySelectorAll('[data-reassurance-close]');
    const backdrop = document.querySelector('[data-reassurance-backdrop]');

    if (triggers.length === 0 || drawers.length === 0) return;

    // Mémorise l'élément focalisé pour le restaurer à la fermeture
    let lastFocused = null;

    function getDrawerByKey(key) {
      return document.querySelector('[data-reassurance-drawer="' + key + '"]');
    }

    function isAnyOpen() {
      return document.querySelector('[data-reassurance-drawer].is-open') !== null;
    }

    function closeAll() {
      let hadOpen = false;
      drawers.forEach(function (d) {
        if (d.classList.contains('is-open')) {
          d.classList.remove('is-open');
          d.setAttribute('aria-hidden', 'true');
          hadOpen = true;
        }
      });

      // Resynchronise aria-expanded sur tous les triggers
      triggers.forEach(function (t) { t.setAttribute('aria-expanded', 'false'); });

      if (hadOpen) {
        if (backdrop) {
          backdrop.classList.remove('is-visible');
          backdrop.setAttribute('aria-hidden', 'true');
        }
        unlockScroll();
        if (lastFocused && typeof lastFocused.focus === 'function') {
          lastFocused.focus();
        }
      }
    }

    function openDrawer(key, trigger) {
      const drawer = getDrawerByKey(key);
      if (!drawer) return;

      // Si un autre drawer est déjà ouvert, on le ferme sans
      // déverrouiller le scroll (on enchaîne directement)
      const previouslyOpen = isAnyOpen();
      drawers.forEach(function (d) {
        d.classList.remove('is-open');
        d.setAttribute('aria-hidden', 'true');
      });
      triggers.forEach(function (t) { t.setAttribute('aria-expanded', 'false'); });

      // Mémorise le trigger pour restaurer le focus
      if (!previouslyOpen) {
        lastFocused = trigger || document.activeElement;
        lockScroll();
        if (backdrop) {
          backdrop.classList.add('is-visible');
          backdrop.setAttribute('aria-hidden', 'false');
        }
      }

      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      if (trigger) trigger.setAttribute('aria-expanded', 'true');

      // Focus sur le bouton de fermeture après la transition
      const closeBtn = drawer.querySelector('[data-reassurance-close]');
      if (closeBtn) setTimeout(function () { closeBtn.focus(); }, 100);
    }

    triggers.forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        openDrawer(trigger.dataset.reassurance, trigger);
      });
    });

    closeButtons.forEach(function (btn) {
      btn.addEventListener('click', closeAll);
    });

    if (backdrop) {
      backdrop.addEventListener('click', closeAll);
    }

    // Touche Échap
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isAnyOpen()) {
        event.preventDefault();
        closeAll();
      }
    });

    // Focus trap sur chaque drawer
    drawers.forEach(function (drawer) {
      attachFocusTrap(drawer, function () {
        return drawer.classList.contains('is-open');
      });
    });
  }

  /* ============================================================
     11. CURSEUR DIRECTIONNEL — galerie produit phare desktop
     Cercle 52px qui suit la souris dans .zinor-featured__gallery-main.
     La flèche pivote selon la moitié (gauche : ← / droite : →).
     Clic gauche → image précédente, clic droite → image suivante.
     Désactivé sur écrans tactiles (pointer: coarse).
     ============================================================ */
  function initFeaturedProductCursor() {
    const galleries = document.querySelectorAll('[data-featured-gallery]');
    if (galleries.length === 0) return;

    // Pas de curseur custom sur les écrans tactiles
    if (window.matchMedia('(pointer: coarse)').matches) return;

    galleries.forEach(function (gallery) {
      const main = gallery.querySelector('.zinor-featured__gallery-main');
      const images = Array.from(gallery.querySelectorAll('[data-featured-image]'));
      const dots = Array.from(gallery.querySelectorAll('[data-featured-dot]'));

      // Pas de curseur si une seule image ou pas de dots (rien à naviguer)
      if (!main || images.length <= 1 || dots.length === 0) return;

      // Création du curseur — flèche ← par défaut (pivote sur la moitié droite)
      const cursor = document.createElement('div');
      cursor.className = 'zinor-featured__cursor';
      cursor.setAttribute('aria-hidden', 'true');
      cursor.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="20" y1="12" x2="4" y2="12"/><polyline points="10 18 4 12 10 6"/></svg>';
      main.appendChild(cursor);

      function getActiveIndex() {
        for (let i = 0; i < images.length; i++) {
          if (images[i].classList.contains('is-active')) return i;
        }
        return 0;
      }

      function navigate(direction) {
        const current = getActiveIndex();
        let next = current + direction;
        if (next < 0) next = images.length - 1;
        if (next >= images.length) next = 0;
        // Réutilise la logique existante d'initFeaturedGallery via le clic
        dots[next].click();
      }

      // Suit la souris en continu ; bascule .is-right selon la moitié
      main.addEventListener('mousemove', function (event) {
        const rect = main.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        cursor.style.left = x + 'px';
        cursor.style.top = y + 'px';
        cursor.classList.toggle('is-right', x > rect.width / 2);
      });

      main.addEventListener('mouseenter', function () {
        cursor.classList.add('is-visible');
      });

      main.addEventListener('mouseleave', function () {
        cursor.classList.remove('is-visible');
      });

      // Clic sur la zone image → navigation prev/suivant selon la moitié
      main.addEventListener('click', function (event) {
        const rect = main.getBoundingClientRect();
        const x = event.clientX - rect.left;
        navigate(x > rect.width / 2 ? 1 : -1);
      });
    });
  }

  /* ============================================================
     12. INITIALISATION — au chargement du DOM
     ============================================================ */
  function init() {
    initScrollAnimations();
    initStickyHeader();
    initStockCounter();
    initProductGallery();
    initProductCursor();
    initProductZoom();
    initFeaturedGallery();
    initAccordion();
    initStickyATC();
    initMobileMenu();
    initSearchOverlay();
    initAccountDrawer();
    initReassuranceDrawers();
    initFeaturedProductCursor();
  }

  // On lance dès que possible — DOMContentLoaded ou immédiatement si déjà chargé
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
