/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computed, watch, version as vueVersion, App } from 'vue';
import { compareVersions } from 'compare-versions';
import { version, lang, updateLocale, locale, commitHash } from '@@/js/config.js';
import widgets from '@/widgets/index.js';
import directives from '@/directives/index.js';
import components from '@/components/index.js';
import { applyTheme } from '@/scripts/theme.js';
import { isDeviceDarkmode } from '@/scripts/is-device-darkmode.js';
import { updateI18n } from '@/i18n.js';
import { $i, refreshAccount, login } from '@/account.js';
import { defaultStore, ColdDeviceStorage } from '@/store.js';
import { fetchInstance, instance } from '@/instance.js';
import { deviceKind } from '@/scripts/device-kind.js';
import { reloadChannel } from '@/scripts/unison-reload.js';
import { getUrlWithoutLoginId } from '@/scripts/login-id.js';
import { getAccountFromId } from '@/scripts/get-account-from-id.js';
import { deckStore } from '@/ui/deck/deck-store.js';
import { miLocalStorage } from '@/local-storage.js';
import { fetchCustomEmojis } from '@/custom-emojis.js';
import { setupRouter } from '@/router/main.js';
import { createMainRouter } from '@/router/definition.js';
import { tmsFlaskStore } from '@/tms/flask-store.js';
import { tmsStore } from '@/tms/store.js';
import { preventLongPressContextMenu } from '@/scripts/tms/prevent-longpress-contextmenu.js';

