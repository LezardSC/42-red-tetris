import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import GameOver from '../src/GameOver.svelte';

describe('GameOver', () => {
    it('is a modal dialog that calls onQuit', async () => {
        const onQuit = vi.fn();
        const user = userEvent.setup();
        render(GameOver, { onQuit });
        expect(screen.getByRole('dialog', { name: 'Defeat' })).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Leave' }));
        expect(onQuit).toHaveBeenCalledOnce();
    });
});
