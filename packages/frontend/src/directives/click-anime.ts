/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Directive } from 'vue';
import { defaultStore } from '@/store.js';

// eslint-disable-next-line import/no-default-export
export default {
	mounted(el: HTMLElement, binding, vn) {
		if (!defaultStore.state.animation) return;

		const target = el.children[0];

		if (target == null) return;

		target.classList.add('_anime_bounce_standBy');

		el.addEventListener('mousedown', () => {
			target.classList.remove('_anime_bounce');

			target.classList.add('_anime_bounce_standBy');
			target.classList.add('_anime_bounce_ready');

			target.addEventListener('mouseleave', () => {
				target.classList.remove('_anime_bounce_ready');
			}, { passive: true });
		}, { passive: true });

		el.addEventListener('click', () => {
			target.classList.add('_anime_bounce');
			target.classList.remove('_anime_bounce_ready');
		}, { passive: true });

		el.addEventListener('animationend', () => {
			target.classList.remove('_anime_bounce');
			target.classList.add('_anime_bounce_standBy');
		}, { passive: true });
	},
} as Directive;
