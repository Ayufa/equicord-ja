/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { QuestTaskType } from "@vencord/discord-types/enums";
import type { JSX } from "react";

import { getQuestifySettings, useQuestifySettings } from "../settings/access";
import { resetDangerousSettings } from "../settings/dangerous";
import { autoCompleteQuestTaskTypes, defaultAutoCompleteQuestTypes, isAutoCompleteCompatible } from "../settings/def";
import { validateIgnoredQuests } from "../settings/ignoredQuests";
import { Alerts, q } from "../utils/ui";
import { ManaButton, type ManaSelectOption, SettingsCard, SettingsDescription, SettingsHeader, SettingsNotice, SettingsParagraph, SettingsSelect, SettingsSubheader, SettingsSubtleSwitch } from "./shared";

type QuestDisableSettingKey =
    | "disableAccountPanelPromo"
    | "disableAccountPanelQuestProgress"
    | "disableFriendsListPromo"
    | "disableMembersListPromo"
    | "disableOrbsAndQuestsBadges"
    | "disableRelocationNotices"
    | "disableSponsoredBanner";

type QuestModifySettingKey =
    | "autoEnrollQuests"
    | "autoCompleteQuests"
    | "autoCompleteQuestsSimultaneously"
    | "resumeInterruptedQuests"
    | "completeVideoQuestsQuicker"
    | "preventVideoQuestsPausing"
    | "hideNonAutoCompletableQuests"
    | "makeMobileVideoQuestsDesktopCompatible";

interface QuestDisableOption {
    key: QuestDisableSettingKey;
    label: string;
}

const disableFeatureOptions = [
    {
        key: "disableSponsoredBanner",
        label: "スポンサー付きバナー",
    },
    {
        key: "disableRelocationNotices",
        label: "移転のお知らせ",
    },
    {
        key: "disableFriendsListPromo",
        label: "フレンドリストのプロモーション",
    },
    {
        key: "disableMembersListPromo",
        label: "メンバーリストのプロモーション",
    },
    {
        key: "disableAccountPanelPromo",
        label: "アカウントパネルのプロモーション",
    },
    {
        key: "disableAccountPanelQuestProgress",
        label: "アカウントパネルの進捗",
    },
    {
        key: "disableOrbsAndQuestsBadges",
        label: "クエスト＆Orbsバッジ",
    },
] as const satisfies readonly QuestDisableOption[];

const disableManaOptions: ManaSelectOption[] = disableFeatureOptions.map(({ key, label }) => ({
    id: key,
    label,
    value: key,
}));

const autoCompleteQuestTypeLabels = {
    [QuestTaskType.WATCH_VIDEO]: "動画を視聴",
    [QuestTaskType.WATCH_VIDEO_ON_MOBILE]: "モバイルで動画を視聴",
    [QuestTaskType.ACHIEVEMENT_IN_ACTIVITY]: "アクティビティの実績",
    [QuestTaskType.PLAY_ACTIVITY]: "アクティビティをプレイ",
    [QuestTaskType.PLAY_ON_DESKTOP]: "デスクトップでプレイ",
    [QuestTaskType.PLAY_ON_PLAYSTATION]: "PlayStationでプレイ",
    [QuestTaskType.PLAY_ON_XBOX]: "Xboxでプレイ",
} as const satisfies Record<typeof autoCompleteQuestTaskTypes[number], string>;

const autoCompleteQuestTypeOptions = autoCompleteQuestTaskTypes.map(questType => ({
    label: autoCompleteQuestTypeLabels[questType],
    value: questType,
})) satisfies { label: string; value: QuestTaskType; }[];

const autoCompleteQuestTypeManaOptions: ManaSelectOption[] = autoCompleteQuestTypeOptions.map(({ label, value }) => ({
    id: String(value),
    label,
    value: String(value),
    disabled: !isAutoCompleteCompatible(value),
}));

