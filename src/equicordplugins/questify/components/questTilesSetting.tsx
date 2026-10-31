/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { Quest } from "@vencord/discord-types";
import { findComponentByCodeLazy } from "@webpack";
import { QuestStore, useMemo, useState, useStateFromStores } from "@webpack/common";
import type { JSX } from "react";

import { enabledOnStartup } from "..";
import { getQuestifySettings, useQuestifySettings } from "../settings/access";
import { defaultQuestTileClaimedColorSetting, defaultQuestTileExpiredColorSetting, defaultQuestTileIgnoredColorSetting, defaultQuestTileUnclaimedColorSetting, type QuestTileColorSetting, type QuestTileGradient } from "../settings/def";
import { rerenderQuests } from "../settings/rerender";
import { getQuestTileClasses, getQuestTileStyle } from "../utils/questTiles";
import { q } from "../utils/ui";
import { ManaButton, type ManaSelectOption, SettingsCard, SettingsColorPicker, SettingsDescription, SettingsHeader, SettingsRow, SettingsRowItem, SettingsSelect, SettingsSubheader } from "./shared";

const QuestTile = findComponentByCodeLazy(".rowIndex,trackGuildAndChannelMetadata") as React.ComponentType<{
    className?: string;
    quest: Quest;
}>;

const gradientOptions = [
    { label: "再スタイルグラデーション（強め）", value: "intense" },
    { label: "再スタイルグラデーション（標準）", value: "default" },
    { label: "控えめな黒グラデーション", value: "black" },
    { label: "グラデーションなし", value: "hide" },
] as const satisfies readonly { label: string, value: QuestTileGradient; }[];

const gradientManaOptions: ManaSelectOption[] = gradientOptions.map(({ label, value }) => ({
    id: value,
    label,
    value,
}));

const preloadManaOptions: ManaSelectOption[] = [
    { id: "true", label: "ページ読み込み時にすべてのクエストアセットを読み込む", value: "true" },
    { id: "false", label: "ページスクロール中にクエストアセットを読み込む", value: "false" },
];

type QuestTileColorKey =
    | "questTileUnclaimedColor"
    | "questTileClaimedColor"
    | "questTileIgnoredColor"
    | "questTileExpiredColor";

interface QuestTileColorOption {
    key: QuestTileColorKey;
    label: string;
    defaultValue: QuestTileColorSetting;
}

const colorOptions = [
    {
        key: "questTileUnclaimedColor",
        label: "未受け取り",
        defaultValue: defaultQuestTileUnclaimedColorSetting,
    },
    {
        key: "questTileClaimedColor",
        label: "受け取り済み",
        defaultValue: defaultQuestTileClaimedColorSetting,
    },
    {
        key: "questTileIgnoredColor",
        label: "無視済み",
        defaultValue: defaultQuestTileIgnoredColorSetting,
    },
    {
        key: "questTileExpiredColor",
        label: "期限切れ",
        defaultValue: defaultQuestTileExpiredColorSetting,
    },
] as const satisfies readonly QuestTileColorOption[];

const defaultPreviewColorKey: QuestTileColorKey = "questTileUnclaimedColor";

function getRandomQuest(): Quest | null {
    const quests = Array.from(QuestStore.quests.values());
    return quests.length > 0 ? quests[Math.floor(Math.random() * quests.length)] : null;
}

function cloneDummyQuest(quest: Quest, dummyColor: QuestTileColorSetting): Quest & { dummyColor: QuestTileColorSetting; } {
    return {
        ...structuredClone(quest),
        dummyColor,
    };
}

function DummyQuestTile({
    disabled,
    dummyQuest,
    dummyGradient,
}: {
    disabled?: boolean;
    dummyQuest: Quest & { dummyColor: QuestTileColorSetting; };
    dummyGradient: QuestTileGradient;
}): JSX.Element {
    const classes = getQuestTileClasses(q("dummy-quest"), dummyQuest, dummyGradient);
    const style = getQuestTileStyle(dummyQuest);

    return (
        <div
            className={q("dummy-quest-preview", disabled ? "dimmed-settings-item" : undefined)}
            style={style}
            inert={true}
        >
            <QuestTile
                className={classes}
                quest={dummyQuest}
            />
        </div>
    );
}

function DummyQuestPreview({
    disabled,
    dummyColor,
    dummyGradient,
}: {
    disabled?: boolean;
    dummyColor: QuestTileColorSetting;
    dummyGradient: QuestTileGradient;
}): JSX.Element | null {
    const sourceQuest = useStateFromStores([QuestStore], getRandomQuest);

    const dummyQuest = useMemo(
        () => sourceQuest ? cloneDummyQuest(sourceQuest, dummyColor) : null,
        [dummyColor, sourceQuest]
    );

    if (!dummyQuest) return null;

    return (
        <DummyQuestTile
            disabled={disabled}
            dummyQuest={dummyQuest}
            dummyGradient={dummyGradient}
        />
    );
}

