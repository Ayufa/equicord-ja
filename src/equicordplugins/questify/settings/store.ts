/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings, PlainSettings, SettingsStore } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { OptionType } from "@utils/types";

import { QuestButtonSetting } from "../components/questButtonSettings";
import { QuestFeaturesSetting } from "../components/questFeaturesSetting";
import { QuestNotificationsSetting } from "../components/questNotificationsSetting";
import { QuestTilesSetting } from "../components/questTilesSetting";
import { ReorderQuestsSetting } from "../components/reorderQuestsSetting";
import { SettingsSearch } from "../components/settingsSearch";
import { defaultAcknowledgedNotices, defaultAllowChangingDangerousSettings, defaultAutoCompleteQuests, defaultAutoCompleteQuestsSimultaneously, defaultAutoCompleteQuestTypes, defaultAutoEnrollQuests, defaultClaimedSubsort, defaultCompleteVideoQuestsQuicker, defaultDisableAccountPanelPromo, defaultDisableAccountPanelQuestProgress, defaultDisableFriendsListPromo, defaultDisableMembersListPromo, defaultDisableOrbsAndQuestsBadges, defaultDisableQuestsEverything, defaultDisableRelocationNotices, defaultDisableSponsoredBanner, defaultExpiredSubsort, defaultHiddenQuestStatuses, defaultHideNonAutoCompletableQuests, defaultIgnoredQuestIDs, defaultIgnoredSubsort, defaultIsOnQuestsPage, defaultLastQuestPageFilters, defaultLastQuestPageSort, defaultLeftClickAction, defaultMakeMobileVideoQuestsDesktopCompatible, defaultMiddleClickAction, defaultNewExcludedQuestAlertSound, defaultNewExcludedQuestAlertVolume, defaultNewQuestAlertSound, defaultNewQuestAlertVolume, defaultNotifyOnNewExcludedQuests, defaultNotifyOnNewQuests, defaultNotifyOnQuestComplete, defaultPreventVideoQuestsPausing, defaultQuestButtonBadgeColor, defaultQuestButtonBadgeCount, defaultQuestButtonDisplay, defaultQuestButtonIncludedTypes, defaultQuestButtonIndicator, defaultQuestCompletedAlertSound, defaultQuestCompletedAlertVolume, defaultQuestFetchInterval, defaultQuestOrder, defaultQuestTileClaimedColorSetting, defaultQuestTileExpiredColorSetting, defaultQuestTileGradient, defaultQuestTileIgnoredColorSetting, defaultQuestTilePreload, defaultQuestTileUnclaimedColorSetting, defaultRememberQuestPageFilters, defaultRememberQuestPageSort, defaultResumeInterruptedQuests, defaultResumeQuestIDs, defaultRightClickAction, defaultUnclaimedSubsort, type QuestButtonAction, type QuestButtonDisplayMode, type QuestButtonIncludedTypes, type QuestButtonIndicatorMode, type QuestOrderStatus } from "./def";

const MIGRATION_TARGET = 1;
const CURRENT_SETTINGS = PlainSettings.plugins.Questify;

if (CURRENT_SETTINGS) {
    let migrationVersion = CURRENT_SETTINGS.migrationVersion ?? 0;

    // 0 -> 1: Reset Settings
    if (migrationVersion === 0) {
        PlainSettings.plugins.Questify = { enabled: CURRENT_SETTINGS.enabled, migrationVersion: 1 };
        migrationVersion = 1;
    }

    if (migrationVersion !== CURRENT_SETTINGS.migrationVersion) {
        SettingsStore.markAsChanged();
    }
}

