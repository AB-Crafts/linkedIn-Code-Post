// =========================================
// PushToPost Landing Page JavaScript
// =========================================

// Utility function for smooth scroll
function smoothScroll(target) {
    const element = document.querySelector(target);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Theme Toggle Functionality
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// Check for saved theme preference or default to dark theme
const currentTheme = localStorage.getItem('theme') || 'dark';
if (currentTheme === 'light') {
    body.classList.add('light-theme');
}

// Theme toggle click handler
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('light-theme');

        // Save preference to localStorage
        const theme = body.classList.contains('light-theme') ? 'light' : 'dark';
        localStorage.setItem('theme', theme);

        // Add a subtle animation effect
        themeToggle.style.transform = 'rotate(360deg)';
        setTimeout(() => {
            themeToggle.style.transform = '';
        }, 300);
    });
}

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = this.getAttribute('href');
        smoothScroll(target);
    });
});

// Mobile menu toggle
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navLinks = document.querySelector('.nav-links');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        mobileMenuToggle.classList.toggle('active');
    });
}

// =========================================
// Supabase Configuration
// =========================================
// IMPORTANT: Replace these with your actual Supabase credentials
// You can find these in your Supabase project settings under API
const SUPABASE_URL = 'https://tmvwqggielmjjiqdlskb.supabase.co'; // Example: https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtdndxZ2dpZWxtamppcWRsc2tiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MzE1MTEsImV4cCI6MjA4MTEwNzUxMX0.i61GxVwChMI1kG-gft-oSU515DjXvo_pQhNEpmlpurY'; // Your public anon key

// Initialize Supabase client
let supabase = null;

// Check if Supabase credentials are configured
if (SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.includes('supabase.co')) {
    try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase initialized successfully');
    } catch (error) {
        console.error('❌ Supabase initialization error:', error);
    }
} else {
    console.warn('⚠️ Supabase credentials not configured. Please update SUPABASE_URL and SUPABASE_ANON_KEY in script.js');
}

// Function to update waitlist count
async function updateWaitlistCount() {
    console.log('🔄 Attempting to update waitlist count...');
    if (!supabase) {
        console.error('❌ Supabase client not initialized within updateWaitlistCount');
        return;
    }
    
    try {
        const { count, error } = await supabase
            .from('waitlist')
            .select('*', { count: 'exact', head: true });
            
        if (error) {
            console.error('❌ Supabase error fetching count:', error);
            return;
        }

        console.log('✅ Fetched count:', count);

        if (count !== null) {
            const element = document.getElementById('waitlist-count');
            if (element) {
                console.log('✅ Found element, updating text from', element.textContent, 'to', count.toLocaleString() + '+');
                
                // If count is less than 100, we might want to show a higher "marketing" number
                // But per user request, we are showing dynamic count. 
                // Let's format it.
                element.textContent = count.toLocaleString() + '+';
                
                // Update data attribute for animation if it hasn't run yet
                if (!element.dataset.animated) {
                    element.textContent = count.toLocaleString() + '+';
                }
            } else {
                console.error('❌ Element "waitlist-count" not found in DOM');
            }
        }
    } catch (err) {
        console.error('Error fetching waitlist count:', err);
    }
}

// Update count on load
// Update count on load - moved to window load event
// if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', updateWaitlistCount);
// } else {
//     updateWaitlistCount();
// }

// =========================================
// Form submission handling with Supabase + Web3Forms
// =========================================
const signupForm = document.getElementById('signupForm');
const successMessage = document.getElementById('successMessage');

