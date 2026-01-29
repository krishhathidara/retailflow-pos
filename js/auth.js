document.addEventListener('DOMContentLoaded', () => {
    // 1. Check URL params for "Sign Up" mode
    const params = new URLSearchParams(window.location.search);
    const isSignup = params.get('mode') === 'signup';
    
    if (isSignup) {
        toggleAuthMode(true);
    }

    // 2. Handle Form Submission (The Redirect Logic)
    const authForm = document.getElementById('authForm');
    if (authForm) {
        authForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Stop page reload
            
            const btn = authForm.querySelector('button[type="submit"]');
            const originalText = btn.innerText;
            
            // Show loading state
            btn.innerHTML = '<span class="material-icons-round spin" style="font-size:1.2rem">sync</span> Processing...';
            btn.disabled = true;
            btn.style.opacity = '0.8';

            // Simulate server delay -> Redirect to Dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        });
    }

    // 3. Handle "Sign up / Sign in" toggle link click
    const toggleLink = document.getElementById('toggleAuth');
    if (toggleLink) {
        toggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            const isCurrentlySignup = document.getElementById('pageTitle').innerText === 'Create Account';
            toggleAuthMode(!isCurrentlySignup);
        });
    }
});

// Helper to switch text between Login and Signup
function toggleAuthMode(toSignup) {
    const title = document.getElementById('pageTitle');
    const subtitle = document.getElementById('pageSubtitle');
    const btn = document.querySelector('.btn-primary');
    const toggleLink = document.getElementById('toggleAuth');
    const switchText = document.querySelector('.switch-text');

    if (toSignup) {
        title.innerText = 'Create Account';
        subtitle.innerText = 'Get started with your free trial';
        btn.innerText = 'Create Account';
        switchText.innerHTML = 'Already have an account? <a href="#" id="toggleAuth">Sign in</a>';
    } else {
        title.innerText = 'Welcome back';
        subtitle.innerText = 'Sign in to access your dashboard';
        btn.innerText = 'Sign In';
        switchText.innerHTML = 'Don\'t have an account? <a href="#" id="toggleAuth">Sign up</a>';
    }
    
    // Re-attach listener to the new link we just created in HTML
    document.getElementById('toggleAuth').addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthMode(!toSignup);
    });
}