export function QuestTilesSetting(): JSX.Element {
    const questTiles = useQuestifySettings([
        "disableQuestsEverything",
        "questTileUnclaimedColor",
        "questTileClaimedColor",
        "questTileIgnoredColor",
        "questTileExpiredColor",
        "questTileGradient",
        "questTilePreload",
    ]);

    const [previewColorKey, setPreviewColorKey] = useState<QuestTileColorKey>(defaultPreviewColorKey);

    const disabled = questTiles.disableQuestsEverything;
    const previewColor = questTiles[previewColorKey] as QuestTileColorSetting;

    function updateColor(key: QuestTileColorKey, nextColor: QuestTileColorSetting): void {
        setPreviewColorKey(key);
        getQuestifySettings()[key] = nextColor;
    }

    function updateColorValue(key: QuestTileColorKey, setting: QuestTileColorSetting, value: number | null): void {
        if (typeof value !== "number") return;

        updateColor(key, {
            enabled: setting.enabled,
            color: value,
        });
    }

    function updateColorEnabled(key: QuestTileColorKey, setting: QuestTileColorSetting, enabled: boolean): void {
        updateColor(key, {
            ...setting,
            enabled,
        });
    }

    function updateGradient(value: string | string[] | null): void {
        if (typeof value !== "string") return;

        getQuestifySettings().questTileGradient = value as QuestTileGradient;
    }

    function updatePreload(value: string | string[] | null): void {
        if (typeof value !== "string") return;

        const preload = value === "true";
        getQuestifySettings().questTilePreload = preload;
        rerenderQuests();
    }

    return (
        <SettingsCard>
            <SettingsHeader> クエストタイル </SettingsHeader>
            <SettingsDescription> 見やすくするために、任意のテーマカラーでクエストをハイライトします。 </SettingsDescription>
            <SettingsSubheader> タイルの動作 </SettingsSubheader>
            <SettingsRow className="quest-tile-behavior-row">
                <SettingsRowItem className="quest-tile-gradient-row-item">
                    <SettingsSelect
                        label="グラデーションスタイル:"
                        options={gradientManaOptions}
                        value={questTiles.questTileGradient}
                        selectionMode="single"
                        disabled={disabled}
                        fullWidth={true}
                        maxOptionsVisible={gradientManaOptions.length}
                        onSelectionChange={updateGradient}
                        tooltip={{
                            position: "top",
                            text: "「強め」と「標準」は、選択したタイルの色をアセットのグラデーションに使います。"
                                + "\n\n「控えめな黒」は、コントラストのために暗めの中立的なグラデーションを維持します。"
                                + "\n\n「グラデーションなし」はアセットのグラデーションを取り除くため、一部のクエストアートワークが見づらくなる場合があります。"
                        }}
                    />
                </SettingsRowItem>
                <SettingsRowItem className="quest-tile-preload-row-item">
                    <SettingsSelect
                        label="アセットの先読み:"
                        options={preloadManaOptions}
                        value={String(questTiles.questTilePreload)}
                        selectionMode="single"
                        disabled={disabled}
                        fullWidth={true}
                        maxOptionsVisible={preloadManaOptions.length}
                        onSelectionChange={updatePreload}
                        tooltip={{
                            position: "top",
                            text: "クエストページを開いたときにすべてのアセットを読み込むと、スクロール中のレイアウトのずれが減ります。"
                                + "\n\nページスクロール中に読み込む方式は Discord のデフォルトの動作に近く、初期の処理量が少なくなる場合があります。"
                        }}
                    />
                </SettingsRowItem>
            </SettingsRow>
            <SettingsSubheader> タイルの色 </SettingsSubheader>
            <SettingsRow className="quest-tile-color-row">
                {colorOptions.map(({ key, label }) => {
                    const setting = questTiles[key] as QuestTileColorSetting;

                    return (
                        <SettingsRowItem key={key} className="quest-tile-color-row-item">
                            <div
                                onFocusCapture={() => setPreviewColorKey(key)}
                                onPointerDownCapture={() => setPreviewColorKey(key)}
                            >
                                <SettingsColorPicker
                                    label={`${label}:`}
                                    className={["quest-tile-color-picker", setting.enabled ? "" : "disabled-color-picker"].filter(Boolean)}
                                    color={setting.color}
                                    disabled={disabled || !setting.enabled}
                                    onChange={value => updateColorValue(key, setting, value)}
                                    showEyeDropper={true}
                                />
                            </div>
                            <div className={q("settings-button", "quest-tile-color-button")}>
                                <ManaButton
                                    text={setting.enabled ? "無効化" : "有効化"}
                                    variant={setting.enabled ? "critical-secondary" : "primary"}
                                    disabled={disabled}
                                    fullWidth={true}
                                    size="sm"
                                    onClick={() => updateColorEnabled(key, setting, !setting.enabled)}
                                />
                            </div>
                        </SettingsRowItem>
                    );
                })}
            </SettingsRow>
            {enabledOnStartup && <DummyQuestPreview
                disabled={disabled}
                dummyColor={previewColor}
                dummyGradient={questTiles.questTileGradient as QuestTileGradient}
            />}
        </SettingsCard>
    );
}
