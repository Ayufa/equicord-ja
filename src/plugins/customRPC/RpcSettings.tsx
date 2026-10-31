/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./settings.css";

import { DataStore } from "@api/index";
import { isPluginEnabled } from "@api/PluginManager";
import { Button } from "@components/Button";
import { Divider } from "@components/Divider";
import { Heading } from "@components/Heading";
import { Paragraph } from "@components/Paragraph";
import { resolveError } from "@components/settings/tabs/plugins/components/Common";
import { debounce } from "@shared/debounce";
import { classNameFactory } from "@utils/css";
import { useAwaiter } from "@utils/react";
import { ActivityType } from "@vencord/discord-types/enums";
import { Select, showToast, TextInput, useState } from "@webpack/common";

import CustomRPCPlugin, { RpcConfig, setRpc, settings, TimestampMode } from ".";

const cl = classNameFactory("vc-customRPC-settings-");
const PRESETS_KEY = "CustomRPC_presets";

type SettingsKey = keyof typeof settings.store;

interface RpcPreset {
    name: string;
    config: RpcConfig;
}

interface TextOption<T> {
    settingsKey: SettingsKey;
    label: string;
    disabled?: boolean;
    transform?: (value: string) => T;
    isValid?: (value: T) => true | string;
}

interface SelectOption<T> {
    settingsKey: SettingsKey;
    label: string;
    disabled?: boolean;
    options: { label: string; value: T; default?: boolean; }[];
}

const makeValidator = (maxLength: number, isRequired = false) => (value: string) => {
    if (isRequired && !value) return "この項目は必須です。";
    if (value.length > maxLength) return `${maxLength} 文字以内で入力してください。`;
    return true;
};

const maxLength128 = makeValidator(128);

function isAppIdValid(value: string) {
    if (!/^\d{16,21}$/.test(value)) return "有効な Discord ID を入力してください。";
    return true;
}

const updateRPC = debounce(() => {
    setRpc(true);
    if (isPluginEnabled(CustomRPCPlugin.name)) setRpc();
});

function isStreamLinkDisabled() {
    return settings.store.type !== ActivityType.STREAMING;
}

function isStreamLinkValid(value: string) {
    if (!isStreamLinkDisabled() && !/https?:\/\/(www\.)?(twitch\.tv|youtube\.com)\/\w+/.test(value)) return "配信リンクには有効な URL を入力してください。";
    if (value && value.length > 512) return "配信リンクは512文字以内で入力してください。";
    return true;
}

function parseNumber(value: string) {
    return value ? parseInt(value, 10) : 0;
}

function isNumberValid(value: number) {
    if (isNaN(value)) return "数値を入力してください。";
    if (value < 0) return "正の数値を入力してください。";
    return true;
}

function isUrlValid(value: string) {
    if (value && !/^https?:\/\/.+/.test(value)) return "有効な URL を入力してください。";
    return true;
}

