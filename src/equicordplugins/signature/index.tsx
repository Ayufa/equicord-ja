/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ChatBarButton, ChatBarButtonFactory } from "@api/ChatButtons";
import { ApplicationCommandInputType, ApplicationCommandOptionType, findOption, sendBotMessage } from "@api/Commands";
import { findGroupChildrenByChildId, NavContextMenuPatchCallback } from "@api/ContextMenu";
import { definePluginSettings } from "@api/Settings";
import { Devs, EquicordDevs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { Menu, React } from "@webpack/common";

// Big thank you too slientTyping

const settings = definePluginSettings(
    {
        name: {
            type: OptionType.STRING,
            description: "メッセージの末尾に追加される署名",
            default: "a chronic discord user"
        },
        textHeader: {
            description: "テキストの前に付けるヘッダー",
            type: OptionType.STRING,
            default: ">",
        },
        showIcon: {
            type: OptionType.BOOLEAN,
            default: true,
            description: "チャットバーにプラグインを切り替えるアイコンを表示する",
            restartNeeded: true,
        },
        contextMenu: {
            type: OptionType.BOOLEAN,
            description: "チャット入力のコンテキストメニューに機能の切り替えオプションを追加する",
            default: true
        },
        isEnabled: {
            type: OptionType.BOOLEAN,
            description: "機能のオン/オフ",
            default: true,
        },
    });

const SignatureToggle: ChatBarButtonFactory = ({ isMainChat }) => {
    const { isEnabled, showIcon } = settings.use(["isEnabled", "showIcon"]);
    const toggle = () => settings.store.isEnabled = !settings.store.isEnabled;

    if (!isMainChat || !showIcon) return null;

    return (
        <ChatBarButton
            tooltip={isEnabled ? "署名を無効化" : "署名を有効化"}
            onClick={toggle}
        >
            <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 21.333">
                <path fill="currentColor" mask="url(#signature-msg-mask)" d="M2 4.621a.5.5 0 0 1 .854-.353l6.01 6.01c.126.126.17.31.15.487a2 2 0 1 0 1.751-1.751a.59.59 0 0 1-.487-.15l-6.01-6.01A.5.5 0 0 1 4.62 2H11a9 9 0 0 1 8.468 12.054l2.24 2.239a1 1 0 0 1 0 1.414l-4 4a1 1 0 0 1-1.415 0l-2.239-2.239A9 9 0 0 1 2 11z" />
                {isEnabled && (
                    <>
                        <mask id="signature-msg-mask"> <path fill="#fff" d="M0 0h24v24H0Z"></path>
                            <path stroke="#000" strokeWidth="5.99068" d="M0 24 24 0"></path> </mask>
                        <path fill="var(--status-danger)" d="m21.178 1.70703 1.414 1.414L4.12103 21.593l-1.414-1.415L21.178 1.70703Z" />
                    </>
                )}
            </svg>
        </ChatBarButton>
    );
};

function SignatureIcon() {
    return (
        <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 21.333">
            <path fill="currentColor" d="M2 4.621a.5.5 0 0 1 .854-.353l6.01 6.01c.126.126.17.31.15.487a2 2 0 1 0 1.751-1.751a.59.59 0 0 1-.487-.15l-6.01-6.01A.5.5 0 0 1 4.62 2H11a9 9 0 0 1 8.468 12.054l2.24 2.239a1 1 0 0 1 0 1.414l-4 4a1 1 0 0 1-1.415 0l-2.239-2.239A9 9 0 0 1 2 11z" />
        </svg>
    );
}

const ChatBarContextCheckbox: NavContextMenuPatchCallback = children => {
    const { isEnabled, contextMenu } = settings.use(["isEnabled", "contextMenu"]);
    if (!contextMenu) return;

    const group = findGroupChildrenByChildId("submit-button", children);

    if (!group) return;

    const idx = group.findIndex(c => c?.props?.id === "submit-button");

    group.splice(idx + 1, 0,
        <Menu.MenuCheckboxItem
            id="vc-Signature"
            label="署名を有効化"
            checked={isEnabled}
            action={() => settings.store.isEnabled = !settings.store.isEnabled}
        />
    );
};

export default definePlugin({
    name: "Signature",
    description: "自動で付与される署名/末尾テキスト",
    dependencies: ["CommandsAPI", "ChatInputButtonAPI", "MessagePopoverAPI"],
    tags: ["Appearance", "Chat"],
    authors: [Devs.Ven, Devs.Rini, Devs.ImBanana, EquicordDevs.KrystalSkull],
    onBeforeMessageSend(channelId, msg) {
        if (!settings.store.isEnabled) {
            msg.content = msg.content;
        } else {
            msg.content = textProcessing(msg.content);
        }
    },
    start: () => {
        if (settings.store.isEnabled) true;
    },
    stop: () => {
        if (settings.store.isEnabled) false;
    },

    chatBarButton: {
        icon: SignatureIcon,
        render: SignatureToggle
    },

    settings,

    contextMenus: {
        "textarea-context": ChatBarContextCheckbox
    },

    commands: [
        {
            name: "signature",
            description: "署名のオン/オフを切り替え",
            inputType: ApplicationCommandInputType.BUILT_IN,
            options: [
                {
                    name: "value",
                    description: "署名のオン/オフを切り替え（デフォルトは切り替え）",
                    required: false,
                    type: ApplicationCommandOptionType.BOOLEAN,
                },
            ],
            execute: async (args, ctx) => {
                settings.store.isEnabled = !!findOption(args, "value", !settings.store.isEnabled);
                sendBotMessage(ctx.channel.id, {
                    content: settings.store.isEnabled ? "署名を有効にしました！" : "署名を無効にしました！",
                });
            },
        }
    ],
});

// text processing injection processor
function textProcessing(input: string) {
    return `${input}\n${settings.store.textHeader ? settings.store.textHeader + " " : ""}${settings.store.name}`;
}
