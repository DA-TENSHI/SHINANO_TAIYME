import { Directive } from 'vue';

const map = new WeakMap<HTMLElement, ResizeObserver>();

// eslint-disable-next-line import/no-default-export
export default {
	mounted(el) {
		const ro = new ResizeObserver(() => {
			el.style.setProperty('--containerHeight', `${el.offsetHeight}px`);
		});
		ro.observe(el);
		map.set(el, ro);
	},

	unmounted(el) {
		const ro = map.get(el);
		if (ro) {
			ro.disconnect();
			map.delete(el);
		}
	},
} as Directive<HTMLElement>;
