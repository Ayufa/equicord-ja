/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Card } from "@components/Card";
import { CheckedTextInput } from "@components/CheckedTextInput";
import { FormSwitch } from "@components/FormSwitch";
import { Heading, HeadingSecondary } from "@components/Heading";
import { Paragraph } from "@components/Paragraph";
import { Margins } from "@utils/margins";
import { identity } from "@utils/misc";
import { Activity } from "@vencord/discord-types";
import { ActivityFlags, ActivityType } from "@vencord/discord-types/enums";
import { PresenceStore, React, Select, SnowflakeUtils, TextInput, UserStore } from "@webpack/common";

import { AppIdSetting, makeEmptyAppId } from ".";

interface SettingsProps {
    appIds: AppIdSetting[];
    update: () => void;
    save: () => void;
}

function isValidSnowflake(v: string) {
    const regex = /^\d{17,20}$/;
    return regex.test(v) && !Number.isNaN(SnowflakeUtils.extractTimestamp(v));
}

export function ReplaceTutorial() {
    const activities: Activity[] = PresenceStore.getActivities(UserStore.getCurrentUser().id);
    return (
        <>
            <HeadingSecondary>現在実行中のアクティビティの ID</HeadingSecondary>
            {
                activities.length === 0
                    ? <Paragraph>実行中のアクティビティはありません</Paragraph>
                    : activities.map(activity => {
                        const isSpotify = (activity.flags & (ActivityFlags.SYNC | ActivityFlags.PLAY)) === (ActivityFlags.SYNC | ActivityFlags.PLAY);
                        return !isSpotify
                            ? <Paragraph>{activity.name}: {activity.application_id}</Paragraph>
                            : null;
                    })
            }
            <HeadingSecondary className={Margins.top8}>使用できる変数</HeadingSecondary>
            <Paragraph>
                すべてのフィールド（ストリーム URL を除く）で、元の内容に自動で置き換えられる変数を使えます：
                <pre style={{ fontFamily: "monospace" }}>
                    :name:, :details:, :state:
                    <br />
                    :large_image:, :large_text:, :small_image:, :small_text:
                </pre>
            </Paragraph>
            <HeadingSecondary className={Margins.top8}>詳細</HeadingSecondary>
            <Paragraph>
                フィールドを空のままにすると、そのまま保持されます。
                <br />
                フィールドに "null" と入力すると、プレゼンス上で非表示になります。
                <br />
                変更を適用するには Discord の再読み込みが必要な場合があります。
            </Paragraph>
        </>
    );
}

