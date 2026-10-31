/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { ModalOptions, ModalProps, RenderModalProps } from "@vencord/discord-types";
import { Modal, openModal, useEffect, useState } from "@webpack/common";
import type { ComponentType, JSX } from "react";

import { getQuestifySettings } from "./access";
import { resetDangerousSettings } from "./dangerous";
import { promptToRestartIfDirty } from "./restartTracking";

type NoticeActionVariant = "primary" | "secondary" | "critical-primary" | "critical-secondary" | "active" | "overlay-primary" | "overlay-secondary" | "expressive";

type QuestifyModalOptions = ModalOptions & { dismissable?: boolean; };
type QuestifyModalProps = ModalProps & { dismissable?: boolean; };

const QuestifyModal = Modal as ComponentType<QuestifyModalProps>;

interface NoticeActionStep {
    text: string;
    variant?: NoticeActionVariant;
    disabledFor?: number; // Seconds
    confirmation?: NoticeActionStep;
}

interface NoticeAction extends NoticeActionStep {
    run?: () => void;
    promptForRestart?: boolean;
}

interface OneTimeNotice {
    id: string;
    title: string;
    dismissable?: boolean;
    renderBody: () => JSX.Element;
    condition: () => boolean;
    autoAcknowledgeCondition?: () => boolean;
    actions: readonly NoticeAction[];
}

const oneTimeNotices = [
    {
        id: "quest-ban-warning-2026-08-07",
        title: "Questify からのお知らせ - 2026年8月7日",
        renderBody: () => <div className="questify-startup-notice-body">
            <p>
                Discord はクエストBANシステムを導入しました。非公式な手段でクエストを完了していることが判明した場合、クエストの完了や報酬の受け取りへのアクセスが一時的または永久的に制限されます。クエストの完了方法を変更することは、Discord の<a href="https://discord.com/safety/platform-manipulation-policy-explainer" target="_blank" rel="noreferrer">利用規約</a>に違反します。
            </p>
            <br />
            <p>
                処分はクエストとその報酬へのアクセス喪失に限られるようですが、Discord はいつでも処分を重くする可能性があります。
            </p>
            <br />
            <p>
                Discord はユーザーを追跡するためにさまざまな手段を用いているため、検出を現実的に回避する方法はありません。続行する場合は、いずれ Discord に検出される可能性が高いことを理解してください。
            </p>
        </div>,
        condition: () => {
            const settings = getQuestifySettings();

            return settings.enabled && settings.allowChangingDangerousSettings;
        },
        autoAcknowledgeCondition: () => !getQuestifySettings().allowChangingDangerousSettings,
        actions: [
            {
                text: "危険な Questify 設定を使い続ける",
                variant: "critical-primary",
            },
            {
                text: "危険な Questify 設定を無効化する",
                variant: "primary",
                run: resetDangerousSettings,
                promptForRestart: true,
            },
        ],
    },
    {
        id: "quest-ban-warning-2026-08-26",
        title: "Questify からのお知らせ - 2026年8月26日",
        dismissable: false,
        renderBody: () => <div className="questify-startup-notice-body">
            <p>
                Discord は、クエストの完了方法を変更するスクリプトやプラグインの使用者への処分を開始しました。クエストの完了方法を変更することは、Discord の<a href="https://discord.com/safety/platform-manipulation-policy-explainer" target="_blank" rel="noreferrer">利用規約</a>に違反します。
            </p>
            <br />
            <p>
                処分は、クエストとその報酬へのアクセスを一時的または永久的に失うことです。<strong>さらに、違反1件ごとに2年間続くアカウントステータス違反も含まれます。</strong>
            </p>
            <br />
            <p>
                Discord はユーザーを追跡するためにさまざまな手段を用いているため、検出を現実的に回避する方法はありません。続行する場合は、いずれ Discord に使用を検出される可能性が高いことを理解してください。
            </p>
        </div>,
        condition: () => {
            const settings = getQuestifySettings();

            return settings.enabled && settings.allowChangingDangerousSettings;
        },
        autoAcknowledgeCondition: () => !getQuestifySettings().allowChangingDangerousSettings,
        actions: [
            {
                text: "危険な Questify 設定を使い続ける",
                variant: "critical-primary",
                disabledFor: 10,
                confirmation: {
                    text: "本当によろしいですか？",
                    variant: "critical-secondary",
                    disabledFor: 5,
                },
            },
            {
                text: "危険な Questify 設定を無効化する",
                variant: "primary",
                run: resetDangerousSettings,
                promptForRestart: true,
            },
        ],
    },
] as const satisfies readonly OneTimeNotice[];

