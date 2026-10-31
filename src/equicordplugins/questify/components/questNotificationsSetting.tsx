/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { type AudioPlayerInterface, createAudioPlayer, defaultAudioNames } from "@api/AudioPlayer";
import { useEffect, useMemo, useRef, useState } from "@webpack/common";
import type { JSX, MouseEvent } from "react";

import { getQuestifySettings, useQuestifySettings } from "../settings/access";
import { startAutoFetchingQuests } from "../settings/fetching";
import { q } from "../utils/ui";
import { ManaSelectFormattedOption, ManaSelectOption, SettingsCard, SettingsDescription, SettingsHeader, SettingsRow, SettingsRowItem, SettingsSelect, SettingsSlider, SettingsSubheader, SettingsSubtleSwitch } from "./shared";

const questFetchIntervalOptions = [
    { id: "30-minutes", label: "30分", value: String(30 * 60) },
    { id: "45-minutes", label: "45分", value: String(45 * 60) },
    { id: "1-hour", label: "1時間", value: String(60 * 60) },
    { id: "3-hours", label: "3時間", value: String(3 * 60 * 60) },
    { id: "6-hours", label: "6時間", value: String(6 * 60 * 60) },
    { id: "12-hours", label: "12時間", value: String(12 * 60 * 60) },
] satisfies ManaSelectOption[];

function SoundIcon({ className }: { className?: string; }): JSX.Element {
    return (
        <svg
            viewBox="0 0 24 24"
            height={18}
            width={18}
            fill="none"
            className={className}
            aria-hidden={true}
        >
            <path fill="currentColor" d="M12 3a1 1 0 0 0-1-1h-.06a1 1 0 0 0-.74.32L5.92 7H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2.92l4.28 4.68a1 1 0 0 0 .74.32H11a1 1 0 0 0 1-1V3ZM15.1 20.75c-.58.14-1.1-.33-1.1-.92v-.03c0-.5.37-.92.85-1.05a7 7 0 0 0 0-13.5A1.11 1.11 0 0 1 14 4.2v-.03c0-.6.52-1.06 1.1-.92a9 9 0 0 1 0 17.5Z" />
            <path fill="currentColor" d="M15.16 16.51c-.57.28-1.16-.2-1.16-.83v-.14c0-.43.28-.8.63-1.02a3 3 0 0 0 0-5.04c-.35-.23-.63-.6-.63-1.02v-.14c0-.63.59-1.1 1.16-.83a5 5 0 0 1 0 9.02Z" />
        </svg>
    );
}