if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(signupForm);
        const email = formData.get('email');
        const submitButton = signupForm.querySelector('button[type="submit"]');
        const buttonText = submitButton.innerHTML;

        // Show loading state
        submitButton.innerHTML = `
            <svg class="button-icon animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.25"/>
                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor"/>
            </svg>
            Submitting...
        `;
        submitButton.disabled = true;

        let supabaseSuccess = false;
        let web3formsSuccess = false;

        try {
            // 1. Store in Supabase first
            if (supabase) {
                try {
                    const { data, error } = await supabase
                        .from('waitlist')
                        .insert([
                            {
                                email: email,
                                created_at: new Date().toISOString(),
                                source: 'landing_page'
                            }
                        ])
                        .select();

                    if (error) {
                        // Check if it's a duplicate email error (409 Conflict or PostgreSQL 23505)
                        if (error.code === '23505' || error.status === 409 || error.message?.includes('duplicate') || error.message?.includes('already exists')) {
                            console.log('✅ Email already exists in waitlist - skipping duplicate');
                            supabaseSuccess = true; // Still consider it a success
                        } else {
                            throw error;
                        }
                    } else {
                        console.log('✅ Email stored in Supabase:', data);
                        supabaseSuccess = true;

                        // 1.1 Trigger welcome email via Edge Function
                        console.log('📨 Triggering welcome email...');
                        const { data: funcData, error: funcError } = await supabase.functions.invoke('send-waitlist-email', {
                            body: { email: email }
                        });

                        if (funcError) {
                            console.error('⚠️ Failed to send welcome email:', funcError);
                            // Try to log the breakdown of the error
                            if (funcError && typeof funcError === 'object' && 'context' in funcError) {
                                funcError.context.text().then(text => {
                                    console.error('❌ Edge Function Error Body:', text);
                                }).catch(e => console.error('Could not read error body', e));
                            }
                        } else {
                            console.log('✅ Welcome email sent:', funcData);
                        }

                        // Update the count dynamically
                        updateWaitlistCount();
                    }
                } catch (supabaseError) {
                    console.error('❌ Supabase error:', supabaseError);
                    // Continue with Web3Forms even if Supabase fails
                }
            }

            // 2. Send via Web3Forms (for email notification)
            try {
                const response = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.success) {
                    console.log('✅ Email sent via Web3Forms');
                    web3formsSuccess = true;
                } else {
                    console.error('❌ Web3Forms error:', data);
                }
            } catch (web3Error) {
                console.error('❌ Web3Forms fetch error:', web3Error);
            }

            // Show success if at least one method worked
            if (supabaseSuccess || web3formsSuccess) {
                // Show success message
                signupForm.style.display = 'none';
                successMessage.classList.add('active');

                // Reset form after delay
                setTimeout(() => {
                    signupForm.style.display = 'flex';
                    successMessage.classList.remove('active');
                    signupForm.reset();
                    submitButton.innerHTML = buttonText;
                    submitButton.disabled = false;
                }, 5000);
            } else {
                throw new Error('Both submission methods failed');
            }

        } catch (error) {
            console.error('Error:', error);
            alert('Something went wrong. Please try again.');
            submitButton.innerHTML = buttonText;
            submitButton.disabled = false;
        }
    });
}

// GitHub OAuth button
const githubAuthButton = document.getElementById('githubAuthButton');

if (githubAuthButton) {
    githubAuthButton.addEventListener('click', () => {
        // In production, this would redirect to GitHub OAuth flow
        // For demo purposes, we'll just show an alert
        alert('GitHub OAuth integration would be implemented here. This would redirect to GitHub for authentication.');

        // Example OAuth URL (replace with your actual OAuth setup):
        // window.location.href = 'https://github.com/login/oauth/authorize?client_id=YOUR_CLIENT_ID&scope=user:email';
    });
}

// Intersection Observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const animateOnScroll = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all feature cards, testimonials, and step items
document.addEventListener('DOMContentLoaded', () => {
    const elementsToAnimate = [
        ...document.querySelectorAll('.feature-card'),
        ...document.querySelectorAll('.testimonial-card'),
        ...document.querySelectorAll('.step-item'),
        ...document.querySelectorAll('.platform-badge')
    ];

    elementsToAnimate.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        animateOnScroll.observe(el);
    });
});

// Counter animation for stats
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16); // 60fps

    const updateCounter = () => {
        start += increment;
        if (start < target) {
            element.textContent = Math.floor(start).toLocaleString() + '+';
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target.toLocaleString() + '+';
        }
    };

    updateCounter();
}

