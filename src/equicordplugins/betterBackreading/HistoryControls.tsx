/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button } from "@components/Button";
import { SettingsSection } from "@components/settings/tabs/plugins/components/Common";
import { useEffect, useState } from "@webpack/common";

interface HistoryControlsProps {
    onClear: () => Promise<void>;
}

/** Render the saved-history reset control and its completion status. */
export function HistoryControls(props: HistoryControlsProps) {
    const { onClear } = props;
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<{ label: "成功" | "失敗"; } | null>(null);

    useEffect(() => {
        if (!result) {
            return;
        }

        const timeout = setTimeout(() => setResult(null), 5000);

        return () => clearTimeout(timeout);
    }, [result]);

    async function clear() {
        setBusy(true);
        setResult(null);

        try {
            await onClear();
            setResult({ label: "成功" });
        } catch {
            setResult({ label: "失敗" });
        } finally {
            setBusy(false);
        }
    }

    return (
        <SettingsSection
            id="clearSavedHistory"
            name="保存した履歴を消去"
            description="再読み込み後にスクロール位置を復元するために記録している、ローカルの読み返し進捗を消去します。"
        >
            <Button variant="secondary" style={{ width: "100%" }} disabled={busy} aria-busy={busy} aria-live="polite" onClick={clear}>
                {result?.label ?? "消去"}
            </Button>
        </SettingsSection>
    );
}
