/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ConfirmModalProps } from "@vencord/discord-types";
import { ConfirmModal, openModal } from "@webpack/common";

import { relaunch } from "./native";

/**
 * @param type - "relaunch" to restart the entire application, "reload" to only reload Discord (CTRL + R)
 * @param props - Properties for the confirmation modal, uses sensible defaults
 */
export function promptToRestart(
    type: "relaunch" | "reload",
    {
        title = "再起動が必要です",
        subtitle = "この変更を適用するには再起動が必要です",
        confirmText = "今すぐ再起動",
        cancelText = "あとで",
        ...props
    }: Partial<ConfirmModalProps> = {}
) {
    const onConfirm = type === "relaunch"
        ? relaunch
        : () => location.reload();

    openModal(modalProps => (
        <ConfirmModal
            variant="primary"
            {...modalProps}
            {...props}

            title={title}
            subtitle={subtitle}
            confirmText={confirmText}
            cancelText={cancelText}
            onConfirm={onConfirm}
        />
    ));
}
