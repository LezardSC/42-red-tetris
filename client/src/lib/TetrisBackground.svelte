<script lang="ts">
    import { onMount } from 'svelte';

    let canvas: HTMLCanvasElement;
    
    onMount(() => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = 0;
        let height = 0;
        let particles: Particle[] = [];
        let animationFrameId: number;

        // Ajuster la taille du canvas à son conteneur
        const resize = () => {
            width = canvas.offsetWidth;
            height = canvas.offsetHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener('resize', resize);
        
        // Formes classiques de Tetris
        const shapes = [
            [[1,1,1,1]], // I
            [[1,0,0],[1,1,1]], // J
            [[0,0,1],[1,1,1]], // L
            [[1,1],[1,1]], // O
            [[0,1,1],[1,1,0]], // S
            [[0,1,0],[1,1,1]], // T
            [[1,1,0],[0,1,1]]  // Z
        ];

        // Palette rouge/ambrée adaptée au thème sombre
        const colors = [
            'rgba(239, 68, 68, 0.25)',  // Red-500
            'rgba(185, 28, 28, 0.3)',   // Red-700
            'rgba(245, 158, 11, 0.15)', // Amber-500
            'rgba(220, 38, 38, 0.2)'    // Red-600
        ];

        class Particle {
            x: number; y: number; size: number; speed: number;
            shape: number[][]; color: string;
            rotation: number; rotationSpeed: number;

            constructor() {
                this.size = Math.random() * 12 + 10; // Taille de chaque bloc de la pièce
                this.x = Math.random() * width;
                this.y = Math.random() * height - height; // Commence plus haut
                this.speed = Math.random() * 1.5 + 0.5;
                this.shape = shapes[Math.floor(Math.random() * shapes.length)];
                this.color = colors[Math.floor(Math.random() * colors.length)];
                this.rotation = Math.random() * Math.PI * 2;
                this.rotationSpeed = (Math.random() - 0.5) * 0.03;
            }

            update() {
                this.y += this.speed;
                this.rotation += this.rotationSpeed;

                // Reset quand la pièce sort de l'écran en bas
                if (this.y > height + this.size * 5) {
                    this.y = -this.size * 5;
                    this.x = Math.random() * width;
                }
            }

            draw(ctx: CanvasRenderingContext2D) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                
                ctx.fillStyle = this.color;
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                ctx.lineWidth = 1;

                const cols = this.shape[0].length;
                const rows = this.shape.length;
                // Centrer le point de rotation
                ctx.translate(-(cols * this.size) / 2, -(rows * this.size) / 2);

                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        if (this.shape[r][c]) {
                            ctx.fillRect(c * this.size, r * this.size, this.size, this.size);
                            ctx.strokeRect(c * this.size, r * this.size, this.size, this.size);
                        }
                    }
                }
                ctx.restore();
            }
        }

        function initParticles() {
            particles = [];
            const count = Math.floor(window.innerWidth / 40); // Densité des pièces
            for (let i = 0; i < count; i++) {
                let p = new Particle();
                p.y = Math.random() * height; // Éparpiller dès le début
                particles.push(p);
            }
        }

        function draw() {
            if (!ctx) return;

            ctx.clearRect(0, 0, width, height);
            particles.forEach(p => {
                p.update();
                p.draw(ctx);
            });
            animationFrameId = requestAnimationFrame(draw);
        }

        setTimeout(() => { resize(); initParticles(); draw(); }, 0);

        // Nettoyage lors de la destruction du composant
        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    });
</script>

<canvas
    bind:this={canvas}
    class="absolute inset-0 w-full h-full pointer-events-none"
></canvas>
