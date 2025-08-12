import { supabaseClient } from '../supabaseinit.js'; // Import Supabase client

// Function to check session and redirect if logged in
async function checkSessionAndRedirect() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        // If a session exists, redirect to the app
        console.log('User already logged in, redirecting to app...');
        window.location.href = '/app.html'; // Use relative path
    } else {
        console.log('No active session found.');
        // Initialize landing page features only if not redirecting
        initializeLandingPageFeatures();
    }
}

// Function to initialize all landing page specific JS
function initializeLandingPageFeatures() {
    console.log('Initializing landing page features.');
    // Mouse-based rotation for hero section image
    const heroImageContainer = document.querySelector('.hero-image'); // Target the container div

    if (heroImageContainer) { // Check for the container
        const maxRotation = 6; // Max rotation angle in degrees (Reduced from 15)
        let rotateX = 0;
        let rotateY = 0;
        let rafId = null;

        const updateTransform = () => {
            heroImageContainer.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(30px)`;
            rafId = null; // Reset ID after execution
        };

        heroImageContainer.addEventListener('mousemove', (e) => {
            const rect = heroImageContainer.getBoundingClientRect();
            const x = e.clientX - rect.left; // Mouse X relative to element
            const y = e.clientY - rect.top;  // Mouse Y relative to element

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // Calculate new rotation values
            const newRotateX = ((y - centerY) / centerY) * -maxRotation;
            const newRotateY = ((x - centerX) / centerX) * maxRotation;

            // Update stored values
            rotateX = newRotateX;
            rotateY = newRotateY;

            // Request animation frame if not already requested
            if (rafId === null) {
                rafId = requestAnimationFrame(updateTransform);
            }
        });

        heroImageContainer.addEventListener('mouseleave', () => {
            // Cancel any pending animation frame
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            // Reset rotation values
            rotateX = 0;
            rotateY = 0;
            // Request one final frame to apply the reset smoothly
            rafId = requestAnimationFrame(updateTransform);
        });
    }

    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        const icon = question.querySelector('i'); // Assuming an icon exists for toggle state

        question.addEventListener('click', () => {
            const isOpen = answer.style.maxHeight && answer.style.maxHeight !== '0px';

            // Close all other answers
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.querySelector('.faq-answer').style.maxHeight = '0px';
                    otherItem.querySelector('.faq-question i').classList.remove('fa-chevron-up');
                    otherItem.querySelector('.faq-question i').classList.add('fa-chevron-down');
                    otherItem.classList.remove('active');
                }
            });

            // Toggle current answer
            if (isOpen) {
                answer.style.maxHeight = '0px';
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
                item.classList.remove('active');
            } else {
                answer.style.maxHeight = (answer.scrollHeight + 20) + 'px';
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
                item.classList.add('active');
            }
        });
    });

    // Smooth Scrolling for internal links
    const navLinks = document.querySelectorAll('header nav a[href^="#"]'); // Adjust selector if needed

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent default anchor jump
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start' // Adjust alignment if necessary
                });
            }
        });
    });

    // Change header style on scroll
    const header = document.querySelector('header'); // Adjust selector if needed
    const scrollThreshold = 50; // Pixels to scroll before changing header

    window.addEventListener('scroll', () => {
        if (window.scrollY > scrollThreshold) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Add any other landing page specific JavaScript here
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    // Check session status first
    checkSessionAndRedirect();
    // Note: initializeLandingPageFeatures() is now called inside checkSessionAndRedirect
    // if the user is not logged in.
});
