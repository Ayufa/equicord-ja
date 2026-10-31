/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Paragraph } from "@components/Paragraph";
import { Modal } from "@webpack/common";

import { ClearAliasesConfirmModalProps } from "./types";

export function ClearAliasesConfirmModal({ modalProps, onConfirm }: ClearAliasesConfirmModalProps) {
    return (
        <Modal
            {...modalProps}
            size="sm"
            title="すべてのエイリアスを削除"
            actions={[
                {
                    text: "すべてのエイリアスを削除",
                    variant: "danger-primary",
                    onClick: async () => {
                        await onConfirm();
                        modalProps.onClose();
                    }
                }
            ]}
        >
            <Paragraph>保存したすべての絵文字エイリアスが削除されます。</Paragraph>
        </Modal>
    );
}
