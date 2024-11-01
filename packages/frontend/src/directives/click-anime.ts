/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ObjectDirective } from 'vue';

type VClickAnime = ObjectDirective<HTMLElement, null | undefined>;

export const vClickAnime = {
	async mounted(src) {
		const [
			{ defaultStore },
		] = await Promise.all([
			import('@/store.js'),
		]);

		if (!defaultStore.state.animation) return;

		const target = src.children[0];

		if (target == null) return;

		target.classList.add('_anime_bounce_standBy');

		src.addEventListener('mousedown', () => {
			target.classList.remove('_anime_bounce');

			target.classList.add('_anime_bounce_standBy');
			target.classList.add('_anime_bounce_ready');

			target.addEventListener('mouseleave', () => {
				target.classList.remove('_anime_bounce_ready');
			}, { passive: true });
		}, { passive: true });

		src.addEventListener('click', () => {
			target.classList.add('_anime_bounce');
			target.classList.remove('_anime_bounce_ready');
		}, { passive: true });

		src.addEventListener('animationend', () => {
			target.classList.remove('_anime_bounce');
			target.classList.add('_anime_bounce_standBy');
		}, { passive: true });
	},
} satisfies VClickAnime as VClickAnime;
