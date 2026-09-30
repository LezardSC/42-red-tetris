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
        box-sizing: border-box;
        border: 1.5px solid rgba(255, 255, 255, 0.7);
    }

    .tetris-block-bg {
        position: absolute;
        inset: 0;
        opacity: 0.6;
    }

    .tetris-block-bevel {
        position: absolute;
        top: 1.5px; left: 1.5px; right: 1.5px; bottom: 1.5px;
        border: 1px solid rgba(0, 0, 0, 0.3);
        pointer-events: none;
        z-index: 10;
    }
</style>