function getSoundOptions(): ManaSelectOption[] {
    return defaultAudioNames()
        .map(sound => ({
            id: sound,
            label: formatSoundName(sound),
            value: sound,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
}

function formatSoundName(sound: string): string {
    return sound
        .toUpperCase()
        .replace(/_/g, " ")
        .replace(/(\d+)/g, " $1");
}

interface QuestNotificationSoundSelectProps {
    disabled?: boolean;
    label: string;
    onChange: (value: string | null) => void;
    onPreview: (sound: string) => void;
    options: ManaSelectOption[];
    playingSound: string | null;
    tooltip?: { position: "top" | "bottom", text: string; };
    value: string | null;
}

function QuestNotificationSoundSelect({
    disabled,
    label,
    onChange,
    onPreview,
    options,
    playingSound,
    tooltip,
    value,
}: QuestNotificationSoundSelectProps): JSX.Element {
    function formatOption(option: ManaSelectOption): ManaSelectFormattedOption {
        const sound = option.value || null;
        const isPlaying = sound != null && playingSound === sound;

        function handlePreviewMouseDown(event: MouseEvent<HTMLButtonElement>) {
            event.preventDefault();
            event.stopPropagation();
        }

        function handlePreviewClick(event: MouseEvent<HTMLButtonElement>) {
            event.preventDefault();
            event.stopPropagation();

            if (sound && !disabled) {
                onPreview(sound);
            }
        }

        return {
            ...option,
            trailing: sound
                ? (
                    <button
                        type="button"
                        className={q("sound-preview-button", isPlaying ? "playing-audio" : undefined)}
                        aria-label={`プレビュー ${option.label}`}
                        disabled={disabled}
                        onMouseDown={handlePreviewMouseDown}
                        onClick={handlePreviewClick}
                    >
                        <SoundIcon />
                    </button>
                )
                : undefined,
        };
    }

    return (
        <SettingsSelect
            label={label}
            options={options}
            value={value}
            selectionMode="single"
            disabled={disabled}
            clearable={true}
            fullWidth={true}
            maxOptionsVisible={7}
            placeholder="無効"
            selectClassName="sound-select"
            formatOption={formatOption}
            tooltip={tooltip}
            onSelectionChange={nextValue => {
                if (nextValue != null && typeof nextValue !== "string") return;

                onChange(nextValue ?? null);
            }}
        />
    );
}

export function QuestNotificationsSetting(): JSX.Element {
    const questNotifications = useQuestifySettings([
        "newExcludedQuestAlertSound",
        "newExcludedQuestAlertVolume",
        "newQuestAlertSound",
        "newQuestAlertVolume",
        "questFetchInterval",
        "disableQuestsEverything",
        "notifyOnNewExcludedQuests",
        "notifyOnNewQuests",
        "notifyOnQuestComplete",
        "questCompletedAlertSound",
        "questCompletedAlertVolume",
    ]);

    const soundOptions = useMemo(getSoundOptions, []);
    const activePlayer = useRef<AudioPlayerInterface | null>(null);
    const [playingSound, setPlayingSound] = useState<string | null>(null);
    const disabled = questNotifications.disableQuestsEverything;

    function clearActivePlayer(): void {
        const player = activePlayer.current;
        activePlayer.current = null;
        player?.stop();
        setPlayingSound(null);
    }

    function previewSound(sound: string, volume: number): void {
        if (playingSound === sound) {
            clearActivePlayer();

            return;
        }

        clearActivePlayer();

        function finishPreview(): void {
            if (activePlayer.current !== player) {
                return;
            }

            activePlayer.current = null;
            setPlayingSound(null);
        }

        const player = createAudioPlayer(sound, { volume: Math.max(0, Math.min(100, volume)), onEnded: finishPreview, onError: finishPreview });
        activePlayer.current = player;
        setPlayingSound(sound);
        player?.play();
    }

    useEffect(() => clearActivePlayer, []);
    useEffect(() => {
        if (disabled) {
            clearActivePlayer();
        }
    }, [disabled]);

    function updateFetchInterval(value: string | string[] | null): void {
        if (value != null && typeof value !== "string") return;

        const interval = value == null ? 0 : Number(value);
        getQuestifySettings().questFetchInterval = interval;
        startAutoFetchingQuests(true);
    }

    return (
        <SettingsCard>
            <SettingsHeader> クエスト通知 </SettingsHeader>
            <SettingsDescription>クエスト完了時と新しいクエスト検出時の通知とアラートを設定します。 </SettingsDescription>
            <SettingsSubheader> クエスト完了 </SettingsSubheader>
            <SettingsSubtleSwitch
                checked={questNotifications.notifyOnQuestComplete}
                disabled={disabled}
                label="クエストが完了したときに通知を表示する:"
                onChange={checked => { getQuestifySettings().notifyOnQuestComplete = checked; }}
                bottomSpacing="5"
            />
            <SettingsRow>
                <SettingsRowItem className="sound-select-row-item">
                    <QuestNotificationSoundSelect
                        label="クエストが完了したときにサウンドを再生する:"
                        disabled={disabled}
                        options={soundOptions}
                        value={questNotifications.questCompletedAlertSound}
                        playingSound={playingSound}
                        onPreview={sound => previewSound(sound, questNotifications.questCompletedAlertVolume)}
                        onChange={value => { getQuestifySettings().questCompletedAlertSound = value; }}
                    />
                </SettingsRowItem>
                <SettingsRowItem className="volume-slider-row-item">
                    <SettingsSlider
                        label="音量:"
                        className="inline-volume-slider"
                        disabled={disabled}
                        value={questNotifications.questCompletedAlertVolume}
                        onChange={value => { getQuestifySettings().questCompletedAlertVolume = value; }}
                    />
                </SettingsRowItem>
            </SettingsRow>
            <SettingsSubheader> 新しいクエストの検出 </SettingsSubheader>
            <SettingsSubtleSwitch
                checked={questNotifications.notifyOnNewQuests}
                disabled={disabled}
                label="新しいクエストが検出されたときに通知を表示する:"
                bottomSpacing="5"
                onChange={checked => {
                    getQuestifySettings().notifyOnNewQuests = checked;
                    startAutoFetchingQuests(true);
                }}
            />
            <SettingsRow>
                <SettingsRowItem className="sound-select-row-item">
                    <QuestNotificationSoundSelect
                        label="新しいクエストが検出されたときにサウンドを再生する:"
                        disabled={disabled}
                        options={soundOptions}
                        value={questNotifications.newQuestAlertSound}
                        playingSound={playingSound}
                        onPreview={sound => previewSound(sound, questNotifications.newQuestAlertVolume)}
                        onChange={value => {
                            getQuestifySettings().newQuestAlertSound = value;
                            startAutoFetchingQuests(true);
                        }}
                    />
                </SettingsRowItem>
                <SettingsRowItem className="volume-slider-row-item">
                    <SettingsSlider
                        label="音量:"
                        className="inline-volume-slider"
                        disabled={disabled}
                        value={questNotifications.newQuestAlertVolume}
                        onChange={value => { getQuestifySettings().newQuestAlertVolume = value; }}
                    />
                </SettingsRowItem>
            </SettingsRow>
            <SettingsSubtleSwitch
                className="margin-top-14"
                checked={questNotifications.notifyOnNewExcludedQuests}
                disabled={disabled}
                label="新しい除外クエストが検出されたときに通知を表示する:"
                bottomSpacing="5"
                onChange={checked => {
                    getQuestifySettings().notifyOnNewExcludedQuests = checked;
                    startAutoFetchingQuests(true);
                }}
                tooltip={{
                    position: "top",
                    text: "一部のクエストは、地域やプラットフォームの制限により、利用可能なクエスト一覧から除外されています。"
                        + "\n\n有効にすると、Questify はそれらのクエスト設定を取得し、対象のクエストタイプと報酬タイプのフィルターを適用して、解決された除外クエストデータをコンソールに出力し、一致する除外クエストについて別途通知を表示します。"
                }}
            />
            <SettingsRow>
                <SettingsRowItem className="sound-select-row-item">
                    <QuestNotificationSoundSelect
                        label="新しい除外クエストが検出されたときにサウンドを再生する:"
                        disabled={disabled}
                        options={soundOptions}
                        value={questNotifications.newExcludedQuestAlertSound}
                        playingSound={playingSound}
                        onPreview={sound => previewSound(sound, questNotifications.newExcludedQuestAlertVolume)}
                        onChange={value => {
                            getQuestifySettings().newExcludedQuestAlertSound = value;
                            startAutoFetchingQuests(true);
                        }}
                        tooltip={{
                            position: "top",
                            text: "一部のクエストは、地域やプラットフォームの制限により、利用可能なクエスト一覧から除外されています。"
                                + "\n\nサウンドを選択すると、Questify はそれらのクエスト設定を取得し、対象のクエストタイプと報酬タイプのフィルターを適用して、解決された除外クエストデータをコンソールに出力し、一致する除外クエストでこのサウンドを再生します。"
                        }}
                    />
                </SettingsRowItem>
                <SettingsRowItem className="volume-slider-row-item">
                    <SettingsSlider
                        label="音量:"
                        className="inline-volume-slider"
                        disabled={disabled}
                        value={questNotifications.newExcludedQuestAlertVolume}
                        onChange={value => { getQuestifySettings().newExcludedQuestAlertVolume = value; }}
                    />
                </SettingsRowItem>
            </SettingsRow>
            <SettingsRow>
                <SettingsRowItem>
                    <SettingsSelect
                        className="margin-top-12"
                        label="クエスト取得間隔:"
                        options={questFetchIntervalOptions}
                        value={questNotifications.questFetchInterval > 0 ? String(questNotifications.questFetchInterval) : null}
                        selectionMode="single"
                        disabled={disabled}
                        clearable={true}
                        fullWidth={true}
                        placeholder="無効"
                        maxOptionsVisible={questFetchIntervalOptions.length}
                        onSelectionChange={updateFetchInterval}
                        tooltip={{
                            position: "top",
                            text: "Discord は、読み込み時とクエストページを開いたときにのみクエストを取得します。"
                                + "\n\nこの間隔で、クライアントを開いている間は定期的にクエストを取得するため、クエストボタンのインジケーターと新しいクエストのアラートを一日中最新の状態に保てます。"
                                + "\n\nこれは、有効な場合で、かつクエストボタンまたはクエスト通知の設定が定期取得に意味のある構成になっている場合にのみ動作します。"
                        }}
                    />
                </SettingsRowItem>
            </SettingsRow>
        </SettingsCard>
    );
}
