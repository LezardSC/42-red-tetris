<script lang="ts">
    import { onMount } from 'svelte';

    type ShapeDef = { shape: number[][]; color: string };
    type BlockDef = { row: number; col: number };
    type ParticleObj = {
        id: number;
        x: number;
        y: number;
        size: number;
        speed: number;
        color: string;
        rotation: number;
        rotationSpeed: number;
        maxClearance: number;
        cols: number;
        rows: number;
        blocks: BlockDef[];
    };

    let width = $state(0);
    let height = $state(0);
    let particles = $state<ParticleObj[]>([]);
    let animationFrameId: number;
    let lastTime: number = 0;

    const tetrominos: ShapeDef[] = [
        { shape: [[1,1,1,1]], color: '#00FFFF' },
        { shape: [[1,0,0],[1,1,1]], color: '#0066FF' },
        { shape: [[0,0,1],[1,1,1]], color: '#FF8800' },
        { shape: [[1,1],[1,1]], color: '#FFE600' },
        { shape: [[0,1,1],[1,1,0]], color: '#00FF00' },
        { shape: [[0,1,0],[1,1,1]], color: '#CC00FF' },
        { shape: [[1,1,0],[0,1,1]], color: '#FF0033' }
    ];

    function createParticle(initialSpawn: boolean, id: number, w: number, h: number): ParticleObj {
        const size = Math.random() * 15 + 12;
        const x = Math.random() * w;
        const type = tetrominos[Math.floor(Math.random() * tetrominos.length)];
        const { shape, color } = type;
        const rows = shape.length;
        const cols = shape[0].length;
        
        const blocks: BlockDef[] = [];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (shape[r][c]) blocks.push({ row: r, col: c });
            }
        }

        // calculate max clearance based on the largest possible distance a piece can fall before being recycled
        const maxClearance = Math.max(rows, cols) * size;
        // If it's the initial spawn, we want to start them above the screen with a random offset. Otherwise, they start just above the top edge.
        const y = initialSpawn 
            ? -(Math.random() * h * 1.5) - maxClearance 
            : -maxClearance - (Math.random() * 100);

        return {
            id, x, y, size,
            speed: Math.random() * 0.1 + 0.05,
            color,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.002,
            maxClearance, cols, rows, blocks
        };
    }

    onMount(() => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        
        particles = Array.from({ length: Math.floor(w / 60) }, (_, i) => createParticle(true, i, w, h));

        function draw(time: number) {
            if (!lastTime) lastTime = time;
            const dt = Math.min(time - lastTime, 50);
            lastTime = time;

            const w = width || window.innerWidth;
            const h = height || window.innerHeight;

            // Each particle is updated immutably to avoid direct state mutation
            particles = particles.map(p => {
                if (p.y > h + p.maxClearance) {
                    return createParticle(false, p.id, w, h);
                }
                // returning a new object to trigger Svelte's reactivity
                return { 
                    ...p, 
                    y: p.y + p.speed * dt, 
                    rotation: p.rotation + p.rotationSpeed * dt 
                };
            });
            
            animationFrameId = requestAnimationFrame(draw);
        }

        animationFrameId = requestAnimationFrame(draw);

        // Cleanup function to cancel the animation frame when the component is destroyed
        return () => cancelAnimationFrame(animationFrameId);
    });
</script>

<div class="fixed inset-0 w-full h-full pointer-events-none z-[-1] overflow-hidden" bind:clientWidth={width} bind:clientHeight={height}>
    {#each particles as p (p.id)}
        <div 
            class="tetris-piece"
            style="
                width: {p.cols * p.size}px; 
                height: {p.rows * p.size}px; 
                transform: translate({p.x - (p.cols * p.size) / 2}px, {p.y - (p.rows * p.size) / 2}px) rotate({p.rotation}rad);
            "
        >
            {#each p.blocks as block}
                <div 
                    class="tetris-block"
                    style="left: {block.col * p.size}px; top: {block.row * p.size}px; width: {p.size}px; height: {p.size}px;"
                >
                    <div class="tetris-block-bg" style="background-color: {p.color}; box-shadow: 0 0 10px {p.color};"></div>
                    <div class="tetris-block-bevel"></div>
                </div>
            {/each}
        </div>
    {/each}
</div>

<style>
    /* The container for each tetris piece */
    .tetris-piece {
        position: absolute;
        top: 0; left: 0; /* Essential as the starting point before GPU translate */
        will-change: transform; /* Indicates to the browser to optimize the hardware animation */
    }

    /* The outer square of the block (white border) */
    .tetris-block {
        position: absolute;
        box-sizing: border-box;
        border: 1.5px solid rgba(255, 255, 255, 0.7);
    }

    /* The neon fill (targeted opacity without erasing the border) */
    .tetris-block-bg {
        position: absolute;
        inset: 0;
        opacity: 0.6;
    }

    /* The small recessed area inside */
    .tetris-block-bevel {
        position: absolute;
        top: 1.5px; left: 1.5px; right: 1.5px; bottom: 1.5px;
        border: 1px solid rgba(0, 0, 0, 0.3);
        pointer-events: none;
        z-index: 10;
    }
</style>