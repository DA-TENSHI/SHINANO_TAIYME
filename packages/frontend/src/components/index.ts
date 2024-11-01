/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { App } from 'vue';

import I18n from '@/components/global/I18n.vue';
import RouterView from '@/components/global/RouterView.vue';
import Mfm from '@/components/global/MkMfm.js';
import MkA from '@/components/global/MkA.vue';
import MkAcct from '@/components/global/MkAcct.vue';
import MkAd from '@/components/global/MkAd.vue';
import MkAvatar from '@/components/global/MkAvatar.vue';
import MkCondensedLine from '@/components/global/MkCondensedLine.vue';
import MkCustomEmoji from '@/components/global/MkCustomEmoji.vue';
import MkEllipsis from '@/components/global/MkEllipsis.vue';
import MkEmoji from '@/components/global/MkEmoji.vue';
import MkError from '@/components/global/MkError.vue';
import MkFooterSpacer from '@/components/global/MkFooterSpacer.vue';
import MkLazy from '@/components/global/MkLazy.vue';
import MkLoading from '@/components/global/MkLoading.vue';
import MkPageHeader from '@/components/global/MkPageHeader.vue';
import MkSpacer from '@/components/global/MkSpacer.vue';
import MkStickyContainer from '@/components/global/MkStickyContainer.vue';
import MkTime from '@/components/global/MkTime.vue';
import MkUrl from '@/components/global/MkUrl.vue';
import MkUserName from '@/components/global/MkUserName.vue';
import TmsNoCache from '@/components/global/TmsNoCache.vue';

// eslint-disable-next-line import/no-default-export
export default function(app: App) {
	for (const [key, value] of Object.entries(components)) {
		app.component(key, value);
	}
}

export const components = {
	I18n,
	RouterView,
	Mfm,
	MkA,
	MkAcct,
	MkAd,
	MkAvatar,
	MkCondensedLine,
	MkCustomEmoji,
	MkEllipsis,
	MkEmoji,
	MkError,
	MkFooterSpacer,
	MkLazy,
	MkLoading,
	MkPageHeader,
	MkSpacer,
	MkStickyContainer,
	MkTime,
	MkUrl,
	MkUserName,
	TmsNoCache,
} as const;

declare module '@vue/runtime-core' {
	export interface GlobalComponents {
		I18n: typeof I18n;
		RouterView: typeof RouterView;
		Mfm: typeof Mfm;
		MkA: typeof MkA;
		MkAcct: typeof MkAcct;
		MkAd: typeof MkAd;
		MkAvatar: typeof MkAvatar;
		MkCondensedLine: typeof MkCondensedLine;
		MkCustomEmoji: typeof MkCustomEmoji;
		MkEllipsis: typeof MkEllipsis;
		MkEmoji: typeof MkEmoji;
		MkError: typeof MkError;
		MkFooterSpacer: typeof MkFooterSpacer;
		MkLazy: typeof MkLazy;
		MkLoading: typeof MkLoading;
		MkPageHeader: typeof MkPageHeader;
		MkSpacer: typeof MkSpacer;
		MkStickyContainer: typeof MkStickyContainer;
		MkTime: typeof MkTime;
		MkUrl: typeof MkUrl;
		MkUserName: typeof MkUserName;
		TmsNoCache: typeof TmsNoCache;
	}
}