export const settings = definePluginSettings({
    migrationVersion: {
        type: OptionType.NUMBER,
        description: "設定の現在の移行バージョン。",
        default: MIGRATION_TARGET,
        hidden: true,
    },
    acknowledgedNotices: {
        type: OptionType.CUSTOM,
        description: "ユーザーが確認した一度きりの通知。",
        default: { ...defaultAcknowledgedNotices },
        hidden: true,
    },
    settingsSearch: {
        type: OptionType.COMPONENT,
        component: ErrorBoundary.wrap(SettingsSearch) as any,
        description: "Questify の設定を検索。",
    },
    questFeatures: {
        type: OptionType.COMPONENT,
        component: ErrorBoundary.wrap(QuestFeaturesSetting) as any,
        description: "無効にする Quest 機能を選択してください。",
    },
    disableQuestsEverything: {
        type: OptionType.BOOLEAN,
        description: "すべての Quest 機能を無効にします。",
        default: defaultDisableQuestsEverything,
        restartNeeded: true,
        hidden: true,
    },
    disableRelocationNotices: {
        type: OptionType.BOOLEAN,
        description: "Discovery ページの Quest 移動通知を無効にします。",
        default: defaultDisableRelocationNotices,
        restartNeeded: true,
        hidden: true,
    },
    disableSponsoredBanner: {
        type: OptionType.BOOLEAN,
        description: "Quest ページのスポンサーバナーを無効にします。",
        default: defaultDisableSponsoredBanner,
        restartNeeded: true,
        hidden: true,
    },
    disableAccountPanelPromo: {
        type: OptionType.BOOLEAN,
        description: "アカウントパネルの上にある宣伝用 Quest ポップアップを無効にします。",
        default: defaultDisableAccountPanelPromo,
        restartNeeded: true,
        hidden: true,
    },
    disableAccountPanelQuestProgress: {
        type: OptionType.BOOLEAN,
        description: "アカウントパネルの上にある進行中・完了した Quest の進捗を無効にします。",
        default: defaultDisableAccountPanelQuestProgress,
        restartNeeded: true,
        hidden: true,
    },
    disableOrbsAndQuestsBadges: {
        type: OptionType.BOOLEAN,
        description: "ユーザープロフィールの Quest バッジを無効にします。",
        default: defaultDisableOrbsAndQuestsBadges,
        restartNeeded: true,
        hidden: true,
    },
    disableFriendsListPromo: {
        type: OptionType.BOOLEAN,
        description: "フレンドがプレイしたゲームの Quest の宣伝を無効にします。",
        default: defaultDisableFriendsListPromo,
        restartNeeded: true,
        hidden: true,
    },
    disableMembersListPromo: {
        type: OptionType.BOOLEAN,
        description: "メンバーリスト項目の「プレイ中」アイコンを無効にします。",
        default: defaultDisableMembersListPromo,
        restartNeeded: true,
        hidden: true,
    },
    allowChangingDangerousSettings: {
        type: OptionType.BOOLEAN,
        description: "危険な設定の変更を許可します。",
        default: defaultAllowChangingDangerousSettings,
        hidden: true,
    },
    resumeInterruptedQuests: {
        type: OptionType.BOOLEAN,
        description: "再読み込みまたは再起動後に Quest の自動完了を再開します。",
        default: defaultResumeInterruptedQuests,
        restartNeeded: true,
        hidden: true,
    },
    makeMobileVideoQuestsDesktopCompatible: {
        type: OptionType.BOOLEAN,
        description: "モバイル専用のビデオ Quest をデスクトップでも使えるようにします。",
        default: defaultMakeMobileVideoQuestsDesktopCompatible,
        restartNeeded: true,
        hidden: true,
    },
    hideNonAutoCompletableQuests: {
        type: OptionType.BOOLEAN,
        description: "対応していて有効な自動完了タスクがない未完了の Quest を隠します。",
        default: defaultHideNonAutoCompletableQuests,
        hidden: true,
    },
    autoEnrollQuests: {
        type: OptionType.BOOLEAN,
        description: "Discord の実行中、取得に成功したときに、対象となる利用可能な Quest に自動的に参加します。",
        default: defaultAutoEnrollQuests,
        hidden: true,
    },
    autoCompleteQuests: {
        type: OptionType.BOOLEAN,
        description: "Discord の実行中、取得に成功したときに、対応していて有効なタスクタイプを持つ対象の利用可能な Quest に自動的に参加して完了します。",
        default: defaultAutoCompleteQuests,
        hidden: true,
    },
    autoCompleteQuestsSimultaneously: {
        type: OptionType.BOOLEAN,
        description: "Quest を順番ではなく同時に完了します。",
        default: defaultAutoCompleteQuestsSimultaneously,
        restartNeeded: true,
        hidden: true,
    },
    completeVideoQuestsQuicker: {
        type: OptionType.BOOLEAN,
        description: "ビデオ Quest の自動完了に、Discord の進捗の許容範囲と参加後の経過時間を使います。",
        default: defaultCompleteVideoQuestsQuicker,
        restartNeeded: true,
        hidden: true,
    },
    preventVideoQuestsPausing: {
        type: OptionType.BOOLEAN,
        description: "Quest モーダルがフォーカスを失ったときに動画が一時停止しないようにします。",
        default: defaultPreventVideoQuestsPausing,
        restartNeeded: true,
        hidden: true,
    },
    autoCompleteQuestTypes: {
        type: OptionType.CUSTOM,
        description: "バックグラウンドで自動完了する Quest のタイプ。",
        default: defaultAutoCompleteQuestTypes,
        restartNeeded: true,
        hidden: true,
    },
    questButton: {
        type: OptionType.COMPONENT,
        component: ErrorBoundary.wrap(QuestButtonSetting) as any,
        description: "サーバーリストの Quest ボタンをカスタマイズします。",
    },
    questButtonDisplay: {
        type: OptionType.CUSTOM,
        description: "サーバーリストの Quest ボタンに使う表示タイプ。",
        default: defaultQuestButtonDisplay as QuestButtonDisplayMode,
        restartNeeded: true,
        hidden: true,
    },
    questButtonIncludedTypes: {
        type: OptionType.CUSTOM,
        description: "Quest ボタンに Quest 数を表示するときに含める報酬タイプと Quest タイプ。",
        default: defaultQuestButtonIncludedTypes as QuestButtonIncludedTypes,
        hidden: true,
    },
    questButtonIndicator: {
        type: OptionType.CUSTOM,
        description: "サーバーリストの Quest ボタンの未受け取りインジケーターに使う表示タイプ。",
        default: defaultQuestButtonIndicator as QuestButtonIndicatorMode,
        hidden: true,
    },
    questButtonBadgeCount: {
        type: OptionType.NUMBER,
        description: "関連する未受け取り Quest の現在の数。",
        default: defaultQuestButtonBadgeCount,
        hidden: true,
    },
    questButtonBadgeColor: {
        type: OptionType.NUMBER | OptionType.CUSTOM,
        description: "サーバーリストの Quest ボタンのバッジの色。",
        default: defaultQuestButtonBadgeColor as number | null,
        hidden: true,
    },
    questButtonLeftClickAction: {
        type: OptionType.CUSTOM,
        description: "サーバーリストの Quest ボタンを左クリックしたときのアクション。",
        default: defaultLeftClickAction as QuestButtonAction,
        hidden: true,
    },
    questButtonMiddleClickAction: {
        type: OptionType.CUSTOM,
        description: "サーバーリストの Quest ボタンを中クリックしたときのアクション。",
        default: defaultMiddleClickAction as QuestButtonAction,
        hidden: true,
    },
    questButtonRightClickAction: {
        type: OptionType.CUSTOM,
        description: "サーバーリストの Quest ボタンを右クリックしたときのアクション。",
        default: defaultRightClickAction as QuestButtonAction,
        hidden: true,
    },
    questNotifications: {
        type: OptionType.COMPONENT,
        component: ErrorBoundary.wrap(QuestNotificationsSetting) as any,
        description: "Quest 完了時と新しい Quest 検出時の通知を設定します。",
    },
    notifyOnQuestComplete: {
        type: OptionType.BOOLEAN,
        description: "Quest が完了したときに通知を表示します。",
        default: defaultNotifyOnQuestComplete,
        hidden: true,
    },
    notifyOnNewQuests: {
        type: OptionType.BOOLEAN,
        description: "新しい Quest が検出されたときに通知を表示します。",
        default: defaultNotifyOnNewQuests,
        hidden: true,
    },
    notifyOnNewExcludedQuests: {
        type: OptionType.BOOLEAN,
        description: "除外された新しい Quest が検出されたときに通知を表示します。",
        default: defaultNotifyOnNewExcludedQuests,
        hidden: true,
    },
    questCompletedAlertSound: {
        type: OptionType.STRING | OptionType.CUSTOM,
        description: "Quest 完了時に再生するサウンド。",
        default: defaultQuestCompletedAlertSound as string | null,
        hidden: true,
    },
    questCompletedAlertVolume: {
        type: OptionType.NUMBER,
        description: "Quest 完了通知サウンドの音量。",
        default: defaultQuestCompletedAlertVolume,
        hidden: true,
    },
    questFetchInterval: {
        type: OptionType.NUMBER,
        description: "Discord から Quest を取得する間隔（秒）。",
        default: defaultQuestFetchInterval,
        hidden: true,
    },
    newQuestAlertSound: {
        type: OptionType.STRING | OptionType.CUSTOM,
        description: "新しい Quest が検出されたときに再生するサウンド。",
        default: defaultNewQuestAlertSound as string | null,
        hidden: true,
    },
    newQuestAlertVolume: {
        type: OptionType.NUMBER,
        description: "新しい Quest の通知サウンドの音量。",
        default: defaultNewQuestAlertVolume,
        hidden: true,
    },
    newExcludedQuestAlertSound: {
        type: OptionType.STRING | OptionType.CUSTOM,
        description: "除外された新しい Quest が検出されたときに再生するサウンド。",
        default: defaultNewExcludedQuestAlertSound as string | null,
        hidden: true,
    },
    newExcludedQuestAlertVolume: {
        type: OptionType.NUMBER,
        description: "除外された新しい Quest の通知サウンドの音量。",
        default: defaultNewExcludedQuestAlertVolume,
        hidden: true,
    },
    questTiles: {
        type: OptionType.COMPONENT,
        component: ErrorBoundary.wrap(QuestTilesSetting) as any,
        description: "Quests ページの Quest タイルの外観をカスタマイズします。",
    },
    questTileUnclaimedColor: {
        type: OptionType.CUSTOM,
        description: "Quests ページの未受け取り Quest タイルの色。",
        default: { ...defaultQuestTileUnclaimedColorSetting },
        hidden: true,
    },
    questTileClaimedColor: {
        type: OptionType.CUSTOM,
        description: "Quests ページの受け取り済み Quest タイルの色。",
        default: { ...defaultQuestTileClaimedColorSetting },
        hidden: true,
    },
    questTileIgnoredColor: {
        type: OptionType.CUSTOM,
        description: "Quests ページの無視した Quest タイルの色。",
        default: { ...defaultQuestTileIgnoredColorSetting },
        hidden: true,
    },
    questTileExpiredColor: {
        type: OptionType.CUSTOM,
        description: "Quests ページの期限切れ Quest タイルの色。",
        default: { ...defaultQuestTileExpiredColorSetting },
        hidden: true,
    },
    questTileGradient: {
        type: OptionType.STRING,
        description: "Quest タイルに使うグラデーションのスタイル。",
        default: defaultQuestTileGradient,
        hidden: true,
    },
    questTilePreload: {
        type: OptionType.BOOLEAN,
        description: "Quest タイルのアセットを事前に読み込もうとします。",
        default: defaultQuestTilePreload,
        hidden: true,
    },
    reorderQuests: {
        type: OptionType.COMPONENT,
        description: "Quest をステータスで並べ替えます。",
        component: ErrorBoundary.wrap(ReorderQuestsSetting) as any,
    },
    questOrder: {
        type: OptionType.CUSTOM,
        description: "Quest ステータスグループの並べ替え順。",
        default: Array.from(defaultQuestOrder) as QuestOrderStatus[],
        hidden: true,
    },
    hiddenQuestStatuses: {
        type: OptionType.CUSTOM,
        description: "隠す Quest ステータスグループ。",
        default: Array.from(defaultHiddenQuestStatuses),
        hidden: true,
    },
    unclaimedSubsort: {
        type: OptionType.STRING,
        description: "未受け取り Quest のサブ並べ替え方法。",
        default: defaultUnclaimedSubsort,
        hidden: true,
    },
    claimedSubsort: {
        type: OptionType.STRING,
        description: "受け取り済み Quest のサブ並べ替え方法。",
        default: defaultClaimedSubsort,
        hidden: true,
    },
    ignoredSubsort: {
        type: OptionType.STRING,
        description: "無視した Quest のサブ並べ替え方法。",
        default: defaultIgnoredSubsort,
        hidden: true,
    },
    expiredSubsort: {
        type: OptionType.STRING,
        description: "期限切れ Quest のサブ並べ替え方法。",
        default: defaultExpiredSubsort,
        hidden: true,
    },
    isOnQuestsPage: {
        type: OptionType.BOOLEAN,
        description: "ユーザーが現在 Quests ページにいるかどうか。",
        default: defaultIsOnQuestsPage,
        hidden: true,
    },
    rememberQuestPageSort: {
        type: OptionType.BOOLEAN,
        description: "Quests ページで最後に使った並べ替えを記憶します。",
        default: defaultRememberQuestPageSort,
        hidden: true,
    },
    rememberQuestPageFilters: {
        type: OptionType.BOOLEAN,
        description: "Quests ページで最後に使ったフィルターを記憶します。",
        default: defaultRememberQuestPageFilters,
        hidden: true,
    },
    lastQuestPageSort: {
        type: OptionType.STRING,
        description: "Quests ページで最後に使った並べ替えを記憶します。",
        default: defaultLastQuestPageSort,
        hidden: true,
    },
    lastQuestPageFilters: {
        type: OptionType.CUSTOM,
        description: "Quests ページで最後に使ったフィルターを記憶します。",
        default: defaultLastQuestPageFilters,
        hidden: true,
    },
    ignoredQuestIDs: {
        type: OptionType.CUSTOM,
        description: "無視された Quest ID の配列。",
        default: defaultIgnoredQuestIDs,
        hidden: true,
    },
    resumeQuestIDs: {
        type: OptionType.CUSTOM,
        description: "バックグラウンドで自動完了されている、またはキューに入っている Quest ID の配列。",
        default: defaultResumeQuestIDs,
        hidden: true,
    },
}).withPrivateSettings<{
    usedKonamiCode?: boolean;
    autoEnrollQuestsUnpaused?: boolean;
    autoCompleteQuestsUnpaused?: boolean;
    enrollmentRateLimitBlockedUntil?: Record<string, number>;
}>();
