/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { QuestRewardType, QuestTaskType } from "@vencord/discord-types/enums";
import type { JSX } from "react";

import { enabledOnStartup } from "..";
import { getQuestifySettings, useQuestifySettings } from "../settings/access";
import { type QuestButtonAction, type QuestButtonDisplayMode, type QuestButtonIncludedTypes, type QuestButtonIndicatorMode } from "../settings/def";
import { startAutoFetchingQuests } from "../settings/fetching";
import { validateIgnoredQuests } from "../settings/ignoredQuests";
import { canShowBadge, canShowButton, canShowPill } from "../utils/ui";
import { DummyQuestButton } from "./questButton";
import { type ManaSelectOption, SettingsCard, SettingsColorPicker, SettingsDescription, SettingsHeader, SettingsRow, SettingsRowItem, SettingsSelect, SettingsSubheader } from "./shared";

interface QuestButtonIncludedTypeOption {
    label: string;
    value: QuestTaskType | QuestRewardType;
}

const questButtonDisplayOptions = [
    { label: "常に表示", value: "always" },
    { label: "未受け取り", value: "unclaimed" },
    { label: "表示しない", value: "never" },
] as const satisfies readonly { label: string; value: QuestButtonDisplayMode; }[];

const questButtonIndicatorOptions = [
    { label: "ピル", value: "pill" },
    { label: "バッジ", value: "badge" },
    { label: "両方", value: "both" },
    { label: "なし", value: "none" },
] as const satisfies readonly { label: string; value: QuestButtonIndicatorMode; }[];

const questButtonClickOptions = [
    { label: "クエストを開く", value: "open-quests" },
    { label: "コンテキストメニュー", value: "context-menu" },
    { label: "プラグイン設定", value: "plugin-settings" },
    { label: "何もしない", value: "nothing" },
] as const satisfies readonly { label: string; value: QuestButtonAction; }[];

const questButtonRewardTypeOptions = [
    { label: "Orbs", value: QuestRewardType.VIRTUAL_CURRENCY },
    { label: "Nitroコード", value: QuestRewardType.FRACTIONAL_PREMIUM },
    { label: "報酬コード", value: QuestRewardType.REWARD_CODE },
    { label: "ゲーム内アイテム", value: QuestRewardType.IN_GAME },
    { label: "プロフィールコレクティブル", value: QuestRewardType.COLLECTIBLE },
] as const satisfies readonly QuestButtonIncludedTypeOption[];

const questButtonQuestTypeOptions = [
    { label: "動画を視聴", value: QuestTaskType.WATCH_VIDEO },
    { label: "モバイルで動画を視聴", value: QuestTaskType.WATCH_VIDEO_ON_MOBILE },
    { label: "アクティビティでの実績", value: QuestTaskType.ACHIEVEMENT_IN_ACTIVITY },
    { label: "ゲームでの実績", value: QuestTaskType.ACHIEVEMENT_IN_GAME },
    { label: "アクティビティをプレイ", value: QuestTaskType.PLAY_ACTIVITY },
    { label: "デスクトップでプレイ", value: QuestTaskType.PLAY_ON_DESKTOP },
    { label: "デスクトップでプレイ V2", value: QuestTaskType.PLAY_ON_DESKTOP_V2 },
    { label: "デスクトップで配信", value: QuestTaskType.STREAM_ON_DESKTOP },
    { label: "PlayStationでプレイ", value: QuestTaskType.PLAY_ON_PLAYSTATION },
    { label: "Xboxでプレイ", value: QuestTaskType.PLAY_ON_XBOX },
] as const satisfies readonly QuestButtonIncludedTypeOption[];

function toManaOptions<T extends string | number>(options: readonly { label: string; value: T; }[]): ManaSelectOption[] {
    return options.map(({ label, value }) => ({
        id: String(value),
        label,
        value: String(value),
    }));
}

const questButtonDisplayManaOptions = toManaOptions(questButtonDisplayOptions);
const questButtonIndicatorManaOptions = toManaOptions(questButtonIndicatorOptions);
const questButtonClickManaOptions = toManaOptions(questButtonClickOptions);
const questButtonRewardTypeManaOptions = toManaOptions(questButtonRewardTypeOptions);
const questButtonQuestTypeManaOptions = toManaOptions(questButtonQuestTypeOptions);

