document.addEventListener('DOMContentLoaded', () => {
    
    // 1. READ URL PARAMETERS
    // This looks at the browser address bar for "?mode=signup"
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');

    // 2. CHECK IF WE SHOULD BE ON SIGN UP PAGE
    if (mode === 'signup') {
        console.log("Signup Mode Detected"); // Debug Check
        toggleToSignup();
    } else {
        console.log("Login Mode Detected");
    }

    // 3. HANDLE TOGGLE LINK CLICK (The text at the bottom)
    const toggleLink = document.getElementById('toggleAuth');
    if (toggleLink) {
        toggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            const title = document.getElementById('pageTitle').innerText;
            
            // If currently Login, switch to Signup. If Signup, switch to Login.
            if (title.includes('Welcome')) {
                toggleToSignup();
            } else {
                toggleToLogin();
            }
        });
    }

    // 4. HANDLE FORM SUBMISSION (Fake Login)
    const authForm = document.getElementById('authForm');
    if (authForm) {
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = document.getElementById('submitBtn');
            
            // Show loading
            btn.innerText = 'Processing...';
            btn.style.opacity = '0.7';
            btn.disabled = true;

            // Wait 1 second then go to Dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        });
    }
});

// --- HELPER FUNCTIONS TO SWAP TEXT ---

function toggleToSignup() {
    // Change Title & Subtitle
    document.getElementById('pageTitle').innerText = 'Create Account';
    document.getElementById('pageSubtitle').innerText = 'Start your 14-day free trial';
    
    // Change Button Text
    document.getElementById('submitBtn').innerText = 'Create Account';
    
    // Change Bottom Link
    document.getElementById('switchLabel').innerText = 'Already have an account?';
    document.getElementById('toggleAuth').innerText = 'Sign In';

    // Update URL without reloading (so if you refresh, you stay on Sign Up)
    const url = new URL(window.location);
    url.searchParams.set('mode', 'signup');
    window.history.pushState({}, '', url);
}

function toggleToLogin() {
    // Change Title & Subtitle
    document.getElementById('pageTitle').innerText = 'Welcome back';
    document.getElementById('pageSubtitle').innerText = 'Sign in to access your dashboard';
    
    // Change Button Text
    document.getElementById('submitBtn').innerText = 'Sign In';
    
    // Change Bottom Link
    document.getElementById('switchLabel').innerText = 'Don\'t have an account?';
    document.getElementById('toggleAuth').innerText = 'Sign Up';

    // Update URL
    const url = new URL(window.location);
    url.searchParams.delete('mode');
    window.history.pushState({}, '', url);
}