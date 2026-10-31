/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ChatBarButton } from "@api/ChatButtons";
import { ClockIcon, UploadIcon } from "@components/Icons";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { Message } from "@vencord/discord-types";
import { MessageFlags, MessageType } from "@vencord/discord-types/enums";
import { findByPropsLazy } from "@webpack";
import { AuthenticationStore, ChannelStore, EditMessageStore, MessageStore, PermissionsBits, PermissionStore, RestAPI, SelectedChannelStore, showToast } from "@webpack/common";

const { uniqueId } = findByPropsLazy("uniqueId");

function chooseAttachments(channelId: string, messageId: string, existingAttachmentCount: number) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "*/*";
    input.multiple = true;
    input.click();

    input.addEventListener("change", async () => {
        try {
            if (!input.files) return;
            await addAttachments(channelId, messageId, existingAttachmentCount, input.files);
        } finally {
            input.remove();
        }
    });
}

async function addAttachments(channelId: string, messageId: string, existingAttachmentCount: number, files: FileList) {
    if (!files) return;

    if (files.length + existingAttachmentCount > 10) {
        const remaining = 10 - existingAttachmentCount;
        if (remaining <= 0) {
            showToast({ text: "このメッセージにはこれ以上添付ファイルを追加できません。", variant: "critical" });
            return;
        }

        showToast({ text: `このメッセージにはあと ${remaining} 件まで添付ファイルを追加できます。`, variant: "critical" });
        return;
    }

    showToast({ text: "アップロード中です。少し時間がかかる場合があります...", icon: ClockIcon, iconColor: "var(--text-default)" });

    const { body: { attachments } } = await RestAPI.post({
        url: `/channels/${channelId}/attachments`,
        body: {
            files: Array.from(files, file => ({
                filename: file.name,
                file_size: file.size,
                id: uniqueId(),
                is_clip: false
            }))
        }
    }) as { body: { attachments: { id: string, upload_url: string, upload_filename: string; }[]; }; };

    const newAttachments = await Promise.all(
        attachments.map((file, i) =>
            fetch(file.upload_url, {
                method: "PUT",
                body: files[i]
            }).then(() => ({
                id: file.id,
                uploaded_filename: file.upload_filename,
                filename: files[i].name
            }))
        )
    );

    const msg = MessageStore.getMessage(channelId, messageId);

    await RestAPI.patch({
        url: `/channels/${channelId}/messages/${messageId}`,
        body: {
            attachments: [
                ...msg.attachments,
                ...newAttachments
            ]
        }
    });

    showToast({ text: "添付ファイルを追加しました！", variant: "success" });
}

function canAddAttachments(msg: Message) {
    return (
        [MessageType.DEFAULT, MessageType.REPLY].includes(msg.type) &&
        !msg.hasFlag(MessageFlags.IS_VOICE_MESSAGE) &&
        AuthenticationStore.getId() === msg.author.id &&
        msg.attachments.length < 10
    );
}

function handlePaste(e: ClipboardEvent) {
    if (!e.clipboardData?.files.length) return;

    const msg = EditMessageStore.getEditingMessage(SelectedChannelStore.getChannelId());
    if (!msg) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    addAttachments(msg.channel_id, msg.id, msg.attachments.length, e.clipboardData.files);
}

export default definePlugin({
    name: "AddAttachments",
    description: "メッセージの編集中に新しい添付ファイルを追加できるようにします",
    authors: [Devs.Lumap],

    start() {
        document.addEventListener("paste", handlePaste, { capture: true });
    },
    stop() {
        document.removeEventListener("paste", handlePaste, { capture: true });
    },

    messagePopoverButton: {
        icon: UploadIcon,
        render(msg) {
            if (!canAddAttachments(msg)) return null;

            const channel = ChannelStore.getChannel(msg.channel_id);
            if (!channel.isPrivate() && !PermissionStore.can(PermissionsBits.SEND_MESSAGES, channel)) return null;

            return {
                label: "添付ファイルを追加",
                icon: UploadIcon,
                onClick: () => chooseAttachments(msg.channel_id, msg.id, msg.attachments.length)
            };
        },
    },

    chatBarButton: {
        icon: UploadIcon,
        render({ channel, type }) {
            if (type.analyticsName !== "edit") return null;

            const msg = EditMessageStore.getEditingMessage(channel.id);
            if (!msg || !canAddAttachments(msg)) return null;

            return (
                <ChatBarButton
                    tooltip="添付ファイルを追加"
                    onClick={() => chooseAttachments(msg.channel_id, msg.id, msg.attachments.length)}
                >
                    <UploadIcon height={18} width={18} />
                </ChatBarButton>
            );
        }
    }
});
