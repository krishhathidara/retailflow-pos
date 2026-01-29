document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('authForm');
    const toggleAuth = document.getElementById('toggleAuth');
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');
    
    // Check URL params for mode
    const urlParams = new URLSearchParams(window.location.search);
    let isSignUp = urlParams.get('mode') === 'signup';

    function updateUI() {
        if (isSignUp) {
            pageTitle.innerText = "Create an Account";
            pageSubtitle.innerText = "Start managing your business today";
            authForm.querySelector('button').innerText = "Create Account";
            toggleAuth.innerText = "Sign In";
            // Add name field logic here if needed
        } else {
            pageTitle.innerText = "Welcome back";
            pageSubtitle.innerText = "Sign in to access your dashboard";
            authForm.querySelector('button').innerText = "Sign In";
            toggleAuth.innerText = "Sign up";
        }
    }

    updateUI();

    toggleAuth.addEventListener('click', (e) => {
        e.preventDefault();
        isSignUp = !isSignUp;
        updateUI();
    });

    authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Simulate Login
        const btn = authForm.querySelector('button');
        const originalText = btn.innerText;
        btn.innerText = "Processing...";
        btn.disabled = true;

        setTimeout(() => {
            // Redirect to dashboard
            window.location.href = "dashboard.html";
        }, 1000);
    });
});