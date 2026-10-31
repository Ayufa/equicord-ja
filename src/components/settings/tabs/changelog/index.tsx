/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { Button } from "@components/Button";
import { Card } from "@components/Card";
import { Divider } from "@components/Divider";
import { ErrorCard } from "@components/ErrorCard";
import { Heading } from "@components/Heading";
import { DeleteIcon } from "@components/Icons";
import { Link } from "@components/Link";
import { Paragraph } from "@components/Paragraph";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { HashLink } from "@components/settings/tabs/updater/Components";
import { Margins } from "@utils/margins";
import { useAwaiter } from "@utils/react";
import { getRepo, UpdateLogger } from "@utils/updater";
import { Alerts, React, showToast } from "@webpack/common";

import gitHash from "~git-hash";

import {
    ChangelogEntry,
    ChangelogHistory,
    clearChangelogHistory,
    clearIndividualLog,
    formatTimestamp,
    getChangelogHistory,
    getCommitsSinceLastSeen,
    getLastRepositoryCheckHash,
    getNewPlugins,
    getNewSettings,
    getNewSettingsEntries,
    getNewSettingsSize,
    getUpdatedPlugins,
    initializeChangelog,
    saveUpdateSession,
    UpdateSession,
} from "./changelogManager";
import { NewPluginsCompact, NewPluginsSection } from "./NewPluginsSection";

function ChangelogCard({
    entry,
    repo,
    repoPending,
}: {
    entry: ChangelogEntry;
    repo: string;
    repoPending: boolean;
}) {
    return (
        <Card className="vc-changelog-entry">
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25em",
                }}
            >
                <div className="vc-changelog-entry-header">
                    <code className="vc-changelog-entry-hash">
                        <HashLink
                            repo={repo}
                            hash={entry.hash}
                            disabled={repoPending}
                        />
                    </code>
                    <span className="vc-changelog-entry-author">
                        作者: {entry.author}
                    </span>
                </div>
                <div className="vc-changelog-entry-message">
                    {entry.message}
                </div>
            </div>
        </Card>
    );
}