export function ReplaceSettings({ appIds, update, save }: SettingsProps) {
    async function onChange(val: string | boolean, index: number, key: string) {
        if (index === appIds.length - 1)
            appIds.push(makeEmptyAppId());

        appIds[index][key] = val;

        save();
        update();
    }

    return (
        <>
            {
                appIds.map((setting, i) =>
                    <Card style={{ padding: "1em", opacity: !setting.enabled ? "60%" : "" }} key={i}>
                        {
                            isValidSnowflake(setting.appId) ?
                                <FormSwitch
                                    title="このアプリに編集を適用"
                                    value={setting.enabled}
                                    onChange={value => {
                                        onChange(value, i, "enabled");
                                    }}
                                    className={Margins.bottom8}
                                    hideBorder={true}
                                /> : <HeadingSecondary>新しいアプリケーションを追加</HeadingSecondary>
                        }
                        <Heading className={`${Margins.top8} ${Margins.bottom8}`}>アプリケーション ID</Heading>
                        <CheckedTextInput
                            initialValue={setting.appId}
                            onChange={async v => {
                                onChange(v, i, "appId");
                            }}
                            validate={v =>
                                !v || isValidSnowflake(v) || "無効なアプリケーション ID です"
                            }
                        />
                        {
                            isValidSnowflake(setting.appId) && <>
                                <Heading className={Margins.top8}>新しいアクティビティタイプ</Heading>
                                <Select
                                    options={[
                                        { label: "プレイ中", value: ActivityType.PLAYING },
                                        { label: "視聴中", value: ActivityType.WATCHING },
                                        { label: "リスニング中", value: ActivityType.LISTENING },
                                        { label: "対戦中", value: ActivityType.COMPETING },
                                        { label: "配信中", value: ActivityType.STREAMING }
                                    ]}
                                    select={value => {
                                        onChange(value, i, "newActivityType");
                                    }}
                                    className={Margins.top8}
                                    isSelected={value => setting.newActivityType === value}
                                    serialize={identity}
                                />
                                {
                                    setting.newActivityType === ActivityType.STREAMING &&
                                    <>
                                        <Heading className={`${Margins.top8} ${Margins.bottom8}`}>ストリーム URL（YouTube または Twitch のもの）</Heading>
                                        <CheckedTextInput
                                            initialValue={setting.newStreamUrl}
                                            onChange={async v => {
                                                onChange(v, i, "newStreamUrl");
                                            }}
                                            validate={v => {
                                                return /https?:\/\/(www\.)?(twitch\.tv|youtube\.com)\/\w+/.test(v) || "無効なストリーム URL です";
                                            }}
                                        />

                                    </>
                                }
                                {
                                    setting.newActivityType !== ActivityType.STREAMING &&
                                    <>
                                        <Heading className={Margins.top8}>新しい名前 {setting.newActivityType === ActivityType.PLAYING && "（1行目）"}</Heading>
                                        <TextInput
                                            className={Margins.top8}
                                            value={setting.newName}
                                            onChange={async v => {
                                                onChange(v, i, "newName");
                                            }}
                                        />
                                    </>
                                }
                                <Heading className={Margins.top8}>新しい詳細 {setting.newActivityType === ActivityType.PLAYING ? "（2行目）" : "（1行目）"}</Heading>
                                <TextInput
                                    className={Margins.top8}
                                    value={setting.newDetails}
                                    onChange={async v => {
                                        onChange(v, i, "newDetails");
                                    }}
                                />
                                <Heading className={Margins.top8}>新しい状態 {setting.newActivityType === ActivityType.PLAYING ? "（3行目）" : "（2行目）"}</Heading>
                                <TextInput
                                    className={Margins.top8}
                                    value={setting.newState}
                                    onChange={async v => {
                                        onChange(v, i, "newState");
                                    }}
                                />
                                {
                                    !setting.disableAssets &&
                                    <>
                                        <Paragraph style={{ fontSize: "1.05rem", fontWeight: "500" }} className={Margins.top8}>大きい画像</Paragraph>
                                        <Heading className={Margins.top8}>テキスト {setting.newActivityType !== ActivityType.PLAYING && "（3行目）"}</Heading>
                                        <TextInput
                                            className={Margins.top8}
                                            value={setting.newLargeImageText}
                                            onChange={async v => {
                                                onChange(v, i, "newLargeImageText");
                                            }}
                                        />
                                        <Heading className={Margins.top8}>URL</Heading>
                                        <TextInput
                                            className={Margins.top8}
                                            value={setting.newLargeImageUrl}
                                            onChange={async v => {
                                                onChange(v, i, "newLargeImageUrl");
                                            }}
                                        />
                                        <Paragraph style={{ fontSize: "1.05rem", fontWeight: "500" }} className={Margins.top8}>小さい画像</Paragraph>
                                        <Heading className={Margins.top8}>テキスト</Heading>
                                        <TextInput
                                            className={Margins.top8}
                                            value={setting.newSmallImageText}
                                            onChange={async v => {
                                                onChange(v, i, "newSmallImageText");
                                            }}
                                        />
                                        <Heading className={Margins.top8}>URL</Heading>
                                        <TextInput
                                            className={Margins.top8}
                                            value={setting.newSmallImageUrl}
                                            onChange={async v => {
                                                onChange(v, i, "newSmallImageUrl");
                                            }}
                                        />
                                    </>
                                }
                                <FormSwitch
                                    title="アセット（大・小の画像）を隠す"
                                    value={setting.disableAssets}
                                    onChange={value => {
                                        onChange(value, i, "disableAssets");
                                    }}
                                    className={Margins.top8}
                                    hideBorder={true}
                                />
                                <FormSwitch
                                    title="タイムスタンプを隠す"
                                    value={setting.disableTimestamps}
                                    onChange={value => {
                                        onChange(value, i, "disableTimestamps");
                                    }}
                                    className={Margins.top8}
                                    hideBorder={true} />
                            </>
                        }
                    </Card >
                )
            }
        </>
    );
}