export function QuestButtonSetting(): JSX.Element {
    const questButton = useQuestifySettings([
        "disableQuestsEverything",
        "questButtonDisplay",
        "questButtonIncludedTypes",
        "questButtonIndicator",
        "questButtonBadgeCount",
        "questButtonBadgeColor",
        "questButtonLeftClickAction",
        "questButtonMiddleClickAction",
        "questButtonRightClickAction",
    ]);

    const disabled = questButton.disableQuestsEverything;
    const includedTypes = questButton.questButtonIncludedTypes as QuestButtonIncludedTypes;

    const selectedRewardTypes = questButtonRewardTypeOptions
        .filter(({ value }) => includedTypes[value])
        .map(({ value }) => String(value));

    const selectedQuestTypes = questButtonQuestTypeOptions
        .filter(({ value }) => includedTypes[value])
        .map(({ value }) => String(value));

    function updateQuestButtonDisplay(value: string | string[] | null) {
        if (typeof value !== "string") return;

        getQuestifySettings().questButtonDisplay = value as QuestButtonDisplayMode;
        startAutoFetchingQuests(true);
    }

    function updateQuestButtonIndicator(value: string | string[] | null) {
        if (typeof value !== "string") return;

        getQuestifySettings().questButtonIndicator = value as QuestButtonIndicatorMode;
        startAutoFetchingQuests(true);
    }

    function updateQuestButtonAction(key: "questButtonLeftClickAction" | "questButtonMiddleClickAction" | "questButtonRightClickAction", value: string | string[] | null) {
        if (typeof value !== "string") return;

        getQuestifySettings()[key] = value as QuestButtonAction;
    }

    function updateBadgeColor(value: number | null) {
        getQuestifySettings().questButtonBadgeColor = value;
    }

    function updateIncludedTypes(options: readonly QuestButtonIncludedTypeOption[], value: string | string[] | null) {
        const selectedValues = new Set(Array.isArray(value) ? value : value ? [value] : []);
        const nextIncludedTypes = { ...getQuestifySettings().questButtonIncludedTypes };

        for (const option of options) {
            nextIncludedTypes[option.value] = selectedValues.has(String(option.value));
        }

        getQuestifySettings().questButtonIncludedTypes = nextIncludedTypes;
        validateIgnoredQuests();
    }

    return (
        <SettingsCard>
            <SettingsRow>
                <SettingsRowItem>
                    <SettingsHeader> クエストボタン </SettingsHeader>
                    <SettingsDescription> サーバーリストにクエストボタンを表示し、未受け取りで無視されていないクエストのインジケーターを任意で表示します。 </SettingsDescription>
                </SettingsRowItem>
                {enabledOnStartup && <SettingsRowItem width="content">
                    <DummyQuestButton
                        badgeColor={questButton.questButtonBadgeColor}
                        leftClickAction={questButton.questButtonLeftClickAction}
                        middleClickAction={questButton.questButtonMiddleClickAction}
                        rightClickAction={questButton.questButtonRightClickAction}
                        showBadge={canShowBadge(questButton.questButtonIndicator)}
                        showPill={canShowPill(questButton.questButtonIndicator)}
                        visible={canShowButton(questButton.questButtonDisplay)}
                    />
                </SettingsRowItem>}
            </SettingsRow>
            <SettingsSubheader className="no-top-margin"> ボタンの動作 </SettingsSubheader>
            <SettingsRow>
                <SettingsRowItem>
                    <SettingsSelect
                        label="左クリック時の動作:"
                        options={questButtonClickManaOptions}
                        value={questButton.questButtonLeftClickAction}
                        selectionMode="single"
                        disabled={disabled}
                        fullWidth={true}
                        onSelectionChange={value => updateQuestButtonAction("questButtonLeftClickAction", value)}
                    />
                </SettingsRowItem>
                <SettingsRowItem>
                    <SettingsSelect
                        label="中クリック時の動作:"
                        options={questButtonClickManaOptions}
                        value={questButton.questButtonMiddleClickAction}
                        selectionMode="single"
                        disabled={disabled}
                        fullWidth={true}
                        onSelectionChange={value => updateQuestButtonAction("questButtonMiddleClickAction", value)}
                    />
                </SettingsRowItem>
                <SettingsRowItem>
                    <SettingsSelect
                        label="右クリック時の動作:"
                        options={questButtonClickManaOptions}
                        value={questButton.questButtonRightClickAction}
                        selectionMode="single"
                        disabled={disabled}
                        fullWidth={true}
                        onSelectionChange={value => updateQuestButtonAction("questButtonRightClickAction", value)}
                    />
                </SettingsRowItem>
            </SettingsRow>
            <SettingsRow>
                <SettingsRowItem>
                    <SettingsSelect
                        label="ボタンの表示:"
                        options={questButtonDisplayManaOptions}
                        value={questButton.questButtonDisplay}
                        selectionMode="single"
                        disabled={disabled}
                        fullWidth={true}
                        onSelectionChange={updateQuestButtonDisplay}
                        tooltip={{
                            position: "top",
                            text: "この機能が有効な間、クエストボタンを常に表示します。"
                                + "\n\n「未受け取り」は、関連する未受け取りのクエスト報酬がある間だけ表示します。"
                                + "\n\n「表示しない」はクエストボタンを隠します。"
                        }}
                    />
                </SettingsRowItem>
                <SettingsRowItem>
                    <SettingsSelect
                        label="未受け取りインジケーター:"
                        options={questButtonIndicatorManaOptions}
                        value={questButton.questButtonIndicator}
                        selectionMode="single"
                        disabled={disabled}
                        fullWidth={true}
                        onSelectionChange={updateQuestButtonIndicator}
                        tooltip={{
                            position: "top",
                            text: "「ピル」は、クエストボタンの横に Discord の未読風マーカーを表示します。"
                                + "\n\n「バッジ」は、関連する未受け取りのクエスト報酬の数を表示します。"
                                + "\n\n「両方」はピルとバッジを両方表示します。"
                                + "\n\n「なし」は未受け取りインジケーターを隠します。"
                        }}
                    />
                </SettingsRowItem>
                <SettingsRowItem>
                    <SettingsColorPicker
                        label="バッジの色:"
                        className="quest-button-color-picker"
                        color={questButton.questButtonBadgeColor}
                        disabled={disabled}
                        onChange={updateBadgeColor}
                        showEyeDropper={true}
                    />
                </SettingsRowItem>
            </SettingsRow>
            <SettingsSubheader> クエストの関連性 </SettingsSubheader>
            <SettingsSelect
                label="対象の報酬タイプ:"
                wrapTags={true}
                options={questButtonRewardTypeManaOptions}
                value={selectedRewardTypes}
                closeOnSelect={false}
                maxOptionsVisible={questButtonRewardTypeManaOptions.length}
                selectionMode="multiple"
                disabled={disabled}
                fullWidth={true}
                onSelectionChange={value => updateIncludedTypes(questButtonRewardTypeOptions, value)}
                tooltip={{
                    position: "top",
                    text: "ボタンの表示、バッジの数、アラートの動作を決める際に、これらの報酬タイプのクエストのみを未受け取りとして数えます。"
                }}
            />
            <SettingsSelect
                label="対象のクエストタイプ:"
                labelClassName="margin-top-9"
                wrapTags={true}
                options={questButtonQuestTypeManaOptions}
                value={selectedQuestTypes}
                closeOnSelect={false}
                maxOptionsVisible={questButtonQuestTypeManaOptions.length}
                selectionMode="multiple"
                disabled={disabled}
                fullWidth={true}
                onSelectionChange={value => updateIncludedTypes(questButtonQuestTypeOptions, value)}
                tooltip={{
                    position: "top",
                    text: "ボタンの表示、バッジの数、アラートの動作を決める際に、これらのタスクタイプのクエストのみを未受け取りとして数えます。"
                }}
            />
        </SettingsCard>
    );
}