export async function common(createVue: () => App<Element>) {
	console.info(`taiyme v${version}`);

	if (_DEV_) {
		console.warn('Development mode!!!');

		console.info(`vue ${vueVersion}`);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(window as any).$i = $i;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(window as any).$store = defaultStore;

		window.addEventListener('error', event => {
			console.error(event);
			/*
			alert({
				type: 'error',
				title: 'DEV: Unhandled error',
				text: event.message
			});
			*/
		}, { passive: true });

		window.addEventListener('unhandledrejection', event => {
			console.error(event);
			/*
			alert({
				type: 'error',
				title: 'DEV: Unhandled promise rejection',
				text: event.reason
			});
			*/
		}, { passive: true });
	}

	let isClientUpdated = false;

	//#region クライアントが更新されたかチェック
	const lastVersion = miLocalStorage.getItem('lastVersion');
	if (lastVersion !== version) {
		miLocalStorage.setItem('lastVersion', version);

		// テーマリビルドするため
		miLocalStorage.removeItem('theme');

		try { // 変なバージョン文字列来るとcompareVersionsでエラーになるため
			const a = version.split('-').at(0);
			const b = lastVersion?.split('-').at(0);
			isClientUpdated = a != null && b != null && compareVersions(a, b) === 1;
		} catch (err) { /* empty */ }
	}
	//#endregion

	//#region Detect language & fetch translations
	const revision = commitHash ?? 'unknown';
	const newLocaleVersion = `${version}+REV:${revision}`;
	const localeOutdated = miLocalStorage.getItem('localeVersion') !== newLocaleVersion || locale == null;
	if (localeOutdated) {
		const res = await window.fetch(`/assets/locales/${lang}.${version}.json?rev=${revision}`);
		if (res.status === 200) {
			const newLocale = await res.text();
			const parsedNewLocale = JSON.parse(newLocale);
			miLocalStorage.setItem('locale', newLocale);
			miLocalStorage.setItem('localeVersion', newLocaleVersion);
			updateLocale(parsedNewLocale);
			updateI18n(parsedNewLocale);
		}
	}
	//#endregion

	// タッチデバイスでCSSの:hoverを機能させる
	document.addEventListener('touchend', () => {}, { passive: true });

	// 一斉リロード
	reloadChannel.addEventListener('message', path => {
		if (path !== null) location.href = path;
		else location.reload();
	});

	// If mobile, insert the viewport meta tag
	if (['smartphone', 'tablet'].includes(deviceKind)) {
		const viewport = document.getElementsByName('viewport').item(0);
		viewport.setAttribute('content',
			`${viewport.getAttribute('content')}, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover`);
	}

	//#region Set lang attr
	const html = document.documentElement;
	html.setAttribute('lang', lang);
	//#endregion

	await defaultStore.ready;
	await deckStore.ready;
	await tmsStore.ready;
	await tmsFlaskStore.ready;

	if (tmsFlaskStore.state.preventLongPressContextMenu) {
		preventLongPressContextMenu();
	}

	const fetchInstanceMetaPromise = fetchInstance();

	fetchInstanceMetaPromise.then(() => {
		miLocalStorage.setItem('v', instance.version);
	});

	//#region loginId
	const params = new URLSearchParams(location.search);
	const loginId = params.get('loginId');

	if (loginId) {
		const target = getUrlWithoutLoginId(location.href);

		if (!$i || $i.id !== loginId) {
			const account = await getAccountFromId(loginId);
			if (account) {
				await login(account.token, target);
			}
		}

		history.replaceState({ misskey: 'loginId' }, '', target);
	}
	//#endregion

	// NOTE: この処理は必ずクライアント更新チェック処理より後に来ること(テーマ再構築のため)
	watch(defaultStore.reactiveState.darkMode, (darkMode) => {
		applyTheme(darkMode ? ColdDeviceStorage.get('darkTheme') : ColdDeviceStorage.get('lightTheme'));
	}, { immediate: miLocalStorage.getItem('theme') == null });

	document.documentElement.dataset.colorScheme = defaultStore.state.darkMode ? 'dark' : 'light';

	const darkTheme = computed(ColdDeviceStorage.makeGetterSetter('darkTheme'));
	const lightTheme = computed(ColdDeviceStorage.makeGetterSetter('lightTheme'));

	watch(darkTheme, (theme) => {
		if (defaultStore.state.darkMode) {
			applyTheme(theme);
		}
	});

	watch(lightTheme, (theme) => {
		if (!defaultStore.state.darkMode) {
			applyTheme(theme);
		}
	});

	//#region Sync dark mode
	if (ColdDeviceStorage.get('syncDeviceDarkMode')) {
		defaultStore.set('darkMode', isDeviceDarkmode());
	}

	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (mql) => {
		if (ColdDeviceStorage.get('syncDeviceDarkMode')) {
			defaultStore.set('darkMode', mql.matches);
		}
	}, { passive: true });
	//#endregion

	fetchInstanceMetaPromise.then(() => {
		if (defaultStore.state.themeInitial) {
			if (instance.defaultLightTheme != null) ColdDeviceStorage.set('lightTheme', JSON.parse(instance.defaultLightTheme));
			if (instance.defaultDarkTheme != null) ColdDeviceStorage.set('darkTheme', JSON.parse(instance.defaultDarkTheme));
			defaultStore.set('themeInitial', false);
		}
	});

	watch(defaultStore.reactiveState.useBlurEffectForModal, v => {
		document.documentElement.style.setProperty('--MI-modalBgFilter', v ? 'blur(4px)' : 'none');
	}, { immediate: true });

	watch(defaultStore.reactiveState.useBlurEffect, v => {
		if (v) {
			document.documentElement.style.removeProperty('--MI-blur');
		} else {
			document.documentElement.style.setProperty('--MI-blur', 'none');
		}
	}, { immediate: true });

	// Keep screen on
	const onVisibilityChange = () => document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'visible') {
			navigator.wakeLock.request('screen');
		}
	}, { passive: true });
	if (defaultStore.state.keepScreenOn && 'wakeLock' in navigator) {
		navigator.wakeLock.request('screen')
			.then(onVisibilityChange)
			.catch(() => {
				// On WebKit-based browsers, user activation is required to send wake lock request
				// https://webkit.org/blog/13862/the-user-activation-api/
				document.addEventListener(
					'click',
					() => navigator.wakeLock.request('screen').then(onVisibilityChange),
					{ passive: true, once: true },
				);
			});
	}

	//#region Fetch user
	if ($i && $i.token) {
		if (_DEV_) {
			console.log('account cache found. refreshing...');
		}

		refreshAccount();
	}
	//#endregion

	try {
		await fetchCustomEmojis();
	} catch (err) { /* empty */ }

	const app = createVue();

	setupRouter(app, createMainRouter);

	if (_DEV_) {
		app.config.performance = true;
	}

	widgets(app);
	directives(app);
	components(app);

	// https://github.com/misskey-dev/misskey/pull/8575#issuecomment-1114239210
	// なぜか2回実行されることがあるため、mountするdivを1つに制限する
	const rootEl = ((): HTMLElement => {
		const MISSKEY_MOUNT_DIV_ID = 'misskey_app';

		const currentRoot = document.getElementById(MISSKEY_MOUNT_DIV_ID);

		if (currentRoot) {
			console.warn('multiple import detected');
			return currentRoot;
		}

		const root = document.createElement('div');
		root.id = MISSKEY_MOUNT_DIV_ID;
		document.body.appendChild(root);
		return root;
	})();

	app.mount(rootEl);

	// boot.jsのやつを解除
	window.onerror = null;
	window.onunhandledrejection = null;

	removeSplash();

	return {
		isClientUpdated,
		app,
	};
}

function removeSplash() {
	const splash = document.getElementById('splash');
	if (splash) {
		splash.style.opacity = '0';
		splash.style.pointerEvents = 'none';

		// transitionendイベントが発火しない場合があるため
		window.setTimeout(() => {
			splash.remove();
		}, 1000);
	}
}
