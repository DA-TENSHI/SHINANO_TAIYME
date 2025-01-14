<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	:class="[$style.root, {
		[$style.isSilenced]: 'isSilenced' in user && user.isSilenced,
		[$style.isSuspended]: 'isSuspended' in user && user.isSuspended,
	}]"
>
	<MkAvatar :class="$style.avatar" :user="user" indicator/>
	<div :class="$style.body">
		<span :class="$style.name"><MkUserName :user="user"/></span>
		<span :class="$style.sub"><span class="_monospace">@{{ acct(user) }}</span></span>
	</div>
	<MkMiniChart v-if="chartValues" :class="$style.chart" :src="chartValues"/>
</div>
</template>

<script lang="ts" setup>
import { shallowRef, watch } from 'vue';
import * as Misskey from 'misskey-js';
import { misskeyApiGet } from '@/scripts/misskey-api.js';
import { acct } from '@/filters/user.js';
import MkMiniChart from '@/components/MkMiniChart.vue';

const props = withDefaults(defineProps<{
	user: Misskey.entities.User;
	withChart?: boolean;
}>(), {
	withChart: false,
});

const chartValues = shallowRef<number[] | null>(null);

watch([
	() => props.user.id,
	() => props.withChart,
], ([userId, withChart]) => {
	if (withChart) {
		misskeyApiGet('charts/user/notes', {
			userId,
			limit: 16 + 1,
			span: 'day',
		}).then(res => {
			// 今日のぶんの値はまだ途中の値であり、それも含めると大抵の場合前日よりも下降しているようなグラフになってしまうため今日は弾く
			res.inc.shift();
			chartValues.value = res.inc;
		}).catch(() => {
			chartValues.value = null;
		});
	} else {
		chartValues.value = null;
	}
}, {
	immediate: true,
});
</script>

<style lang="scss" module>
$bodyTitleHieght: 18px;
$bodyInfoHieght: 16px;

.root {
	display: flex;
	align-items: center;
	padding: 16px;
	border-radius: 8px;
	background-color: var(--MI_THEME-panel);

	&.isSilenced,
	&.isSuspended {
		background-image: repeating-linear-gradient(
			135deg,
			transparent 0px 10px,
			var(--c) 6px 16px
		);
	}

	&,
	html[data-color-scheme=light] & {
		&.isSilenced {
			--c: color-mix(in srgb, #0000ff 12.5%, var(--MI_THEME-panel));
		}

		&.isSuspended {
			--c: color-mix(in srgb, #000000 3.75%, var(--MI_THEME-panel));
		}
	}

	html[data-color-scheme=dark] & {
		&.isSilenced {
			--c: color-mix(in srgb, #0000ff 25%, var(--MI_THEME-panel));
		}

		&.isSuspended {
			--c: color-mix(in srgb, #ffffff 7.5%, var(--MI_THEME-panel));
		}
	}
}

.avatar {
	display: block;
	width: ($bodyTitleHieght + $bodyInfoHieght);
	height: ($bodyTitleHieght + $bodyInfoHieght);
	margin-right: 12px;
}

.body {
	flex: 1;
	overflow: hidden;
	font-size: 0.9em;
	color: var(--MI_THEME-fg);
	padding-right: 8px;
}

.name {
	display: block;
	width: 100%;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	line-height: $bodyTitleHieght;
}

.sub {
	display: block;
	width: 100%;
	font-size: 95%;
	opacity: 0.7;
	line-height: $bodyInfoHieght;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.chart {
	height: 30px;
}
</style>