function isImageKeyValid(value: string) {
    if (/https?:\/\/(cdn|media)\.discordapp\.(com|net)\//.test(value)) return "Discord のリンクは使えません。代わりに Imgur の画像リンクを使ってください。";
    if (/https?:\/\/(?!i\.)?imgur\.com\//.test(value)) return "Imgur のリンクは画像への直接リンクにしてください（例: https://i.imgur.com/...）。画像を右クリックして「画像アドレスをコピー」を選んでください";
    if (/https?:\/\/(?!media\.)?tenor\.com\//.test(value)) return "Tenor のリンクは画像への直接リンクにしてください（例: https://media.tenor.com/...）。GIF を右クリックして「画像アドレスをコピー」を選んでください";
    return true;
}

function PairSetting<T>(props: { data: [TextOption<T>, TextOption<T>]; }) {
    const [left, right] = props.data;

    return (
        <div className={cl("pair")}>
            <SingleSetting {...left} />
            <SingleSetting {...right} />
        </div>
    );
}

function SingleSetting<T>({ settingsKey, label, disabled, isValid, transform }: TextOption<T>) {
    const [state, setState] = useState(settings.store[settingsKey] ?? "");
    const [error, setError] = useState<string | null>(null);

    function handleChange(newValue: any) {
        if (transform) newValue = transform(newValue);

        const valid = isValid?.(newValue) ?? true;

        setState(newValue);
        setError(resolveError(valid));

        if (valid === true) {
            settings.store[settingsKey] = newValue;
            updateRPC();
        }
    }

    return (
        <div className={cl("single", { disabled })}>
            <Heading>{label}</Heading>
            <TextInput
                type="text"
                placeholder={"値を入力"}
                value={state}
                onChange={handleChange}
                disabled={disabled}
            />
            {error && <Paragraph className={cl("error")}>{error}</Paragraph>}
        </div>
    );
}

function SelectSetting<T>({ settingsKey, label, options, disabled }: SelectOption<T>) {
    return (
        <div className={cl("single", { disabled })}>
            <Heading>{label}</Heading>
            <Select
                placeholder={"選択してください"}
                options={options}
                maxVisibleItems={5}
                closeOnSelect={true}
                select={v => {
                    settings.store[settingsKey] = v;
                    updateRPC();
                }}
                isSelected={v => v === settings.store[settingsKey]}
                serialize={v => String(v)}
                isDisabled={disabled}
            />
        </div>
    );
}

function getCurrentConfig(): RpcConfig {
    const { config, ...rpcConfig } = settings.store;
    return rpcConfig;
}

function PresetSettings({ onLoad }: { onLoad(): void; }) {
    const [storedPresets] = useAwaiter(async () => await DataStore.get<RpcPreset[]>(PRESETS_KEY) ?? [], { fallbackValue: [] });
    const [changedPresets, setChangedPresets] = useState<RpcPreset[] | null>(null);
    const [presetName, setPresetName] = useState("");
    const [selectedPreset, setSelectedPreset] = useState("");
    const presets = changedPresets ?? storedPresets;

    async function savePreset() {
        const name = presetName.trim();
        if (!name) return;

        const nextPresets = [
            ...presets.filter(preset => preset.name !== name),
            { name, config: getCurrentConfig() }
        ].sort((a, b) => a.name.localeCompare(b.name));

        await DataStore.set(PRESETS_KEY, nextPresets);
        setChangedPresets(nextPresets);
        setSelectedPreset(name);
        showToast({ text: `プリセット ${name} を保存しました。`, variant: "success" });
    }

    function loadPreset() {
        const preset = presets.find(preset => preset.name === selectedPreset);
        if (!preset) return;

        Object.assign(settings.store, preset.config);
        onLoad();
        updateRPC();
        showToast({ text: `プリセット ${preset.name} を読み込みました。`, variant: "success" });
    }

    async function deletePreset() {
        const nextPresets = presets.filter(preset => preset.name !== selectedPreset);
        if (nextPresets.length === presets.length) return;

        await DataStore.set(PRESETS_KEY, nextPresets);
        setChangedPresets(nextPresets);
        setSelectedPreset("");
        showToast({ text: `プリセット ${selectedPreset} を削除しました。`, variant: "success" });
    }

    return (
        <div className={cl("presets")}>
            <Heading tag="h5">プリセット</Heading>
            <div className={cl("preset-create")}>
                <TextInput
                    type="text"
                    placeholder="プリセット名"
                    value={presetName}
                    onChange={setPresetName}
                />
                <Button disabled={!presetName.trim()} onClick={savePreset}>保存</Button>
            </div>
            {presets.length ? (
                <div className={cl("preset-actions")}>
                    <Select
                        placeholder="プリセットを選択"
                        options={presets.map(preset => ({ label: preset.name, value: preset.name }))}
                        closeOnSelect={true}
                        select={setSelectedPreset}
                        isSelected={value => value === selectedPreset}
                        serialize={String}
                    />
                    <Button disabled={!selectedPreset} onClick={loadPreset}>読み込む</Button>
                    <Button variant="dangerPrimary" disabled={!selectedPreset} onClick={deletePreset}>削除</Button>
                </div>
            ) : (
                <Paragraph>保存済みのプリセットはまだありません。</Paragraph>
            )}
        </div>
    );
}

function RPCFields() {
    const { type, timestampMode } = settings.use(["type", "timestampMode"]);

    return (
        <>
            <SelectSetting
                settingsKey="type"
                label="アクティビティの種類"
                options={[
                    {
                        label: "プレイ中",
                        value: ActivityType.PLAYING,
                        default: true
                    },
                    {
                        label: "配信中",
                        value: ActivityType.STREAMING
                    },
                    {
                        label: "聴いている",
                        value: ActivityType.LISTENING
                    },
                    {
                        label: "視聴中",
                        value: ActivityType.WATCHING
                    },
                    {
                        label: "対戦中",
                        value: ActivityType.COMPETING
                    }
                ]}
            />

            <PairSetting data={[
                { settingsKey: "appID", label: "アプリケーション ID", isValid: isAppIdValid },
                { settingsKey: "appName", label: "アプリケーション名", isValid: makeValidator(128, true) },
            ]} />

            <PairSetting data={[
                { settingsKey: "details", label: "詳細（1行目）", isValid: maxLength128 },
                { settingsKey: "detailsURL", label: "詳細 URL", isValid: isUrlValid },
            ]} />

            <PairSetting data={[
                { settingsKey: "state", label: "状態（2行目）", isValid: maxLength128 },
                { settingsKey: "stateURL", label: "状態 URL", isValid: isUrlValid },
            ]} />

            <SingleSetting
                settingsKey="streamLink"
                label="配信リンク（Twitch または YouTube、アクティビティの種類が配信中の場合のみ）"
                disabled={type !== ActivityType.STREAMING}
                isValid={isStreamLinkValid}
            />

            <PairSetting data={[
                {
                    settingsKey: "partySize",
                    label: "パーティー人数",
                    transform: parseNumber,
                    isValid: isNumberValid,
                    disabled: type !== ActivityType.PLAYING,
                },
                {
                    settingsKey: "partyMaxSize",
                    label: "パーティー最大人数",
                    transform: parseNumber,
                    isValid: isNumberValid,
                    disabled: type !== ActivityType.PLAYING,
                },
            ]} />

            <Divider />

            <PairSetting data={[
                { settingsKey: "imageBig", label: "大きい画像の URL/キー", isValid: isImageKeyValid },
                { settingsKey: "imageBigTooltip", label: "大きい画像のテキスト", isValid: maxLength128 },
            ]} />
            <SingleSetting settingsKey="imageBigURL" label="大きい画像のクリック先 URL" isValid={isUrlValid} />

            <PairSetting data={[
                { settingsKey: "imageSmall", label: "小さい画像の URL/キー", isValid: isImageKeyValid },
                { settingsKey: "imageSmallTooltip", label: "小さい画像のテキスト", isValid: maxLength128 },
            ]} />
            <SingleSetting settingsKey="imageSmallURL" label="小さい画像のクリック先 URL" isValid={isUrlValid} />

            <Divider />

            <PairSetting data={[
                { settingsKey: "buttonOneText", label: "ボタン1のテキスト", isValid: makeValidator(31) },
                { settingsKey: "buttonOneURL", label: "ボタン1の URL", isValid: isUrlValid },
            ]} />
            <PairSetting data={[
                { settingsKey: "buttonTwoText", label: "ボタン2のテキスト", isValid: makeValidator(31) },
                { settingsKey: "buttonTwoURL", label: "ボタン2の URL", isValid: isUrlValid },
            ]} />

            <Divider />

            <SelectSetting
                settingsKey="timestampMode"
                label="タイムスタンプモード"
                options={[
                    {
                        label: "なし",
                        value: TimestampMode.NONE,
                        default: true
                    },
                    {
                        label: "Discord を開いてから",
                        value: TimestampMode.NOW
                    },
                    {
                        label: "現在の時刻と同じ（24時間経ってもリセットされません）",
                        value: TimestampMode.TIME
                    },
                    {
                        label: "カスタム",
                        value: TimestampMode.CUSTOM
                    }
                ]}
            />

            <PairSetting data={[
                {
                    settingsKey: "startTime",
                    label: "開始タイムスタンプ（ミリ秒）",
                    transform: parseNumber,
                    isValid: isNumberValid,
                    disabled: timestampMode !== TimestampMode.CUSTOM,
                },
                {
                    settingsKey: "endTime",
                    label: "終了タイムスタンプ（ミリ秒）",
                    transform: parseNumber,
                    isValid: isNumberValid,
                    disabled: timestampMode !== TimestampMode.CUSTOM,
                },
            ]} />
        </>
    );
}

export function RPCSettings() {
    const [formVersion, setFormVersion] = useState(0);

    return (
        <div className={cl("root")}>
            <PresetSettings onLoad={() => setFormVersion(version => version + 1)} />
            <Divider />
            <RPCFields key={formVersion} />
        </div>
    );
}
