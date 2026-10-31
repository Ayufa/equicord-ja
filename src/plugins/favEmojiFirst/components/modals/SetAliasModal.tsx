/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { BaseText } from "@components/BaseText";
import { Paragraph } from "@components/Paragraph";
import { Modal, TextInput, useState } from "@webpack/common";

import { SetAliasModalProps } from "./types";

export function SetAliasModal({
    modalProps,
    emojiDisplayName,
    initialAlias,
    getValidationError,
    isDuplicateAlias,
    onSave
}: SetAliasModalProps) {
    const [input, setInput] = useState(initialAlias);
    const [error, setError] = useState<string | null>(null);

    const validationError = getValidationError(input);
    const duplicateAlias = isDuplicateAlias(input);
    const finalError = duplicateAlias ? "エイリアスが重複しています" : error ?? validationError;
    const canSave = !validationError && !duplicateAlias;

    return (
        <Modal
            {...modalProps}
            size="sm"
            title="エイリアスを設定"
            actions={[
                {
                    text: "保存",
                    variant: "primary",
                    disabled: !canSave,
                    onClick: async () => {
                        const result = await onSave(input);
                        if (!result.ok) {
                            setError(result.error);
                            return;
                        }
                        modalProps.onClose();
                    }
                }
            ]}
        >
            <Paragraph style={{ margin: 0, marginBottom: 8 }}>{emojiDisplayName} のエイリアスを設定</Paragraph>
            <TextInput
                value={input}
                onChange={value => {
                    setInput(value);
                    setError(null);
                }}
                placeholder='エイリアス（例: "sob"）'
            />
            {finalError && (
                <BaseText style={{ color: "var(--text-feedback-critical)", marginTop: 8 }}>
                    {finalError}
                </BaseText>
            )}
        </Modal>
    );
}
