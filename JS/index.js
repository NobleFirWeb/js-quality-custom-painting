

window.addEventListener('scroll', () => {
    const stickyNavbar = document.querySelector('.sticky-navbar');
    const mobileIcon = document.querySelector('.mobile-menu-icon');
    const aboutTop = document.querySelector('#about').offsetTop;

    if (window.scrollY >= aboutTop) {
        stickyNavbar.classList.add('active');
        mobileIcon.classList.add('scrolled');
    } else {
        stickyNavbar.classList.remove('active');
        mobileIcon.classList.remove('scrolled');
    }
});



// Smooth Scroll to Section Button
function scrollToSection() {
    const nextSection = document.getElementById('about');
    if (nextSection) {
        nextSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function openMobileMenu() {
    document.getElementById('mobileMenu').classList.add('open');
}

function closeMobileMenu() {
    document.getElementById('mobileMenu').classList.remove('open');
}


// Rise Animations
const riseElements = document.querySelectorAll("[data-rise='true']");
const riseObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            riseObserver.unobserve(entry.target);
        }
    });
    },
    { threshold: 0.5 }
);

riseElements.forEach((el) => {
    if (!el.closest(".hero-content")) riseObserver.observe(el);
});

window.addEventListener('DOMContentLoaded', () => {
    const heroTitle = document.getElementById('hero-title');
    if (heroTitle) {
        heroTitle.classList.add('visible');
    }
});


// Slide Animations
const slideElements = document.querySelectorAll('[slide-right="true"], [slide-left="true"]');

// Create observer
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target); // stop observing once revealed
        }
    });
}, {
    threshold: 0.2 // trigger when 20% visible
});

// Observe each slide element
slideElements.forEach(el => observer.observe(el));
