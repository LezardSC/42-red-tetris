<script lang="ts">
    import { createParticles } from './background';

    const SEED = 42;
    const COUNT = 30;

    const particles = createParticles(SEED, COUNT);
</script>

<div class="fixed inset-0 w-full h-full pointer-events-none z-[-1] overflow-hidden">
    {#each particles as p (p.id)}
        <div
            class="tetris-piece"
            style:--x="{p.x}%"
            style:--clearance="{p.clearance}px"
            style:--rotation="{p.rotation}rad"
            style:--spin="{p.spin}rad"
            style:width="{p.cols * p.size}px"
            style:height="{p.rows * p.size}px"
            style:animation-duration="{p.duration}s"
            style:animation-delay="{p.delay}s"
        >
            {#each p.blocks as block}
                <div
                    class="tetris-block"
                    style:--c={p.color}
                    style="left: {block.col * p.size}px; top: {block.row * p.size}px; width: {p.size}px; height: {p.size}px;"
                ></div>
            {/each}
        </div>
    {/each}
</div>

<style>
    .tetris-piece {
        position: absolute;
        top: 0;
        left: var(--x);
        animation-name: fall;
        animation-timing-function: linear;
        animation-iteration-count: infinite;
        will-change: transform; /* Indicates to the browser to optimize the hardware animation */
    }

    @keyframes fall {
        from {
            transform: translate(-50%, calc(-1 * var(--clearance))) rotate(var(--rotation));
        }
        to {
            transform: translate(-50%, calc(100vh + var(--clearance))) rotate(calc(var(--rotation) + var(--spin)));
        }
    }

    .tetris-block {
        position: absolute;
    }
</style>
