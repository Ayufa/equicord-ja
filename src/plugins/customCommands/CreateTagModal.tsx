/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { InlineCode } from "@components/CodeBlock";
import { ExpandableSection } from "@components/ExpandableCard";
import { Flex } from "@components/Flex";
import { Heading } from "@components/Heading";
import { InfoIcon } from "@components/Icons";
import { Margins } from "@components/margins";
import { Paragraph } from "@components/Paragraph";
import { RenderModalProps } from "@vencord/discord-types";
import { Modal, openModal, TextArea, TextInput, useState } from "@webpack/common";

import { parseTagArguments } from ".";
import { addTag, getTag, removeTag, Tag } from "./settings";

export function openCreateTagModal(initialValue: Tag = { name: "", message: "" }) {
    openModal(modalProps => (
        <CreateTagDialog initialValue={initialValue} modalProps={modalProps} />
    ));
}

const EXAMPLE_RESPONSE = "Hello {{user}}! I am feeling {{mood = great}}.";

function CreateTagDialog({ initialValue, modalProps }: { initialValue: Tag; modalProps: RenderModalProps; }) {
    const [name, setName] = useState(initialValue.name);
    const [message, setMessage] = useState(initialValue.message.replaceAll("\\n", "\n"));

    const isEdit = Boolean(initialValue.name);

    const detectedArguments = parseTagArguments(message);
    const hasReservedEphemeral = detectedArguments.some(arg => arg.name === "ephemeral");
    const nameAlreadyExists = name !== initialValue.name && getTag(name);

    const notice = hasReservedEphemeral
        ? '引数名 "ephemeral" は予約されているため使用できません。'
        : nameAlreadyExists
            ? `"${name}" という名前のタグは既に存在し、上書きされます。`
            : undefined;

    return (
        <Modal
            {...modalProps}
            title={isEdit ? "タグを編集" : "新しいタグを作成"}
            subtitle={isEdit ? "カスタムコマンドを編集します。" : "スラッシュコマンドとして登録される新しいタグを作成します。"}
            actions={[
                {
                    text: "キャンセル",
                    variant: "secondary",
                    onClick: modalProps.onClose
                },
                {
                    text: isEdit ? "保存" : "作成",
                    variant: "primary",
                    onClick: () => {
                        if (isEdit && initialValue.name !== name) {
                            removeTag(initialValue.name);
                        }

                        const tag = { name, message };
                        addTag(tag);
                        modalProps.onClose();
                    },
                    disabled: !name || !message || hasReservedEphemeral
                }
            ]}
            notice={notice ? { message: notice, type: "critical" } : undefined}
        >
            <Flex flexDirection="column" gap={12}>
                <section>
                    <Heading className={Margins.bottom8}>名前</Heading>
                    <TextInput value={name} onChange={setName} placeholder="greet" />
                </section>

                <section>
                    <Heading className={Margins.bottom8}>応答</Heading>
                    <TextArea value={message} onChange={setMessage} placeholder={EXAMPLE_RESPONSE} autosize />
                </section>

                {detectedArguments.length > 0 && (
                    <section>
                        <Heading className={Margins.bottom8}>検出された引数</Heading>
                        <Paragraph>
                            <ul>
                                {detectedArguments.map(arg => (
                                    <li key={arg.name}>
                                        &mdash; <b>{arg.name}</b>{arg.defaultValue ? ` (デフォルト: ${arg.defaultValue})` : ""}
                                    </li>
                                ))}
                            </ul>
                        </Paragraph>
                    </section>
                )}

                <ExpandableSection
                    renderContent={() => (
                        <Flex flexDirection="column" gap={12}>
                            <Paragraph>
                                応答には二重中括弧で囲んだ変数を含めることができ、それがコマンドの引数になります。例: <InlineCode>{"Hello {{user}}"}</InlineCode>.
                            </Paragraph>
                            <Paragraph>
                                イコール記号を使うと、引数にデフォルト値を指定できます。例: <InlineCode>{"Hello {{user = pal}}"}</InlineCode>.
                            </Paragraph>

                            <section>
                                <Paragraph><b>コマンド応答の例:</b> <InlineCode>{EXAMPLE_RESPONSE}</InlineCode></Paragraph>
                                <Paragraph><b>使用例:</b> <InlineCode>{"/greet user:@Clyde"}</InlineCode></Paragraph>
                                <Paragraph><b>出力例:</b> <InlineCode>{"Hello @Clyde! I am feeling great."}</InlineCode></Paragraph>
                            </section>
                        </Flex>
                    )}
                >
                    <Flex alignItems="center" gap={8}>
                        <InfoIcon color="var(--text-muted)" height={16} width={16} />
                        View Arguments guide
                    </Flex>
                </ExpandableSection>
            </Flex>
        </Modal>
    );
}
