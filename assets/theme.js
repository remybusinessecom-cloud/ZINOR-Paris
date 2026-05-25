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

      thumbs.forEach(function (thumb) {
        thumb.addEventListener('click', function (event) {
          event.preventDefault();

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

          // Mise à jour de l'état actif sur les miniatures
          thumbs.forEach(function (t) { t.classList.remove('is-active'); });
          thumb.classList.add('is-active');
        });
      });

      // Transition CSS appliquée à l'image principale
      mainImage.style.transition = 'opacity 200ms ease';
    });
  }

  /* ============================================================
     5. INITIALISATION — au chargement du DOM
     ============================================================ */
  function init() {
    initScrollAnimations();
    initStickyHeader();
    initStockCounter();
    initProductGallery();
  }

  // On lance dès que possible — DOMContentLoaded ou immédiatement si déjà chargé
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
