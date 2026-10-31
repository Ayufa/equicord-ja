/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button } from "@components/Button";
import { Alerts, showToast,useState } from "@webpack/common";

import { clearMessagesIDB } from "../db";
import { Flogger } from "../index";

interface ClearLogsButtonProps {
    label?: string;
    onCleared?: () => void;
}

export function ClearLogsButton({ label = "ログをクリア", onCleared }: ClearLogsButtonProps) {
    const [loading, setLoading] = useState(false);
    return (
        <Button
            disabled={loading}
            variant="dangerPrimary"
            onClick={() => Alerts.show({
                title: "ログをクリア",
                body: "すべてのログをクリアしてもよろしいですか？",
                // @ts-ignore
                confirmVariant: "critical-primary",
                confirmText: "クリア",
                cancelText: "キャンセル",
                onConfirm: async () => {
                    setLoading(true);
                    try {
                        await clearMessagesIDB();
                        onCleared?.();
                        showToast({ text: "ログをクリアしました", variant: "success" });
                    } catch (err) {
                        Flogger.error("Failed to clear logs", err);
                        showToast({ text: "ログのクリアに失敗しました", variant: "critical" });
                    } finally {
                        setLoading(false);
                    }
                },
            })}
        >
            {loading ? "ログをクリア中..." : label}
        </Button>
    );
}
