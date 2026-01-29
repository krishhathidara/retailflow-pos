document.addEventListener('DOMContentLoaded', () => {
    // 1. Check if we are in "Sign Up" mode (from the URL link)
    const params = new URLSearchParams(window.location.search);
    const isSignup = params.get('mode') === 'signup';
    
    if (isSignup) {
        toggleAuthMode(true);
    }

    // 2. Handle Login Form Submission
    const authForm = document.getElementById('authForm');
    if (authForm) {
        authForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Stop page from refreshing
            
            const btn = authForm.querySelector('button[type="submit"]');
            const originalText = btn.innerText;
            
            // Show loading animation
            btn.innerHTML = 'Processing...';
            btn.disabled = true;
            btn.style.opacity = '0.8';

            // Fake login delay -> Redirect to Dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        });
    }

    // 3. Toggle between "Sign In" and "Sign Up" text
    const toggleLink = document.getElementById('toggleAuth');
    if (toggleLink) {
        toggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            const currentTitle = document.getElementById('pageTitle').innerText;
            const isCurrentlySignup = currentTitle === 'Create Account';
            toggleAuthMode(!isCurrentlySignup);
        });
    }
});

// Helper to switch text
function toggleAuthMode(toSignup) {
    const title = document.getElementById('pageTitle');
    const subtitle = document.getElementById('pageSubtitle');
    const btn = document.querySelector('.btn-primary');
    const switchText = document.querySelector('.switch-text');

    if (toSignup) {
        title.innerText = 'Create Account';
        subtitle.innerText = 'Start your free trial today';
        btn.innerText = 'Sign Up';
        switchText.innerHTML = 'Already have an account? <a href="#" id="toggleAuth">Sign in</a>';
    } else {
        title.innerText = 'Welcome back';
        subtitle.innerText = 'Sign in to access your dashboard';
        btn.innerText = 'Sign In';
        switchText.innerHTML = 'Don\'t have an account? <a href="#" id="toggleAuth">Sign up</a>';
    }
    
    // Re-attach listener to the new link
    document.getElementById('toggleAuth').addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthMode(!toSignup);
    });
}