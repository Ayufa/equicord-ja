/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ErrorCard } from "@components/ErrorCard";
import { UpdateLogger } from "@utils/updater";
import { ConfirmModal, openModal, Parser } from "@webpack/common";

function getErrorMessage(e: any) {
    if (!e?.code || !e.cmd)
        return "不明なエラーが発生しました。\nもう一度試すか、コンソールで詳細を確認してください。";

    const { code, path, cmd, stderr } = e;

    if (code === "ENOENT")
        return `コマンド \`${path}\` が見つかりません。\nインストールしてからもう一度試してください。`;

    const extra = stderr || `コード \`${code}\`。詳細はコンソールを確認してください。`;

    return `\`${cmd}\` の実行中にエラーが発生しました:\n${extra}`;
}

export function runWithDispatch(dispatch: React.Dispatch<React.SetStateAction<boolean>>, action: () => any) {
    return async () => {
        dispatch(true);

        try {
            await action();
        } catch (e: any) {
            UpdateLogger.error(e);

            const err = getErrorMessage(e);

            openModal(props => (
                <ConfirmModal
                    {...props}
                    title="おっと！"
                    confirmText="OK"
                    variant="primary"
                >
                    <ErrorCard>
                        {err.split("\n").map((line, idx) =>
                            <div key={idx}>{Parser.parse(line)}</div>
                        )}
                    </ErrorCard>
                </ConfirmModal>
            ));
        } finally {
            dispatch(false);
        }
    };
}
