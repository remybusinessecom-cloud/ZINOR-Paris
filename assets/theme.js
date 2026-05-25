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
     4. GALERIE PRODUIT — basique
     Clic sur une miniature → met à jour l'image principale
     Structure attendue :
       [data-product-gallery]
         [data-gallery-main] <img>
         [data-gallery-thumbs]
           [data-gallery-thumb data-image-src="..."]
     ============================================================ */
  function initProductGallery() {
    const galleries = document.querySelectorAll('[data-product-gallery]');
    if (galleries.length === 0) return;

    galleries.forEach(function (gallery) {
      const mainContainer = gallery.querySelector('[data-gallery-main]');
      const mainImage = mainContainer ? mainContainer.querySelector('img') : null;
      const thumbs = gallery.querySelectorAll('[data-gallery-thumb]');

      if (!mainImage || thumbs.length === 0) return;

      // Transition CSS appliquée à l'image principale
      mainImage.style.transition = 'opacity 300ms ease, transform 400ms ease-out';

      // Fonction interne : active une miniature donnée et met à jour l'image principale
      function activate(thumb) {
        const newSrc = thumb.dataset.imageSrc;
        const newAlt = thumb.dataset.imageAlt || '';
        const newSrcset = thumb.dataset.imageSrcset || '';

        if (!newSrc) return;

        // Transition douce — fade out, swap, fade in
        mainImage.style.opacity = '0';
        setTimeout(function () {
          mainImage.src = newSrc;
          mainImage.alt = newAlt;
          if (newSrcset) mainImage.srcset = newSrcset;
          mainImage.style.opacity = '1';
        }, 200);

        // Mise à jour de l'état actif sur TOUTES les miniatures
        // (synchronise les deux jeux : thumbs desktop + dots mobile via data-image-index)
        const activeIndex = thumb.dataset.imageIndex;
        thumbs.forEach(function (t) {
          const isMatch = activeIndex != null && t.dataset.imageIndex === activeIndex;
          if (isMatch || t === thumb) {
            t.classList.add('is-active');
            t.setAttribute('aria-selected', 'true');
          } else {
            t.classList.remove('is-active');
            t.setAttribute('aria-selected', 'false');
          }
        });
      }

      // Clic sur une miniature
      thumbs.forEach(function (thumb) {
        thumb.addEventListener('click', function (event) {
          event.preventDefault();
          activate(thumb);
        });
      });

      // Navigation clavier — flèches gauche/droite dans les listes de miniatures
      const thumbContainers = gallery.querySelectorAll('[data-gallery-thumbs], [data-gallery-dots]');
      thumbContainers.forEach(function (container) {
        container.addEventListener('keydown', function (event) {
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

          // Ne joue que sur les miniatures de ce container
          const localThumbs = Array.from(container.querySelectorAll('[data-gallery-thumb]'));
          const currentIndex = localThumbs.indexOf(document.activeElement);
          if (currentIndex === -1) return;

          event.preventDefault();
          let nextIndex = currentIndex;
          if (event.key === 'ArrowRight') {
            nextIndex = (currentIndex + 1) % localThumbs.length;
          } else {
            nextIndex = (currentIndex - 1 + localThumbs.length) % localThumbs.length;
          }
          localThumbs[nextIndex].focus();
          activate(localThumbs[nextIndex]);
        });
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
     7. INITIALISATION — au chargement du DOM
     ============================================================ */
  function init() {
    initScrollAnimations();
    initStickyHeader();
    initStockCounter();
    initProductGallery();
    initAccordion();
    initStickyATC();
  }

  // On lance dès que possible — DOMContentLoaded ou immédiatement si déjà chargé
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