export function QuestFeaturesSetting(): JSX.Element {
    const questFeatures = useQuestifySettings([
        "disableQuestsEverything",
        "disableSponsoredBanner",
        "disableRelocationNotices",
        "disableFriendsListPromo",
        "disableMembersListPromo",
        "disableAccountPanelPromo",
        "disableAccountPanelQuestProgress",
        "disableOrbsAndQuestsBadges",
        "resumeInterruptedQuests",
        "allowChangingDangerousSettings",
        "makeMobileVideoQuestsDesktopCompatible",
        "usedKonamiCode",
        "autoEnrollQuests",
        "autoCompleteQuests",
        "autoCompleteQuestsSimultaneously",
        "autoCompleteQuestTypes",
        "completeVideoQuestsQuicker",
        "preventVideoQuestsPausing",
        "hideNonAutoCompletableQuests",
    ]);

    const selectedDisableValues = disableFeatureOptions
        .filter(({ key }) => questFeatures[key])
        .map(({ key }) => key);

    const selectedAutoCompleteQuestTypeValues = autoCompleteQuestTypeOptions
        .filter(({ value }) => isAutoCompleteCompatible(value) && questFeatures.autoCompleteQuestTypes[value] === true)
        .map(({ value }) => String(value));

    function updateDisableValue(value: string | string[] | null) {
        const selectedKeys = new Set(Array.isArray(value) ? value : value ? [value] : []);

        for (const { key } of disableFeatureOptions) {
            getQuestifySettings()[key] = selectedKeys.has(key);
        }
    }

    function confirmDangerousSettingChange(body: string, onConfirm: () => void) {
        Alerts.show({
            title: "本当によろしいですか？",
            body,
            confirmText: "続行",
            confirmVariant: "critical-primary",
            cancelText: "キャンセル",
            onConfirm,
        });
    }

    function updateAutoCompleteQuestTypes(value: string | string[] | null) {
        const selectedValues = new Set(Array.isArray(value) ? value : value ? [value] : []);
        const nextAutoCompleteQuestTypes = { ...defaultAutoCompleteQuestTypes };

        for (const { value: questType } of autoCompleteQuestTypeOptions) {
            const nextValue = selectedValues.has(String(questType))
                && isAutoCompleteCompatible(questType);

            nextAutoCompleteQuestTypes[questType] = nextValue;
        }

        getQuestifySettings().autoCompleteQuestTypes = nextAutoCompleteQuestTypes;
        validateIgnoredQuests();
    }

    function updateDisableEverything(checked: boolean) {
        function setDisableEverything() {
            getQuestifySettings().disableQuestsEverything = checked;
        }

        if (checked) {
            confirmDangerousSettingChange(
                "クエスト機能が完全に無効化されます。",
                () => {
                    resetDangerousSettings();
                    setDisableEverything();
                }
            );
        } else {
            setDisableEverything();
        }
    }

    function updateDangerousAccess(checked: boolean) {
        function setDangerousAccess() {
            getQuestifySettings().allowChangingDangerousSettings = checked;
        }

        if (checked) {
            confirmDangerousSettingChange(
                "危険な設定の変更が許可されます。",
                setDangerousAccess
            );
        } else {
            resetDangerousSettings();
            setDangerousAccess();
        }
    }

    function updateModifyValue(key: QuestModifySettingKey, checked: boolean) {
        getQuestifySettings()[key] = checked;

        if (key === "hideNonAutoCompletableQuests" || key === "makeMobileVideoQuestsDesktopCompatible") {
            validateIgnoredQuests();
        }
    }

    return (
        <SettingsCard>
            <SettingsHeader> クエスト機能 </SettingsHeader>
            <SettingsDescription> クエストの動作を変更して、機能を強化したり削除したりできます。 </SettingsDescription>
            <SettingsSubheader> 機能を無効化 </SettingsSubheader>
            <SettingsSubtleSwitch
                checked={questFeatures.disableQuestsEverything}
                label="クエスト機能を完全に無効化："
                onChange={updateDisableEverything}
                bottomSpacing="10"
                tooltip={{
                    position: "top",
                    text: "すべてのプラグインの拡張機能が無効になり、Discord 全体のクエストページとクエスト要素が非表示になり、Discord がクエストデータを取得しなくなります。ショップには影響しません（Orbs はショップの第二の通貨として深く結びついているためです）。"
                }}
            />
            <SettingsSelect
                label="無効化する機能を選択："
                wrapTags={true}
                options={disableManaOptions}
                value={selectedDisableValues}
                closeOnSelect={false}
                maxOptionsVisible={7}
                selectionMode="multiple"
                disabled={questFeatures.disableQuestsEverything}
                onSelectionChange={updateDisableValue}
                tooltip={{
                    position: "top",
                    text: "スポンサー付きバナーは、クエストページの上部に表示される有料のクエストバナーです。"
                        + "\n\n移転のお知らせは、クエストが DM に移動することなどを知らせる、発見ページなどに表示される案内です。"
                        + "\n\nフレンドリストのプロモーションは、サーバーを共有しているユーザーが有効なクエストのあるゲームをプレイしている間、フレンドリストの「Active Now」セクションに表示されるカードです。"
                        + "\n\nメンバーリストのプロモーションは、有効なクエストのあるゲームをプレイしている間、サーバーのメンバーリストのメンバーに表示されるアイコンです。"
                        + "\n\nアカウントパネルのプロモーションは、ユーザーアカウントパネルの上に表示される有料のクエスト宣伝です。"
                        + "\n\nアカウントパネルの進捗は、ユーザーアカウントパネルの上に表示される、進行中または完了したクエストの進捗です。"
                        + "\n\nクエスト＆Orbsバッジは、クエストを少なくとも1つ完了したとき、または Orbs バッジを購入したときにユーザープロフィールに表示されるバッジです。"
                }}
            />
            <SettingsSubheader> 機能を変更 </SettingsSubheader>
            <SettingsNotice className={["notice-card-red", questFeatures.disableQuestsEverything ? "dimmed-settings-item" : undefined, questFeatures.allowChangingDangerousSettings ? undefined : "notice-card-solo", "no-bottom-margin"].filter(c => c !== undefined)}>
                <SettingsParagraph>
                    Discord は、クエストの完了方法を変更するスクリプトやプラグインの使用者を処分することが知られています。クエストの完了方法を変更することは、Discord の<a href="https://discord.com/safety/platform-manipulation-policy-explainer" target="_blank" rel="noreferrer">利用規約</a>に違反します。
                </SettingsParagraph>
                <br />
                <SettingsParagraph>
                    処分は、クエストとその報酬へのアクセスを一時的または永久的に失うことです。<strong>さらに、違反1件ごとに2年間続くアカウントステータス違反も含まれます。</strong>
                </SettingsParagraph>
                <br />
                <SettingsParagraph>
                    Discord はユーザーを追跡するためにさまざまな手段を用いているため、検出を現実的に回避する方法はありません。続行する場合は、いずれ Discord に使用を検出される可能性が高いことを理解してください。
                </SettingsParagraph>
                <br />
                <SettingsParagraph>
                    以下のボタンを使って、自己責任で潜在的に危険な設定にアクセスしてください。
                </SettingsParagraph>
                <div className={q("settings-button", "allow-dangerous-button")}>
                    <ManaButton
                        text={questFeatures.allowChangingDangerousSettings
                            ? "危険な設定をリセットして変更を禁止する..."
                            : "危険な設定の変更を許可する..."}
                        variant={questFeatures.allowChangingDangerousSettings ? "critical-secondary" : "critical-primary"}
                        fullWidth={true}
                        disabled={questFeatures.disableQuestsEverything}
                        onClick={() => updateDangerousAccess(!questFeatures.allowChangingDangerousSettings)}
                        size="sm"
                    />
                </div>
                <div style={{ display: questFeatures.allowChangingDangerousSettings ? undefined : "none" }}>
                    <SettingsSubtleSwitch
                        disabled={questFeatures.disableQuestsEverything || !questFeatures.allowChangingDangerousSettings}
                        checked={questFeatures.hideNonAutoCompletableQuests}
                        label="自動完了できないクエストを非表示："
                        onChange={checked => updateModifyValue("hideNonAutoCompletableQuests", checked)}
                        topSpacing="10"
                        bottomSpacing="5"
                        tooltip={{
                            position: "top",
                            text: "このプラットフォームで対応し、クエスト種別のドロップダウンで有効になっている自動完了タスクがない場合に、未受け取りまたは無視状態の未完了クエストを隠します。受け取り済み、期限切れ、完了済みのクエストは対象外です。それらのクエストを隠すには、ステータス表示順の非表示オプションを使用してください。"
                        }}
                    />
                    <SettingsSubtleSwitch
                        disabled={questFeatures.disableQuestsEverything || !questFeatures.allowChangingDangerousSettings}
                        checked={questFeatures.completeVideoQuestsQuicker}
                        label="動画クエストの自動完了を高速化："
                        onChange={checked => updateModifyValue("completeVideoQuestsQuicker", checked)}
                        bottomSpacing="5"
                        tooltip={{
                            position: "top",
                            text: "Discord では、クエストに登録してから動画の長さより24秒短い時間が経過すれば、動画クエストを完了できます。"
                                + "\n\nつまり、動画クエストが24秒以下だったり、登録した後に戻ってきて完了したりする場合は、即座に完了できます。"
                                + "\n\nこの設定は動画クエストの自動完了にのみ適用され、下の自動完了設定に依存します。動画クエストを手動で完了する場合は、引き続き全時間待つ必要があり、登録時刻には依存しません。"
                        }}
                    />
                    <SettingsSubtleSwitch
                        disabled={questFeatures.disableQuestsEverything || !questFeatures.allowChangingDangerousSettings}
                        checked={questFeatures.preventVideoQuestsPausing}
                        label="フォーカスを失ったときに動画クエストが一時停止しないようにする："
                        onChange={checked => updateModifyValue("preventVideoQuestsPausing", checked)}
                        bottomSpacing="5"
                        tooltip={{
                            position: "top",
                            text: "Discord では、動画クエストの動画を再生するにはクライアントにフォーカスが当たっている必要があります。"
                                + "\n\nこの設定により動画が一時停止しなくなり、完了までの進捗が通常通り進みます。"
                                + "\n\nこの設定は動画クエストを手動で完了する場合にのみ適用されます。"
                        }}
                    />
                    <SettingsSubtleSwitch
                        disabled={questFeatures.disableQuestsEverything || !questFeatures.allowChangingDangerousSettings}
                        checked={questFeatures.makeMobileVideoQuestsDesktopCompatible}
                        label="一部のモバイル専用動画クエストをデスクトップで完了できるようにする："
                        onChange={checked => updateModifyValue("makeMobileVideoQuestsDesktopCompatible", checked)}
                        bottomSpacing="5"
                        tooltip={{
                            position: "top",
                            text: "一部のモバイル専用動画クエストはデスクトップで登録できますが、完了はモバイルで行う必要があります。この設定により、それらをデスクトップで完了できるようになります。"
                                + "\n\n一部のモバイル専用動画クエストはモバイルでのみ登録できます。この設定をそれらに適用するには、デスクトップに戻ってクエストを更新する前に、モバイル端末でそれらのクエストに登録しておく必要があります。"
                                + "\n\nこの設定を単独で有効にした場合、動画クエストの手動完了にのみ適用されます。デスクトップからモバイル動画クエストを自動完了するには下の自動完了設定が必要で、この設定も暗黙的に有効になります。"
                        }}
                    />
                    <SettingsSubtleSwitch
                        disabled={questFeatures.disableQuestsEverything || !questFeatures.allowChangingDangerousSettings}
                        checked={questFeatures.autoCompleteQuestsSimultaneously}
                        label="クエストを順番ではなく同時に自動完了："
                        onChange={checked => updateModifyValue("autoCompleteQuestsSimultaneously", checked)}
                        bottomSpacing="5"
                        tooltip={{
                            position: "top",
                            text: "デフォルトでは、複数のクエストを自動完了しようとすると、順番に完了するようキューに入れられます。"
                                + "\n\nこの設定では代わりに、すべての自動完了クエストを同時に実行できるようになります。"
                                + "\n\nこの設定はクエストの自動完了にのみ適用され、下の自動完了設定に依存します。"
                        }}
                    />
                    <SettingsSubtleSwitch
                        disabled={questFeatures.disableQuestsEverything || !questFeatures.allowChangingDangerousSettings}
                        checked={questFeatures.resumeInterruptedQuests}
                        label="再読み込みや再起動の後に、中断された自動完了を再開："
                        onChange={checked => updateModifyValue("resumeInterruptedQuests", checked)}
                        bottomSpacing="5"
                        tooltip={{
                            position: "top",
                            text: "再読み込みや再起動で中断された自動完了を自動的に再開します。キューに入っていたがまだ自動完了が始まっていなかったクエストの再キューも含みます。"
                        }}
                    />
                    {questFeatures.usedKonamiCode === true && (
                        <>
                            <SettingsSubtleSwitch
                                disabled={questFeatures.disableQuestsEverything || !questFeatures.allowChangingDangerousSettings}
                                checked={questFeatures.autoCompleteQuests}
                                label="対応クエストを自動的に処理して自動完了する："
                                onChange={checked => updateModifyValue("autoCompleteQuests", checked)}
                                bottomSpacing="5"
                                tooltip={{
                                    position: "top",
                                    text: "Discord の実行中に検出された、報酬とクエスト種別のフィルターに含まれる、対象で未受け取り・無視されておらず・期限切れでないクエストを完了します。下で有効にした対応タスク種別のみが含まれます。"
                                        + "\n\n対応するクエストに自動登録してから、自動完了のキューに入れます。既知のレート制限のクールダウンは待ちます。不明なエラー、リトライ遅延のないレート制限、登録の繰り返し失敗が発生した場合は停止します。"
                                }}
                            />
                            <SettingsSubtleSwitch
                                disabled={questFeatures.disableQuestsEverything || !questFeatures.allowChangingDangerousSettings}
                                checked={questFeatures.autoEnrollQuests}
                                label="対応するクエストに自動登録する。"
                                onChange={checked => updateModifyValue("autoEnrollQuests", checked)}
                                bottomSpacing="5"
                                tooltip={{
                                    position: "top",
                                    text: "Discord の実行中に検出された、報酬とクエスト種別のフィルターに含まれる、対象で未受け取り・無視されておらず・期限切れでないクエストに登録します。"
                                        + "\n\n自動完了のキューには入れずにクエストへ登録します。既知のレート制限のクールダウンは待ちます。不明なエラー、リトライ遅延のないレート制限、登録の繰り返し失敗が発生した場合は停止します。"
                                }}
                            />
                        </>
                    )}
                    <SettingsSelect
                        label="自動完了するクエスト種別を選択："
                        wrapTags={true}
                        options={autoCompleteQuestTypeManaOptions}
                        value={selectedAutoCompleteQuestTypeValues}
                        closeOnSelect={false}
                        maxOptionsVisible={7}
                        selectionMode="multiple"
                        disabled={questFeatures.disableQuestsEverything || !questFeatures.allowChangingDangerousSettings}
                        onSelectionChange={updateAutoCompleteQuestTypes}
                        tooltip={{
                            position: "top",
                            wider: true,
                            text: "「モバイルで動画を視聴」クエストは、デスクトップで登録できるモバイルクエストでのみ動作します。登録がモバイルに制限されているクエストの場合は、デスクトップに戻ってクエストを更新する前に、まずモバイル端末で登録する必要があります。"
                                + "\n\nすべての動画関連クエストは通常、進捗報告と一緒にスタックトレースを送信します。つまり Discord はどの関数が呼ばれたかを正確に把握でき、自社の関数が進捗を開始したかどうかを検証できます。Questify はこのスタックトレースを消去しますが、それが無いこと自体も、存在する場合と同様に痕跡となります。"
                                + "\n\n「デスクトップでプレイ」「PlayStationでプレイ」「Xboxでプレイ」「アクティビティをプレイ」「アクティビティの実績」クエストは、Discord の制限により公式デスクトップクライアントでのみ利用できます。ウェブ拡張機能、Vesktop、Equibop などのサードパーティ製クライアントは、これらのクエスト種別の自動完了に対応していません。"
                                + "\n\nすべてのゲーム関連クエストは通常、ハートビート報告と一緒にゲームのフィンガープリントを送信します。つまり Discord は何万人ものユーザーのデータを使って、他のユーザーが本物のゲームを使っているか、実行ファイルをエミュレートしているかを判定できます。この値を合理的に偽装する方法はないため、Questify は空白のままにしていますが、それが無いこと自体も、下手に偽装した場合と同じくらい痕跡となります。"
                                + "\n\n自動完了は、クエストページのクエストボタン、または自動処理から開始されます。クエストはキューに入れられた順に完了します（上の同時完了が有効な場合を除きます）。"
                                + "\n\nクエストの自動完了は、利用できる危険な設定の中で最もリスクが高いものです。自己責任で有効にしてください。"
                        }}
                    />
                </div>
            </SettingsNotice>
        </SettingsCard>
    );
}
