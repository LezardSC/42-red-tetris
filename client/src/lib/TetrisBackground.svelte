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
        let lastTime = 0;

        const resize = () => {
            width = canvas.offsetWidth;
            height = canvas.offsetHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener('resize', resize);
        
        // Association des 7 formes officielles à des couleurs néon
        const tetrominos = [
            { shape: [[1,1,1,1]], color: '#00FFFF' }, // I - Cyan
            { shape: [[1,0,0],[1,1,1]], color: '#0066FF' }, // J - Bleu vif
            { shape: [[0,0,1],[1,1,1]], color: '#FF8800' }, // L - Orange
            { shape: [[1,1],[1,1]], color: '#FFE600' }, // O - Jaune
            { shape: [[0,1,1],[1,1,0]], color: '#00FF00' }, // S - Vert
            { shape: [[0,1,0],[1,1,1]], color: '#CC00FF' }, // T - Violet
            { shape: [[1,1,0],[0,1,1]], color: '#FF0033' }  // Z - Rouge néon
        ];

        class Particle {
            x: number; y: number; size: number; speed: number;
            shape: number[][]; color: string;
            rotation: number; rotationSpeed: number;
            maxClearance: number;

            constructor(initialSpawn = false) {
                this.size = Math.random() * 15 + 12; // Taille des blocs un peu plus grande
                this.x = Math.random() * width;
                
                const type = tetrominos[Math.floor(Math.random() * tetrominos.length)];
                this.shape = type.shape;
                this.color = type.color;
                
                this.speed = Math.random() * 0.1 + 0.05; // Vitesse de base (ajustée pour le delta time)
                this.rotation = Math.random() * Math.PI * 2;
                this.rotationSpeed = (Math.random() - 0.5) * 0.002;

                // Calculer l'encombrement max de la pièce pour les sorties d'écran
                this.maxClearance = Math.max(this.shape.length, this.shape[0].length) * this.size;

                if (initialSpawn) {
                    // Au démarrage, on répartit les pièces très haut au-dessus de l'écran
                    this.y = -(Math.random() * height * 1.5) - this.maxClearance;
                } else {
                    // Quand une pièce meurt en bas, elle respawn juste au-dessus
                    this.y = -this.maxClearance - (Math.random() * 100);
                }
            }

            update(dt: number) {
                // Utilisation du delta time pour une fluidité parfaite
                this.y += this.speed * dt;
                this.rotation += this.rotationSpeed * dt;

                // Reset propre quand la pièce est totalement sortie en bas
                if (this.y > height + this.maxClearance) {
                    // On recrée une nouvelle pièce au-dessus
                    Object.assign(this, new Particle(false));
                }
            }

            draw(ctx: CanvasRenderingContext2D) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);

                const cols = this.shape[0].length;
                const rows = this.shape.length;
                
                // Centrer le point de rotation
                ctx.translate(-(cols * this.size) / 2, -(rows * this.size) / 2);

                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        if (this.shape[r][c]) {
                            const blockX = c * this.size;
                            const blockY = r * this.size;

                            // 1. Lueur néon et fond
                            ctx.fillStyle = this.color;
                            ctx.globalAlpha = 0.6; // Légère transparence pour ne pas agresser l'œil
                            ctx.shadowBlur = 10;
                            ctx.shadowColor = this.color;
                            ctx.fillRect(blockX, blockY, this.size, this.size);

                            // 2. Démarcation forte (contour des carrés)
                            ctx.globalAlpha = 1.0;
                            ctx.shadowBlur = 0; // Désactiver l'ombre pour les lignes
                            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                            ctx.lineWidth = 1.5;
                            ctx.strokeRect(blockX, blockY, this.size, this.size);

                            // 3. Petit effet "biseau" arcade à l'intérieur
                            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                            ctx.lineWidth = 1;
                            ctx.strokeRect(blockX + 2, blockY + 2, this.size - 4, this.size - 4);
                        }
                    }
                }
                ctx.restore();
            }
        }

        function initParticles() {
            particles = [];
            // Densité ajustée pour ne pas surcharger visuellement
            const count = Math.floor(window.innerWidth / 60); 
            for (let i = 0; i < count; i++) {
                particles.push(new Particle(true));
            }
        }

        function draw(time: number) {
            if (!ctx) return;

            // Calcul du Delta Time
            if (!lastTime) lastTime = time;
            const dt = time - lastTime;
            lastTime = time;

            // Plafond du dt pour éviter que les pièces sautent si l'onglet est inactif
            const safeDt = Math.min(dt, 50);

            ctx.clearRect(0, 0, width, height);
            
            particles.forEach(p => {
                p.update(safeDt);
                p.draw(ctx);
            });
            
            animationFrameId = requestAnimationFrame(draw);
        }

        setTimeout(() => { 
            resize(); 
            initParticles(); 
            animationFrameId = requestAnimationFrame(draw); 
        }, 0);

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    });
</script>

<canvas
    bind:this={canvas}
    class="fixed inset-0 w-full h-full pointer-events-none z-[-1]"
></canvas>