function UpdateLogCard({
    log,
    repo,
    repoPending,
    isExpanded,
    onToggleExpand,
    onClearLog,
}: {
    log: UpdateSession;
    repo: string;
    repoPending: boolean;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onClearLog: (logId: string) => void;
}) {
    const isRepositoryFetch =
        log.type === "repository_fetch" ||
        (log.type === undefined &&
            log.fromHash === log.toHash &&
            log.commits.length === 0);
    const isUpToDate = log.fromHash === log.toHash;

    return (
        <Card className="vc-changelog-log">
            <div className="vc-changelog-log-header" onClick={onToggleExpand}>
                <div className="vc-changelog-log-info">
                    <div className="vc-changelog-log-title">
                        <span>
                            {isRepositoryFetch
                                ? isUpToDate
                                    ? `リポジトリ確認: ${log.fromHash.slice(0, 7)}（最新）`
                                    : `リポジトリ確認: ${log.fromHash.slice(0, 7)} → ${log.toHash.slice(0, 7)}`
                                : `更新: ${log.fromHash.slice(0, 7)} → ${log.toHash.slice(0, 7)}`}
                        </span>
                        <Button
                            size="min"
                            variant="secondary"
                            className="vc-changelog-delete-button"
                            style={{
                                padding: "4px",
                                color: "var(--status-danger)",
                                opacity: 0.6,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                            onClick={e => {
                                e.stopPropagation();
                                onClearLog(log.id);
                            }}
                        >
                            <DeleteIcon width={16} height={16} />
                        </Button>
                    </div>
                    <div className="vc-changelog-log-meta">
                        {formatTimestamp(log.timestamp)}
                        {log.commits.length > 0 &&
                            ` • ${log.commits.length} 件のコミット`}
                        {log.commits.length === 0 && " • 新しいコミットなし"}
                        {log.newPlugins.length > 0 &&
                            ` • 新しいプラグイン ${log.newPlugins.length} 件`}
                        {log.updatedPlugins.length > 0 &&
                            ` • 更新されたプラグイン ${log.updatedPlugins.length} 件`}
                        {log.newSettings &&
                            getNewSettingsSize(log.newSettings) > 0 &&
                            ` • ${getNewSettingsEntries(log.newSettings).reduce((sum, [, arr]) => sum + arr.length, 0)} 件の新しい設定`}
                    </div>
                </div>
                <div
                    className={`vc-changelog-log-toggle ${isExpanded ? "expanded" : ""}`}
                >
                    ▼
                </div>
            </div>

            {isExpanded && (
                <div className="vc-changelog-log-content">
                    {log.newPlugins.length > 0 && (
                        <div className="vc-changelog-log-plugins">
                            <NewPluginsCompact
                                newPlugins={log.newPlugins}
                                maxDisplay={50}
                            />
                        </div>
                    )}

                    {log.updatedPlugins.length > 0 && (
                        <div className="vc-changelog-log-plugins">
                            <Heading className={Margins.bottom8}>
                                更新されたプラグイン
                            </Heading>
                            <NewPluginsCompact
                                newPlugins={log.updatedPlugins}
                                maxDisplay={50}
                            />
                        </div>
                    )}

                    {log.newSettings &&
                        getNewSettingsSize(log.newSettings) > 0 && (
                            <div className="vc-changelog-log-plugins">
                                <Heading className={Margins.bottom8}>
                                    新しい設定
                                </Heading>
                                <div className="vc-changelog-new-plugins-list">
                                    {getNewSettingsEntries(log.newSettings).map(
                                        ([pluginName, settings]) =>
                                            settings.map(setting => (
                                                <span
                                                    key={`${pluginName}-${setting}`}
                                                    className="vc-changelog-new-plugin-tag"
                                                    title={`${pluginName} の新しい設定`}
                                                >
                                                    {pluginName}.{setting}
                                                </span>
                                            )),
                                    )}
                                </div>
                            </div>
                        )}

                    {log.commits.length > 0 && (
                        <div className="vc-changelog-log-commits">
                            <div className="vc-changelog-log-commits-list">
                                {log.commits.map(entry => (
                                    <ChangelogCard
                                        key={entry.hash}
                                        entry={entry}
                                        repo={repo}
                                        repoPending={repoPending}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
}

function ChangelogContent() {
    const [repo, repoErr, repoPending] = useAwaiter(getRepo, {
        fallbackValue: "読み込み中…",
    });
    const [changelog, setChangelog] = React.useState<ChangelogEntry[]>([]);
    const [changelogHistory, setChangelogHistory] =
        React.useState<ChangelogHistory>([]);
    const [newPlugins, setNewPlugins] = React.useState<string[]>([]);
    const [updatedPlugins, setUpdatedPlugins] = React.useState<string[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [expandedLogs, setExpandedLogs] = React.useState<Set<string>>(
        new Set(),
    );
    const [showHistory, setShowHistory] = React.useState(false);
    const [recentlyChecked, setRecentlyChecked] = React.useState(false);

    React.useEffect(() => {
        const init = async () => {
            try {
                await initializeChangelog();
                await loadChangelogHistory();
            } catch (err) {
                console.error("Failed to initialize changelog:", err);
            }
        };
        init();
    }, []);

    React.useEffect(() => {
        if (repoErr) {
            UpdateLogger.error("Failed to retrieve repo", repoErr);
            setError("リポジトリ情報の取得に失敗しました");
        }
    }, [repoErr]);

    const loadChangelogHistory = React.useCallback(async () => {
        try {
            const history = await getChangelogHistory();
            setChangelogHistory(history);
        } catch (err) {
            console.error("Failed to load changelog history:", err);
        }
    }, []);

    const loadNewPlugins = React.useCallback(async () => {
        try {
            const newPlgs = await getNewPlugins();
            const updatedPlgs = await getUpdatedPlugins();
            setNewPlugins(newPlgs);
            setUpdatedPlugins(updatedPlgs);
        } catch (err) {
            console.error("Failed to load new plugins:", err);
        }
    }, []);

    const ensureLocalUpdateLogged = React.useCallback(async () => {
        if (repoPending || repoErr) return false;
        const repoUrl = repo;
        if (!repoUrl) return false;

        try {
            const commits = await getCommitsSinceLastSeen(repoUrl);
            if (commits.length === 0) return false;

            const newPlgs = await getNewPlugins();
            const updatedPlgs = await getUpdatedPlugins();
            const newSettings = await getNewSettings();

            await saveUpdateSession(commits, newPlgs, updatedPlgs, newSettings);

            setChangelog(commits);
            setNewPlugins(newPlgs);
            setUpdatedPlugins(updatedPlgs);
            await loadChangelogHistory();
            return true;
        } catch (err) {
            console.error("Failed to log local update:", err);
            return false;
        }
    }, [repo, repoErr, repoPending, loadChangelogHistory]);

    // check if the repository was recently refreshed
    React.useEffect(() => {
        const checkRecentStatus = async () => {
            try {
                const lastRepoCheck = await getLastRepositoryCheckHash();
                const updates = await VencordNative.updater.getUpdates();

                if (updates.ok) {
                    const currentRepoHash =
                        updates.value.length > 0
                            ? updates.value[0].hash
                            : gitHash;
                    setRecentlyChecked(lastRepoCheck === currentRepoHash);
                }
            } catch (err) {
                // ignore errors (hopefully there are none lol)
                setRecentlyChecked(false);
            }
        };

        if (!repoPending && !repoErr) {
            checkRecentStatus();
        }
    }, [repoPending, repoErr]);

    const fetchChangelog = React.useCallback(async () => {
        if (repoPending || repoErr) return;

        setIsLoading(true);
        setError(null);

        try {
            // check if the repository was recently refreshed and that nothing has changed
            const updates = await VencordNative.updater.getUpdates();
            const lastRepoCheck = await getLastRepositoryCheckHash();
            const currentRepoHash =
                updates.ok && updates.value.length > 0
                    ? updates.value[0].hash
                    : gitHash;

            // If repository state hasn't changed since last check
            if (lastRepoCheck === currentRepoHash) {
                setIsLoading(false);
                setRecentlyChecked(true);
                const logged = await ensureLocalUpdateLogged();
                if (!logged) {
                    setChangelog([]);
                    showToast({
                        text: "リポジトリと比べて最新です",
                        position: "bottom"
                    });
                }
                return;
            }

            if (updates.ok && updates.value) {
                if (updates.value.length > 0) {
                    setChangelog(updates.value);

                    const newPlgs = await getNewPlugins();
                    const updatedPlgs = await getUpdatedPlugins();
                    const newSettings = await getNewSettings();
                    setNewPlugins(newPlgs);
                    setUpdatedPlugins(updatedPlgs);

                    await saveUpdateSession(
                        updates.value,
                        newPlgs,
                        updatedPlgs,
                        newSettings,
                        true,
                    );
                    await loadChangelogHistory();
                    setRecentlyChecked(true);

                    showToast({
                        text: `リポジトリから ${updates.value.length} 件のコミットが見つかりました`,
                        variant: "success",
                        position: "bottom"
                    });
                } else {
                    const logged = await ensureLocalUpdateLogged();
                    setRecentlyChecked(true);
                    showToast({
                        text: logged
                            ? "最新の更新のコミットを記録しました"
                            : "リポジトリはローカルのコピーと比べて最新です",
                        variant: logged ? "success" : "default",
                        position: "bottom"
                    });
                    if (!logged) {
                        setChangelog([]);
                    }
                }
            } else if (!updates.ok) {
                throw new Error(
                    updates.error?.message || "リポジトリからの取得に失敗しました",
                );
            }
        } catch (err: any) {
            UpdateLogger.error("Failed to fetch commits from repository", err);
            const errorMessage =
                err?.message ||
                "リポジトリへの接続に失敗しました。インターネット接続を確認してください。";
            setError(errorMessage);

            // funny little error toast hopefully doesn't happen!
            showToast({
                text: "リポジトリからコミットを取得できませんでした",
                variant: "critical",
                position: "bottom"
            });
        } finally {
            setIsLoading(false);
        }
    }, [repoPending, repoErr, loadNewPlugins, loadChangelogHistory]);

    React.useEffect(() => {
        const loadInitialData = async () => {
            if (!repoPending && !repoErr) {
                await loadNewPlugins();
                const logged = await ensureLocalUpdateLogged();
                if (!logged) {
                    await fetchChangelog();
                } else {
                    setIsLoading(false);
                }
            } else if (!repoPending) {
                // perseverance
                await loadNewPlugins();
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, [
        repoPending,
        repoErr,
        fetchChangelog,
        loadNewPlugins,
        ensureLocalUpdateLogged,
    ]);

    const toggleLogExpanded = (logId: string) => {
        const newExpanded = new Set(expandedLogs);
        if (newExpanded.has(logId)) {
            newExpanded.delete(logId);
        } else {
            newExpanded.add(logId);
        }
        setExpandedLogs(newExpanded);
    };

    const hasCurrentChanges =
        changelog.length > 0 ||
        newPlugins.length > 0 ||
        updatedPlugins.length > 0;

    return (
        <>
            <Heading className={Margins.top16}>変更を取得</Heading>
            <Paragraph className={Margins.bottom16}>
                リポジトリで新しいコミット、プラグインの更新、コードの変更を確認します。現在のバージョンを利用可能な最新バージョンと比較し、新しい内容を表示します。
            </Paragraph>

            <div className="vc-changelog-controls">
                <Button
                    size="small"
                    disabled={isLoading || repoPending || !!repoErr}
                    onClick={fetchChangelog}
                    variant={recentlyChecked ? "positive" : "primary"}
                >
                    {isLoading
                        ? "読み込み中…"
                        : recentlyChecked
                            ? "リポジトリは最新です"
                            : "リポジトリから取得"}
                </Button>

                {changelogHistory.length > 0 && (
                    <>
                        <Button
                            size="small"
                            variant={showHistory ? "primary" : "secondary"}
                            onClick={() => setShowHistory(!showHistory)}
                            style={{ marginLeft: "8px" }}
                        >
                            {showHistory ? "ログを隠す" : "ログを表示"}
                        </Button>
                        <Button
                            size="small"
                            variant="dangerPrimary"
                            onClick={() => {
                                Alerts.show({
                                    title: "すべてのログを消去",
                                    body: "すべてのログを消去してもよろしいですか？この操作は取り消せません。",
                                    confirmText: "すべて消去",
                                    confirmColor: "danger",
                                    cancelText: "キャンセル",
                                    onConfirm: async () => {
                                        await clearChangelogHistory();
                                        await loadChangelogHistory();
                                        setShowHistory(false);
                                        showToast({
                                            text: "すべてのログを消去しました",
                                            variant: "success",
                                            position: "bottom"
                                        });
                                    },
                                });
                            }}
                            style={{ marginLeft: "8px" }}
                        >
                            すべてのログを消去
                        </Button>
                    </>
                )}
            </div>

            {error && (
                <ErrorCard style={{ padding: "1em", marginTop: "1em" }}>
                    <Paragraph>{error}</Paragraph>
                    <Paragraph color="text-subtle" style={{ marginTop: "0.5em" }}>
                        インターネット接続があることを確認して、もう一度試してください。
                    </Paragraph>
                </ErrorCard>
            )}

            <Divider className={Margins.top20} />

            <Heading className={Margins.top20}>リポジトリ</Heading>
            <Paragraph className={Margins.bottom8}>
                Equicord が更新を取得する GitHub リポジトリです。
            </Paragraph>
            <Paragraph color="text-subtle">
                {repoPending ? (
                    repo
                ) : repoErr ? (
                    "取得に失敗しました - コンソールを確認してください"
                ) : (
                    <Link href={repo}>
                        {repo.split("/").slice(-2).join("/")}
                    </Link>
                )}
                {" "}(<HashLink repo={repo} hash={gitHash} disabled={repoPending} />)
            </Paragraph>

            {hasCurrentChanges && (
                <>
                    <Divider className={Margins.top20} />

                    <Heading className={Margins.top20}>最近の変更</Heading>
                    <Paragraph className={Margins.bottom16}>
                        前回のバージョン以降の新しいコミットとプラグインの更新です。追加された機能、修正されたバグ、更新されたプラグインを確認できます。
                    </Paragraph>

                    {newPlugins.length > 0 && (
                        <div className={Margins.bottom16}>
                            <NewPluginsSection
                                newPlugins={newPlugins}
                                onPluginToggle={() => { }}
                            />
                        </div>
                    )}

                    {updatedPlugins.length > 0 && (
                        <div className={Margins.bottom16}>
                            <Heading className={Margins.bottom8}>
                                更新されたプラグイン（{updatedPlugins.length}）
                            </Heading>
                            <NewPluginsCompact newPlugins={updatedPlugins} />
                        </div>
                    )}

                    {changelog.length > 0 && (
                        <div>
                            <Heading className={Margins.bottom8}>
                                コードの変更（{changelog.length} 件のコミット）
                            </Heading>
                            <div className="vc-changelog-commits-list">
                                {changelog.map(entry => (
                                    <ChangelogCard
                                        key={entry.hash}
                                        entry={entry}
                                        repo={repo}
                                        repoPending={repoPending}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {!hasCurrentChanges && !isLoading && !error && (
                <>
                    <Divider className={Margins.top20} />
                    <Heading className={Margins.top20}>最近の変更</Heading>
                    <Paragraph color="text-subtle">
                        現在のバージョンより先のコミットはありません。「リポジトリから取得」をクリックして新しい変更を確認してください。
                    </Paragraph>
                </>
            )}

            {showHistory && changelogHistory.length > 0 && (
                <>
                    <Divider className={Margins.top20} />

                    <Heading className={Margins.top20}>
                        更新ログ（{changelogHistory.length} 件）
                    </Heading>
                    <Paragraph className={Margins.bottom16}>
                        過去の更新セッションの履歴（コミット履歴とプラグインの変更を含む）です。ログをクリックすると展開して詳細が見られます。
                    </Paragraph>

                    <div className="vc-changelog-history-list">
                        {changelogHistory.map(log => (
                            <UpdateLogCard
                                key={log.id}
                                log={log}
                                repo={repo}
                                repoPending={repoPending}
                                isExpanded={expandedLogs.has(log.id)}
                                onToggleExpand={() => toggleLogExpanded(log.id)}
                                onClearLog={logId => {
                                    Alerts.show({
                                        title: "ログを消去",
                                        body: "このログを消去してもよろしいですか？この操作は取り消せません。",
                                        confirmText: "ログを消去",
                                        confirmColor: "danger",
                                        cancelText: "キャンセル",
                                        onConfirm: async () => {
                                            await clearIndividualLog(logId);
                                            await loadChangelogHistory();
                                            setExpandedLogs(
                                                new Set(
                                                    Array.from(expandedLogs).filter(id => id !== logId),
                                                ),
                                            );
                                            showToast({
                                                text: "ログを消去しました",
                                                variant: "success",
                                                position: "bottom"
                                            });
                                        },
                                    });
                                }}
                            />
                        ))}
                    </div>
                </>
            )}
        </>
    );
}

function ChangelogTab() {
    return (
        <SettingsTab>
            <ChangelogContent />
        </SettingsTab>
    );
}

export default wrapTab(ChangelogTab, "変更履歴");
