<script lang="ts">
    import { onMount } from 'svelte';

    type ShapeDef = { shape: number[][]; color: string };

    let canvas: HTMLCanvasElement;

    onMount(() => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width: number = 0;
        let height: number = 0;
        let particles: Particle[] = [];
        let animationFrameId: number;
        let lastTime: number = 0;

        const resize = () => {
            width = canvas.offsetWidth;
            height = canvas.offsetHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener('resize', resize);
        
        const tetrominos: ShapeDef[] = [
            { shape: [[1,1,1,1]], color: '#00FFFF' },
            { shape: [[1,0,0],[1,1,1]], color: '#0066FF' },
            { shape: [[0,0,1],[1,1,1]], color: '#FF8800' },
            { shape: [[1,1],[1,1]], color: '#FFE600' },
            { shape: [[0,1,1],[1,1,0]], color: '#00FF00' },
            { shape: [[0,1,0],[1,1,1]], color: '#CC00FF' },
            { shape: [[1,1,0],[0,1,1]], color: '#FF0033' }
        ];

        class Particle {
            x: number;
            y: number;
            size: number;
            speed: number;
            shape: number[][];
            color: string;
            rotation: number;
            rotationSpeed: number;
            maxClearance: number;

            constructor(initialSpawn: boolean = false) {
                this.size = Math.random() * 15 + 12;
                this.x = Math.random() * width;
                
                const type = tetrominos[Math.floor(Math.random() * tetrominos.length)];
                this.shape = type.shape;
                this.color = type.color;
                
                this.speed = Math.random() * 0.1 + 0.05;
                this.rotation = Math.random() * Math.PI * 2;
                this.rotationSpeed = (Math.random() - 0.5) * 0.002;

                this.maxClearance = Math.max(this.shape.length, this.shape[0].length) * this.size;
                
                if (initialSpawn) {
                    this.y = -(Math.random() * height * 1.5) - this.maxClearance;
                } else {
                    this.y = -this.maxClearance - (Math.random() * 100);
                }
            }

            update(dt: number): void {
                this.y += this.speed * dt;
                this.rotation += this.rotationSpeed * dt;

                if (this.y > height + this.maxClearance) {
                    Object.assign(this, new Particle(false));
                }
            }

            draw(ctx: CanvasRenderingContext2D): void {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);

                const cols = this.shape[0].length;
                const rows = this.shape.length;
                ctx.translate(-(cols * this.size) / 2, -(rows * this.size) / 2);
                
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        if (this.shape[r][c]) {
                            const blockX = c * this.size;
                            const blockY = r * this.size;

                            ctx.fillStyle = this.color;
                            ctx.globalAlpha = 0.6;
                            ctx.shadowBlur = 10;
                            ctx.shadowColor = this.color;
                            ctx.fillRect(blockX, blockY, this.size, this.size);

                            ctx.globalAlpha = 1.0;
                            ctx.shadowBlur = 0;
                            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                            ctx.lineWidth = 1.5;
                            ctx.strokeRect(blockX, blockY, this.size, this.size);

                            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                            ctx.lineWidth = 1;
                            ctx.strokeRect(blockX + 2, blockY + 2, this.size - 4, this.size - 4);
                        }
                    }
                }
                ctx.restore();
            }
        }

        function initParticles(): void {
            particles = [];
            const count = Math.floor(window.innerWidth / 60);
            for (let i = 0; i < count; i++) {
                particles.push(new Particle(true));
            }
        }

        function draw(time: number): void {
            if (!ctx) return;
            if (!lastTime) lastTime = time;
            
            const dt = time - lastTime;
            lastTime = time;

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