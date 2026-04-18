// ========================================
// INDIAN WEB - 3D Effects & Animations
// ========================================

// Particle Background Effect
function initParticles() {
    const canvas = document.createElement('canvas');
    canvas.id = 'particles-bg';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '-1';
    document.body.insertBefore(canvas, document.body.firstChild);
    
    const ctx = canvas.getContext('2d');
    let particles = [];
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    function createParticles() {
        const particleCount = 100;
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 3 + 1,
                color: `rgba(255, 107, 53, ${Math.random() * 0.5})`,
                velocityX: (Math.random() - 0.5) * 0.5,
                velocityY: (Math.random() - 0.5) * 0.5
            });
        }
    }
    
    function drawParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(particle => {
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fillStyle = particle.color;
            ctx.fill();
            
            particle.x += particle.velocityX;
            particle.y += particle.velocityY;
            
            if (particle.x < 0 || particle.x > canvas.width) particle.velocityX *= -1;
            if (particle.y < 0 || particle.y > canvas.height) particle.velocityY *= -1;
        });
        requestAnimationFrame(drawParticles);
    }
    
    window.addEventListener('resize', () => {
        resizeCanvas();
        particles = [];
        createParticles();
    });
    
    resizeCanvas();
    createParticles();
    drawParticles();
}

// 3D Tilt Effect on Cards
function initTiltEffect() {
    const cards = document.querySelectorAll('.card-3d');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
        });
    });
}

// Scroll Reveal Animation
function initScrollReveal() {
    const elements = document.querySelectorAll('.section-animate');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    elements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(50px)';
        el.style.transition = 'all 0.8s ease';
        observer.observe(el);
    });
}

// RGB Gradient Animation on Scroll
function initGradientScroll() {
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        const progress = scrollY / maxScroll;
        const hue = 360 * progress;
        document.body.style.background = `linear-gradient(135deg, 
            hsl(${hue}, 80%, 10%), 
            hsl(${hue + 60}, 80%, 15%))`;
    });
}

// 3D Text Effect
function init3DText() {
    const texts = document.querySelectorAll('.text-3d');
    texts.forEach(text => {
        text.addEventListener('mousemove', (e) => {
            const rect = text.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            const tiltX = (x - 0.5) * 20;
            const tiltY = (y - 0.5) * 20;
            text.style.transform = `perspective(500px) rotateX(${tiltY}deg) rotateY(${tiltX}deg)`;
        });
        
        text.addEventListener('mouseleave', () => {
            text.style.transform = 'perspective(500px) rotateX(0deg) rotateY(0deg)';
        });
    });
}

// Initialize all effects when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initTiltEffect();
    initScrollReveal();
    init3DText();
    // initGradientScroll(); // Uncomment if desired
});
