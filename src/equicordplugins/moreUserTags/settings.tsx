/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Card } from "@components/Card";
import { Flex } from "@components/Flex";
import { FormSwitch } from "@components/FormSwitch";
import { Heading } from "@components/Heading";
import { Paragraph } from "@components/Paragraph";
import { OptionType } from "@utils/types";
import { TextInput, Tooltip } from "@webpack/common";

import moreUserTags from ".";
import { Tag, tags } from "./consts";
import { TagSettings } from "./types";

function SettingsComponent() {
    const tagSettings = (settings.store.tagSettings ??= {} as TagSettings);
    const { localTags } = moreUserTags;

    tags.forEach(t => {
        if (!tagSettings[t.name]) {
            tagSettings[t.name] = { text: t.displayName, showInChat: true, showInNotChat: true };
        }
    });

    return (
        <Flex flexDirection="column">
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "auto auto",
                    gap: "16px",
                }}
            >
                {tags.map(t => (
                    <Card
                        key={t.name}
                        style={{
                            padding: "1em 1em 0",
                            boxSizing: "border-box",
                        }}
                    >
                        <Heading style={{ width: "fit-content" }}>
                            <Tooltip text={t.description}>
                                {({ onMouseEnter, onMouseLeave }) => (
                                    <div
                                        onMouseEnter={onMouseEnter}
                                        onMouseLeave={onMouseLeave}
                                    >
                                        {t.displayName} タグ
                                    </div>
                                )}
                            </Tooltip>
                        </Heading>

                        <div style={{ marginBottom: "10px" }}>
                            <Paragraph style={{
                                fontSize: "13px",
                                display: "inline",
                                paddingRight: "8px"
                            }}>
                                例：
                            </Paragraph>
                            <Tag type={localTags[t.name]} />
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                            <TextInput
                                type="text"
                                value={tagSettings[t.name]?.text ?? t.displayName}
                                placeholder={`タグのテキスト（デフォルト: ${t.displayName}）`}
                                onChange={v => tagSettings[t.name].text = v}
                            />
                        </div>

                        <FormSwitch
                            title="メッセージに表示"
                            value={tagSettings[t.name]?.showInChat ?? true}
                            onChange={v => tagSettings[t.name].showInChat = v}
                            hideBorder
                        />

                        <FormSwitch
                            title="メンバーリストとプロフィールに表示"
                            value={tagSettings[t.name]?.showInNotChat ?? true}
                            onChange={v => tagSettings[t.name].showInNotChat = v}
                            hideBorder
                        />
                    </Card>
                ))}
            </div>
        </Flex>
    );
}

export const settings = definePluginSettings({
    dontShowForBots: {
        description: "ボット用の追加タグを表示しない（ウェブフックを除く）",
        type: OptionType.BOOLEAN,
        default: false
    },
    dontShowBotTag: {
        description: "ボット用の追加タグのみ表示 / [APP] テキストを隠す",
        type: OptionType.BOOLEAN,
        default: false,
        restartNeeded: true
    },
    showWebhookTagFully: {
        description: "アナウンスなどフォロー中のチャンネルで Webhook タグを表示",
        type: OptionType.BOOLEAN,
        default: false
    },
    noAppsAllowed: {
        description: "ボットの app 表記を置き換えます",
        type: OptionType.BOOLEAN,
        default: false,
        restartNeeded: true
    },
    tagSettings: {
        type: OptionType.COMPONENT,
        component: SettingsComponent,
        description: "入力してください"
    }
});
