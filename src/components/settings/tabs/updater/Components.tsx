/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button } from "@components/Button";
import { Card } from "@components/Card";
import { ErrorCard } from "@components/ErrorCard";
import { Flex } from "@components/Flex";
import { Link } from "@components/Link";
import { Paragraph } from "@components/Paragraph";
import { Span } from "@components/Span";
import { Margins } from "@utils/margins";
import { promptToRestart } from "@utils/promptToRestart";
import { changes, checkForUpdates, update, updateError } from "@utils/updater";
import { React, showToast, useState } from "@webpack/common";

import { runWithDispatch } from "./runWithDispatch";

export interface CommonProps {
    repo: string;
    repoPending: boolean;
}

export function HashLink({ repo, hash, disabled = false }: { repo: string, hash: string, disabled?: boolean; }) {
    return (
        <Link href={`${repo}/commit/${hash}`} disabled={disabled}>
            {hash.slice(0, 7)}
        </Link>
    );
}

export function Changes({ updates, repo, repoPending }: CommonProps & { updates: typeof changes; }) {
    return (
        <Card className={Margins.top16} style={{ padding: 0 }} defaultPadding={false}>
            {updates.map(({ hash, author, message }, i) => (
                <div
                    key={hash}
                    style={{
                        padding: "12px 16px",
                        borderBottom: i < updates.length - 1 ? "1px solid var(--border-subtle)" : undefined
                    }}
                >
                    <Flex style={{ alignItems: "center", gap: 8 }}>
                        <code style={{ color: "var(--text-link)" }}>
                            <HashLink {...{ repo, hash }} disabled={repoPending} />
                        </code>
                        <Span size="sm" color="text-default">
                            {message}
                        </Span>
                        <Span size="sm" color="text-subtle">
                            — {author}
                        </Span>
                    </Flex>
                </div>
            ))}
        </Card>
    );
}

export function Newer(props: CommonProps) {
    return (
        <>
            <Paragraph>
                ローカルのコピーには、リモートリポジトリより新しいコミットが含まれています。これは通常、ローカルで変更を行った場合に発生します。更新する前に、変更をスタッシュするかリセットしてください。
            </Paragraph>
            <Changes {...props} updates={changes} />
        </>
    );
}

export function Updatable(props: CommonProps) {
    const [updates, setUpdates] = useState(changes);
    const [isChecking, setIsChecking] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const isOutdated = (updates?.length ?? 0) > 0;

    return (
        <>
            <Flex className={Margins.bottom8} gap="8px">
                <Button
                    disabled={isUpdating || isChecking}
                    onClick={runWithDispatch(setIsChecking, async () => {
                        const outdated = await checkForUpdates();

                        if (outdated) {
                            setUpdates(changes);
                        } else {
                            setUpdates([]);

                            showToast({ text: "更新は見つかりませんでした！", position: "bottom" });

                        }
                    })}
                >
                    更新を確認
                </Button>
                {isOutdated && (
                    <Button
                        size="small"
                        variant="primary"
                        disabled={isUpdating || isChecking}
                        onClick={runWithDispatch(setIsUpdating, async () => {
                            if (await update()) {
                                setUpdates([]);

                                promptToRestart("relaunch", {
                                    title: "更新が完了しました！",
                                    subtitle: "更新が完了しました。変更を適用するために今すぐ再起動しますか？",
                                    confirmText: "再起動",
                                    cancelText: "後で"
                                });
                            }
                        })}
                    >
                        今すぐ更新
                    </Button>
                )}
            </Flex>
            {!updates && updateError ? (
                <>
                    <Span size="md" weight="medium" color="text-strong">更新の確認中にエラーが発生しました</Span>
                    <ErrorCard className={Margins.top8} style={{ padding: "1em" }}>
                        <p>{updateError.stderr || updateError.stdout || "不明なエラーが発生しました"}</p>
                    </ErrorCard>
                </>
            ) : isOutdated ? (
                <>
                    <Paragraph>
                        {updates.length} 件の更新があります。上のボタンをクリックしてダウンロードとインストールを行ってください。
                    </Paragraph>
                    <Changes updates={updates} {...props} />
                </>
            ) : (
                <Paragraph>
                    Equicord の最新バージョンを使用しています。
                </Paragraph>
            )}
        </>
    );
}