// Animate counters when they come into view
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
            const value = entry.target.textContent.replace(/[^0-9]/g, '');
            animateCounter(entry.target, parseInt(value), 2000);
            entry.target.dataset.animated = 'true';
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-value').forEach(stat => {
    statsObserver.observe(stat);
});

// Parallax effect for gradient orbs
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const orbs = document.querySelectorAll('.gradient-orb');

    orbs.forEach((orb, index) => {
        const speed = 0.1 + (index * 0.05);
        orb.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

// Add hover effect to platform badges
document.querySelectorAll('.platform-badge').forEach(badge => {
    badge.addEventListener('mouseenter', function () {
        this.style.transform = 'translateY(-4px) scale(1.05)';
    });

    badge.addEventListener('mouseleave', function () {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Easter egg: Konami code
let konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiIndex = 0;

document.addEventListener('keydown', (e) => {
    if (e.key === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
            // Activate party mode!
            document.body.style.animation = 'hueRotate 3s linear infinite';
            setTimeout(() => {
                document.body.style.animation = '';
            }, 10000);
            konamiIndex = 0;
        }
    } else {
        konamiIndex = 0;
    }
});

// Add hue rotate animation for easter egg
const style = document.createElement('style');
style.textContent = `
    @keyframes hueRotate {
        0% { filter: hue-rotate(0deg); }
        100% { filter: hue-rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Preload images and optimize performance
window.addEventListener('load', () => {
    // Remove any loading states
    document.body.classList.add('loaded');

    // Log to console for debugging
    console.log('%c🚀 PushToPost Landing Page Loaded!', 'color: #3b82f6; font-size: 20px; font-weight: bold;');
    console.log('%cLaunching January 1, 2026', 'color: #8b5cf6; font-size: 14px;');

    // Update waitlist count (Global function)
    if (typeof updateWaitlistCount === 'function') {
        updateWaitlistCount();
    } else {
        console.error('❌ updateWaitlistCount function not found');
    }
});

// Form validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

const emailInput = document.getElementById('email');
if (emailInput) {
    emailInput.addEventListener('blur', function () {
        if (this.value && !validateEmail(this.value)) {
            this.style.borderColor = '#ef4444';
            this.setCustomValidity('Please enter a valid email address');
        } else {
            this.style.borderColor = '';
            this.setCustomValidity('');
        }
    });
}

// Copy to clipboard functionality (for future use)
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        console.log('Copied to clipboard:', text);
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

// Keyboard navigation enhancement
document.addEventListener('keydown', (e) => {
    // Escape key to close mobile menu
    if (e.key === 'Escape' && navLinks && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
        mobileMenuToggle.classList.remove('active');
    }
});

// Performance monitoring (optional)
if ('PerformanceObserver' in window) {
    const perfObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            if (entry.entryType === 'largest-contentful-paint') {
                console.log('LCP:', entry.startTime);
            }
        }
    });

    perfObserver.observe({ entryTypes: ['largest-contentful-paint'] });
}

// Add loading states for buttons
document.querySelectorAll('button, .cta-button').forEach(button => {
    button.addEventListener('click', function () {
        // Add ripple effect
        const ripple = document.createElement('span');
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(255, 255, 255, 0.5)';
        ripple.style.width = ripple.style.height = '100px';
        ripple.style.left = '50%';
        ripple.style.top = '50%';
        ripple.style.transform = 'translate(-50%, -50%) scale(0)';
        ripple.style.animation = 'ripple 0.6s ease-out';
        ripple.style.pointerEvents = 'none';

        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    });
});

// Add ripple animation
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    @keyframes ripple {
        to {
            transform: translate(-50%, -50%) scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyle);

// Service worker registration (for future PWA support)
if ('serviceWorker' in navigator) {
    // Uncomment when you have a service worker file
    // navigator.serviceWorker.register('/sw.js').then(registration => {
    //     console.log('Service Worker registered:', registration);
    // }).catch(error => {
    //     console.log('Service Worker registration failed:', error);
    // });
}

console.log('%cDeveloped with ❤️ for developers by developers', 'color: #10b981; font-style: italic;');
