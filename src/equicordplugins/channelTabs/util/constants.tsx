/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Heading } from "@components/Heading";
import { Paragraph } from "@components/Paragraph";
import { ChannelTabsPreview } from "@equicordplugins/channelTabs/components/ChannelTabsContainer";
import { KeybindSettings } from "@equicordplugins/channelTabs/components/KeybindSettings";
import { Logger } from "@utils/Logger";
import { makeRange, OptionType } from "@utils/types";
import { SearchableSelect, useState } from "@webpack/common";
import { JSX } from "react";

import { Bookmarks } from "./types";

interface DynamicDropdownSettingOption {
    label: string;
    value: string;
    selected: boolean;
}

function AnimationSettings(): JSX.Element {
    const animationOptions: DynamicDropdownSettingOption[] = [
        { label: "Tab Hover Effects (lift + scale)", value: "hover", selected: settings.store.animationHover },
        { label: "Selected Tab Lift Animation", value: "selection", selected: settings.store.animationSelection },
        { label: "Tab Drag & Drop (ghost + reorder)", value: "drag-drop", selected: settings.store.animationDragDrop },
        { label: "Tab Enter/Exit Slides (creation + closing)", value: "enter-exit", selected: settings.store.animationEnterExit },
        { label: "Icon Pop on Selection (icon scale-up)", value: "icon-pop", selected: settings.store.animationIconPop },
        { label: "Close Button Rotation", value: "close-rotation", selected: settings.store.animationCloseRotation },
        { label: "Plus Button Pulse", value: "plus-pulse", selected: settings.store.animationPlusPulse },
        { label: "Mention Badge Glow", value: "mention-glow", selected: settings.store.animationMentionGlow },
        { label: "Compact Mode Expansion", value: "compact-expand", selected: settings.store.animationCompactExpand },
        { label: "Selected Tab Accent Border", value: "selected-border", selected: settings.store.animationSelectedBorder },
        { label: "Selected Tab Background Color", value: "selected-background", selected: settings.store.animationSelectedBackground },
        { label: "Tab Shadow Effects", value: "tab-shadows", selected: settings.store.animationTabShadows },
        { label: "Tab Repositioning (smooth position changes)", value: "tab-positioning", selected: settings.store.animationTabPositioning },
        { label: "Resize Handle Fade", value: "resize-handle", selected: settings.store.animationResizeHandle },
        { label: "Active Quests Gradient", value: "quests-active", selected: settings.store.animationQuestsActive }
    ];

    const [currentValue, setCurrentValue] = useState(animationOptions.filter(option => option.selected).map(option => option.value));

    function updateSettingsTruthy(enabledValues: string[]) {
        animationOptions.forEach(option => {
            option.selected = enabledValues.includes(option.value);
        });

        settings.store.animationHover = enabledValues.includes("hover");
        settings.store.animationSelection = enabledValues.includes("selection");
        settings.store.animationDragDrop = enabledValues.includes("drag-drop");
        settings.store.animationEnterExit = enabledValues.includes("enter-exit");
        settings.store.animationIconPop = enabledValues.includes("icon-pop");
        settings.store.animationCloseRotation = enabledValues.includes("close-rotation");
        settings.store.animationPlusPulse = enabledValues.includes("plus-pulse");
        settings.store.animationMentionGlow = enabledValues.includes("mention-glow");
        settings.store.animationCompactExpand = enabledValues.includes("compact-expand");
        settings.store.animationSelectedBorder = enabledValues.includes("selected-border");
        settings.store.animationSelectedBackground = enabledValues.includes("selected-background");
        settings.store.animationTabShadows = enabledValues.includes("tab-shadows");
        settings.store.animationTabPositioning = enabledValues.includes("tab-positioning");
        settings.store.animationResizeHandle = enabledValues.includes("resize-handle");
        settings.store.animationQuestsActive = enabledValues.includes("quests-active");

        setCurrentValue(enabledValues);
    }

    function handleChange(values: Array<DynamicDropdownSettingOption | string>) {
        const valueStrings = values.map(v => typeof v === "string" ? v : v.value);
        const toggled = valueStrings.length > currentValue.length
            ? valueStrings.find(v => !currentValue.includes(v))
            : currentValue.find(v => !valueStrings.includes(v));

        if (toggled == null) {
            updateSettingsTruthy(valueStrings);
            return;
        }

        if (currentValue.includes(toggled)) {
            updateSettingsTruthy(currentValue.filter(v => v !== toggled));
        } else {
            updateSettingsTruthy([...currentValue, toggled]);
        }
    }

    return (
        <section>
            <Heading>Animation Controls</Heading>
            <Paragraph>
                Enable or disable specific animations for channel tabs. Each option can be toggled independently.
            </Paragraph>
            <div style={{ marginTop: "8px" }}>
                <SearchableSelect
                    placeholder="Select which animations to enable..."
                    maxVisibleItems={12}
                    clearable={true}
                    multi={true}
                    value={currentValue as any}
                    options={animationOptions}
                    onChange={handleChange}
                    closeOnSelect={false}
                />
            </div>
        </section>
    );
}