function acknowledgeNotice(id: string): void {
    const settings = getQuestifySettings();

    settings.acknowledgedNotices = {
        ...settings.acknowledgedNotices,
        [id]: true,
    };
}

function runNoticeAction(notice: OneTimeNotice, action: NoticeAction, onClose: () => void): void {
    acknowledgeNotice(notice.id);
    action.run?.();
    onClose();

    setTimeout(() => {
        if (!action.promptForRestart || !promptToRestartIfDirty({ onDecline: showPendingQuestifyNotice })) {
            showPendingQuestifyNotice();
        }
    }, 0);
}

interface NoticeActionState {
    step: NoticeActionStep;
    startedAt: number;
}

function getRemainingSeconds({ startedAt, step }: NoticeActionState, now: number): number {
    const disabledFor = Math.max(0, step.disabledFor ?? 0);

    return Math.max(0, Math.ceil((startedAt + disabledFor * 1000 - now) / 1000));
}

function isNoticeDismissable(notice: OneTimeNotice): boolean {
    return notice.dismissable ?? true;
}

function OneTimeNoticeModal({ notice, ...modalProps }: RenderModalProps & { notice: OneTimeNotice; }): JSX.Element {
    const [actionStates, setActionStates] = useState<NoticeActionState[]>(() => {
        const startedAt = Date.now();

        return notice.actions.map(step => ({ step, startedAt }));
    });

    const [now, setNow] = useState(Date.now);
    const remainingSeconds = actionStates.map(actionState => getRemainingSeconds(actionState, now));
    const isCountingDown = remainingSeconds.some(seconds => seconds > 0);

    useEffect(() => {
        if (!isCountingDown) return;

        const timeout = setTimeout(() => setNow(Date.now()), 250);

        return () => clearTimeout(timeout);
    }, [actionStates, isCountingDown, now]);

    function handleActionClick(actionIndex: number): void {
        const { confirmation } = actionStates[actionIndex].step;

        if (confirmation) {
            const startedAt = Date.now();

            setActionStates(currentStates => currentStates.map((actionState, index) => (
                index === actionIndex
                    ? { step: confirmation, startedAt }
                    : actionState
            )));
            setNow(startedAt);
            return;
        }

        runNoticeAction(notice, notice.actions[actionIndex], modalProps.onClose);
    }

    return (
        <QuestifyModal
            {...modalProps}
            dismissable={isNoticeDismissable(notice)}
            role="alertdialog"
            size="lg"
            title={notice.title}
            actions={actionStates.map(({ step }, actionIndex) => ({
                text: remainingSeconds[actionIndex] > 0
                    ? `${step.text} (${remainingSeconds[actionIndex]})`
                    : step.text,
                variant: step.variant ?? "primary",
                disabled: remainingSeconds[actionIndex] > 0,
                onClick: () => handleActionClick(actionIndex),
            }))}
        >
            {notice.renderBody()}
        </QuestifyModal>
    );
}

export function showPendingQuestifyNotice(): void {
    for (const notice of oneTimeNotices) {
        if (getQuestifySettings().acknowledgedNotices[notice.id]) {
            continue;
        }

        if (!notice.condition()) {
            if (notice.autoAcknowledgeCondition?.()) {
                acknowledgeNotice(notice.id);
            }

            continue;
        }

        const modalOptions: QuestifyModalOptions = {
            dismissable: isNoticeDismissable(notice),
        };

        openModal(modalProps => <OneTimeNoticeModal {...modalProps} notice={notice} />, modalOptions);
        return;
    }
}