export const logger = new Logger("ChannelTabs");

export const bookmarkFolderColors = {
    Red: "#f23f42",
    Blue: "#0052b6",
    Yellow: "#f0b132",
    Green: "#24934f",
    Black: "#000",
    White: "#fff",
    Orange: "#e67e22",
    Pink: "#ff73fa"
} as const;

export const settings = definePluginSettings({
    onStartup: {
        type: OptionType.SELECT,
        description: "起動時",
        options: [{
            label: "何もしない（フレンドタブを開く）",
            value: "nothing",
            default: true
        }, {
            label: "前回セッションのタブを復元",
            value: "remember"
        }, {
            label: "特定のタブセットを開く",
            value: "preset"
        }],
    },
    tabSet: {
        component: ChannelTabsPreview,
        type: OptionType.COMPONENT,
        default: {}
    },
    bookmarks: {
        type: OptionType.CUSTOM,
        description: "アカウントごとに保存されたブックマーク",
        default: {} as Record<string, Bookmarks>,
        hidden: true
    },
    showStatusIndicators: {
        description: "DMのステータスインジケーターを表示",
        type: OptionType.BOOLEAN,
        default: true
    },
    showBookmarkBar: {
        description: "",
        type: OptionType.BOOLEAN,
        default: true
    },
    bookmarkNotificationDot: {
        description: "ブックマークに通知ドットを表示",
        type: OptionType.BOOLEAN,
        default: true
    },
    persistUnreadCountFallback: {
        description: "タブとブックマークの未読バッジフォールバックを再読み込み後も保持",
        type: OptionType.BOOLEAN,
        default: true,
        restartNeeded: false
    },
    widerTabsAndBookmarks: {
        description: "大きなモニター向けにタブとブックマークの長さを拡張",
        type: OptionType.BOOLEAN,
        default: false,
        restartNeeded: false
    },
    tabWidthScale: {
        type: OptionType.NUMBER,
        description: "タブ幅の倍率（パーセント） - タブの端をドラッグして調整可能",
        default: 100,
        hidden: true,
        restartNeeded: false
    },
    tabHeightScale: {
        type: OptionType.NUMBER,
        description: "タブ高さの倍率（パーセント）。",
        default: 100,
        restartNeeded: false
    },
    renderAllTabs: {
        type: OptionType.BOOLEAN,
        description: "切り替えを速くするためにすべてのタブをメモリにキャッシュ（スクロール位置と状態をキャッシュします）",
        default: false,
        restartNeeded: false
    },
    switchToExistingTab: {
        type: OptionType.BOOLEAN,
        description: "移動先チャンネルのタブが既にある場合はそのタブに切り替え",
        default: false,
        restartNeeded: false
    },
    createNewTabIfNotExists: {
        type: OptionType.BOOLEAN,
        description: "移動先チャンネルのタブがない場合は新しいタブを作成",
        default: false,
        restartNeeded: false
    },
    enableRapidNavigation: {
        type: OptionType.BOOLEAN,
        description: "高速ナビゲーションを有効化 - チャンネル間をすばやく移動すると、新しいタブを作らず現在のタブを置き換えます",
        default: false,
        restartNeeded: false
    },
    rapidNavigationThreshold: {
        type: OptionType.SLIDER,
        description: "高速ナビゲーションの時間枠（秒）。この時間内に移動した新しいチャンネルは、新規タブではなく現在のタブを置き換えます。",
        markers: [1, 2, 3, 5, 10, 20, 30, 40, 50, 60],
        default: 3,
        stickToMarkers: false,
    },
    tabBarPosition: {
        type: OptionType.SELECT,
        description: "タブバーを表示する場所。",
        options: [
            { label: "上", value: "top", default: true },
            { label: "下", value: "bottom" }
        ],
        restartNeeded: true
    },
    enableNumberKeySwitching: {
        type: OptionType.BOOLEAN,
        description: "数字キー（1〜9）でタブを切り替えるようにする",
        default: true,
        restartNeeded: false
    },
    numberKeySwitchCount: {
        type: OptionType.SLIDER,
        description: "数字キー（1〜9）でアクセスできるタブの数",
        markers: makeRange(1, 9, 1),
        default: 3,
        stickToMarkers: true,
    },
    enableCloseTabShortcut: {
        type: OptionType.BOOLEAN,
        description: "タブを閉じるキーボードショートカットを有効にする",
        default: true,
        restartNeeded: false
    },
    enableNewTabShortcut: {
        type: OptionType.BOOLEAN,
        description: "新しいタブのキーボードショートカットを有効にする",
        default: true,
        restartNeeded: false
    },
    enableTabCycleShortcut: {
        type: OptionType.BOOLEAN,
        description: "タブ切り替えのキーボードショートカットを有効にする",
        default: true,
        restartNeeded: false
    },
    keybindsSection: {
        type: OptionType.COMPONENT,
        component: KeybindSettings
    },
    // me when storage yes for keybinds
    closeTabKeybind: {
        type: OptionType.STRING,
        description: "現在のタブを閉じるキーボードショートカット",
        default: "CTRL+W",
        hidden: true
    },
    newTabKeybind: {
        type: OptionType.STRING,
        description: "新しいタブを開くキーボードショートカット",
        default: "CTRL+T",
        hidden: true
    },
    cycleTabForwardKeybind: {
        type: OptionType.STRING,
        description: "次のタブへ切り替えるキーボードショートカット",
        default: "CTRL+TAB",
        hidden: true
    },
    cycleTabBackwardKeybind: {
        type: OptionType.STRING,
        description: "前のタブへ切り替えるキーボードショートカット",
        default: "CTRL+SHIFT+TAB",
        hidden: true
    },
    showTabNumbers: {
        type: OptionType.BOOLEAN,
        description: "キーボードショートカットを示す番号バッジをタブに表示",
        default: false,
        restartNeeded: false
    },
    tabNumberPosition: {
        type: OptionType.SELECT,
        description: "タブの番号バッジを表示する場所",
        options: [
            { label: "左側（アイコンの前）", value: "left", default: true },
            { label: "右側（コンテンツの後）", value: "right" }
        ],
        restartNeeded: false
    },
    animations: {
        type: OptionType.COMPONENT,
        component: AnimationSettings
    },
    // me when storage yes
    animationHover: {
        type: OptionType.BOOLEAN,
        description: "ホバー時の浮き上がりと拡大効果を有効にする",
        default: true,
        hidden: true
    },
    animationSelection: {
        type: OptionType.BOOLEAN,
        description: "選択時のアニメーション（枠の発光、浮き上がり）を有効にする",
        default: true,
        hidden: true
    },
    animationDragDrop: {
        type: OptionType.BOOLEAN,
        description: "ドラッグ＆ドロップのゴースト効果を有効にする",
        default: true,
        hidden: true
    },
    animationEnterExit: {
        type: OptionType.BOOLEAN,
        description: "タブの作成/終了時のスライドアニメーションを有効にする",
        default: true,
        hidden: true
    },
    animationIconPop: {
        type: OptionType.BOOLEAN,
        description: "選択時のアイコン拡大アニメーションを有効にする",
        default: true,
        hidden: true
    },
    animationCloseRotation: {
        type: OptionType.BOOLEAN,
        description: "閉じるボタンの回転アニメーションを有効にする",
        default: true,
        hidden: true
    },
    animationPlusPulse: {
        type: OptionType.BOOLEAN,
        description: "プラスボタンのパルスアニメーションを有効にする",
        default: true,
        hidden: true
    },
    animationMentionGlow: {
        type: OptionType.BOOLEAN,
        description: "メンション時の赤いパルス発光を有効にする",
        default: true,
        hidden: true
    },
    animationCompactExpand: {
        type: OptionType.BOOLEAN,
        description: "コンパクトタブのスムーズな展開を有効にする",
        default: true,
        hidden: true
    },
    animationSelectedBorder: {
        type: OptionType.BOOLEAN,
        description: "選択中タブの枠と発光スタイルを有効にする",
        default: true,
        hidden: true
    },
    animationSelectedBackground: {
        type: OptionType.BOOLEAN,
        description: "選択中タブの背景色変更を有効にする",
        default: true,
        hidden: true
    },
    animationTabShadows: {
        type: OptionType.BOOLEAN,
        description: "タブの影効果を有効にする",
        default: true,
        hidden: true
    },
    animationTabPositioning: {
        type: OptionType.BOOLEAN,
        description: "タブの位置移動時のスムーズな遷移を有効にする",
        default: true,
        hidden: true
    },
    animationResizeHandle: {
        type: OptionType.BOOLEAN,
        description: "リサイズハンドルのフェードアニメーションを有効にする",
        default: true,
        hidden: true
    },
    animationQuestsActive: {
        type: OptionType.BOOLEAN,
        description: "クエスト実行中のクエストタブのグラデーションアニメーションを有効にする",
        default: true,
        hidden: true
    },
    compactAutoExpandSelected: {
        type: OptionType.BOOLEAN,
        description: "選択時にコンパクトタブを自動で展開し、チャンネル名をすべて表示",
        default: true,
        restartNeeded: false
    },
    compactAutoExpandOnHover: {
        type: OptionType.BOOLEAN,
        description: "ホバー時にコンパクトタブを自動で展開し、チャンネル名をすべて表示",
        default: true,
        restartNeeded: false
    },
    openInNewTabAutoSwitch: {
        type: OptionType.BOOLEAN,
        description: "「新しいタブで開く」コンテキストメニューから開いたタブへ自動で切り替え",
        default: true,
        restartNeeded: false
    },
    bookmarksIndependentFromTabs: {
        type: OptionType.BOOLEAN,
        description: "ブックマークはアクティブなタブバーに影響せず独立して移動",
        default: true,
        restartNeeded: false
    },
    showResizeHandle: {
        type: OptionType.BOOLEAN,
        description: "タブにホバーしたときにタブ幅調整用のリサイズハンドルを表示",
        default: true,
        restartNeeded: false
    },
    openNewTabsInCompactMode: {
        type: OptionType.BOOLEAN,
        description: "新しく作成するタブをデフォルトでコンパクトモードで開く",
        default: false,
        restartNeeded: false
    },
    newTabButtonBehavior: {
        type: OptionType.BOOLEAN,
        description: "新規タブ（+）ボタンが右端に固定されずタブに追従",
        default: true,
        restartNeeded: false
    },
    oneTabPerServer: {
        type: OptionType.BOOLEAN,
        description: "サーバーごとにタブを1つに制限し、そのサーバーの新しいチャンネルは既存のタブで開きます。",
        default: false,
        restartNeeded: false
    },
    maxOpenTabs: {
        type: OptionType.SLIDER,
        description: "開けるタブの最大数（0 = 無制限）",
        markers: makeRange(0, 20, 1),
        default: 0,
        stickToMarkers: true,
        restartNeeded: false
    }
});
