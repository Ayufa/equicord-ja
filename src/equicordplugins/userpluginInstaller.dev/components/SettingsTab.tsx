/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 nin0
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { pluginRequiresRestart, startPlugin, stopPlugin } from "@api/PluginManager";
import { useSettings } from "@api/Settings";
import { BaseText } from "@components/BaseText";
import { Button } from "@components/Button";
import { Card } from "@components/Card";
import { CheckedTextInput } from "@components/CheckedTextInput";
import { HeadingTertiary } from "@components/Heading";
import { DeleteIcon } from "@components/Icons";
import { Paragraph } from "@components/Paragraph";
import { AddonCard } from "@components/settings";
import {
    SettingsTab as STab,
    wrapTab,
} from "@components/settings/tabs/BaseTab";
import { classes, isObjectEmpty } from "@utils/misc";
import { relaunch } from "@utils/native";
import { Alerts, closeAllModals, NavigationRouter, showToast,useEffect, useState } from "@webpack/common";

import userpluginInstaller, { Native } from "..";
import {
    cl,
    CLONE_LINK_REGEX,
    showInstallFinishedAlert,
} from "../misc/constants";

function UserPluginsTab() {
    const rs = useSettings(["plugins.*"]);
    const [pluginsLoaded, loadPlugins] = useState(false);
    const [plugins, setPlugins] = useState<
        {
            name: string;
            description: string;
            usesPreSend: boolean;
            usesNative: boolean;
            directory?: string;
            remote: string;
            supportChannelID?: string;
        }[]
    >([]);
    const [url, setUrl] = useState("");
    const [valid, setValid] = useState(false);
    const [pluginsWithUpdates, setPluginsWithUpdates] = useState<
        Record<string, string>
    >({});
    const [updatesLoaded, loadUpdates] = useState(false);

    useEffect(() => {
        const { plugins: plgobj, pluginsWithUpdates: pwug } =
            userpluginInstaller;
        setPlugins(plgobj.value());
        loadPlugins(true);
        const cid2 = plgobj.registerCallback(value => setPlugins(value));

        const setPWU = value => {
            const pwu = value.plugins.map(pg => ({
                [pg]: plgobj.value().find(pfjh => pfjh.directory === pg)
                    ?.name,
            }));
            setPluginsWithUpdates(Object.assign({}, ...pwu));
            loadUpdates(value.finished);
        };
        const cid = pwug.registerCallback(value => {
            setPWU(value);
        });
        setPWU(pwug.value());

        return () => {
            pwug.deregisterCallback(cid);
            plgobj.deregisterCallback(cid2);
        };
    }, []);

    return (
        <STab
            // @ts-ignore
            title={`ユーザープラグイン${pluginsLoaded ? ` (${plugins.length}件、${plugins.filter(p => Vencord.Settings.plugins[p.name].enabled).length}件有効)` : ""}`}
        >
            <div className={cl("update-check-container")}>
                {isObjectEmpty(pluginsWithUpdates) ? (
                    !updatesLoaded && (
                        <BaseText>更新を確認しています...</BaseText>
                    )
                ) : (
                    <Card
                        className={classes(cl("info-card"), "vc-warning-card")}
                    >
                        <HeadingTertiary className={cl("install-title")}>
                            プラグインの更新があります
                        </HeadingTertiary>
                        <Paragraph className={cl("install-desc")}>
                            次のプラグインが古くなっています:
                            <ul className={cl("outdated-list")}>
                                {Object.values(pluginsWithUpdates)
                                    .toSorted()
                                    .map(pl => (
                                        <li key={pl}>{pl}</li>
                                    ))}
                            </ul>
                            {!updatesLoaded &&
                                "更新チェックが終わっていないため、他にもある可能性があります。"}
                            下からプラグインを更新できます。
                        </Paragraph>
                    </Card>
                )}
            </div>
            <Card className={cl("info-card")}>
                <HeadingTertiary className={cl("install-title")}>
                    プラグインをインストール
                </HeadingTertiary>
                <Paragraph className={cl("install-desc")}>
                    GitHub、GitLab、Codeberg、git.nin0.dev、plugins.nin0.dev の
                    プラグインは、クローンURLをここに貼り付けて
                    インストールできます。
                </Paragraph>
                <div className={cl("install-field")}>
                    <CheckedTextInput
                        onChange={t => setUrl(t)}
                        validate={t => {
                            const match = t.match(CLONE_LINK_REGEX);
                            if (match) {
                                const idpl = match.includes("plugins.nin0.dev")
                                    ? 1
                                    : 0;
                                const installed = plugins
                                    .map(p => p.directory)
                                    .includes(match[[3, 6][idpl]]);
                                if (installed) {
                                    setValid(false);
                                    return "プラグインはインストール済みです。下から更新してください";
                                }
                                setValid(true);
                                return true;
                            } else {
                                setValid(false);
                                return "無効なURLです。上の注意書きを読んでください";
                            }
                        }}
                        initialValue={url}
                    />
                </div>
                <div className={cl("button-container")}>
                    <Button
                        disabled={!valid}
                        className={cl("install-button")}
                        onClick={async () => {
                            const gitLink = url.match(CLONE_LINK_REGEX)!;
                            const idpl = gitLink.includes("plugins.nin0.dev")
                                ? 1
                                : 0;
                            try {
                                const { name, native } = JSON.parse(
                                    await Native.initPluginInstall(
                                        gitLink[0],
                                        gitLink[[1, 4][idpl]],
                                        gitLink[[2, 5][idpl]],
                                        gitLink[[3, 6][idpl]],
                                    ),
                                );
                                showInstallFinishedAlert(name, native);
                            } catch (e: any) {
                                if (e.toString().includes("silentStop")) return;
                                Alerts.show({
                                    title: "インストールエラー",
                                    body: e.toString(),
                                });
                            }
                        }}
                    >
                        Install
                    </Button>
                </div>
            </Card>
            <div className={cl("plugins-container")}>
                {pluginsLoaded ? (
                    <div className={cl("plugins-grid")}>
                        {plugins
                            .toSorted((a, b) =>
                                a.name.localeCompare(b.name, "en", {
                                    sensitivity: "base",
                                }),
                            )
                            .toSorted((a, b) => {
                                const updatePendingNames =
                                    Object.keys(pluginsWithUpdates);
                                const [aa, bb] = [
                                    updatePendingNames.includes(a.directory!)
                                        ? 1000
                                        : 0,
                                    updatePendingNames.includes(b.directory!)
                                        ? 1000
                                        : 0,
                                ];
                                return bb - aa;
                            })
                            .map(plugin => {

                                const pl = Vencord.Plugins.plugins[
                                    plugin.name
                                ];
                                return <AddonCard
                                    key={pl.name}
                                    name={pl.name}
                                    description={pl.description}
                                    enabled={rs.plugins[pl.name].enabled}
                                    infoButton={<button
                                        role="switch"
                                        onClick={async () => {
                                            await Native.rmPlugin(
                                                plugin.directory!,
                                            );
                                            Alerts.show({
                                                title: "完了！",
                                                body: `${plugin.name} をアンインストールしました。完全に削除するには${plugin.usesNative ? "再起動" : "再読み込み"}が必要です。`,
                                                confirmText:
                                                    plugin.usesNative
                                                        ? "再起動"
                                                        : "再読み込み",
                                                cancelText: "後で",
                                                onConfirm() {
                                                    plugin.usesNative
                                                        ? relaunch()
                                                        : window.location.reload();
                                                },
                                            });
                                        }}
                                        className={cl("delete-button")}
                                    >
                                        <DeleteIcon />
                                    </button>}
                                    setEnabled={t => {
                                        Vencord.Settings.plugins[pl.name].enabled = t;
                                        if (pluginRequiresRestart(pl)) {
                                            showToast({ text: "変更を適用するには再起動してください！" });
                                        } else {
                                            (t ? startPlugin : stopPlugin)(pl);
                                        }
                                    }}
                                    footer={(
                                        <div className={cl("plugin-footer")}>
                                            {Object.keys(
                                                pluginsWithUpdates,
                                            ).includes(plugin.directory!) && (
                                                    <Button
                                                        size="small"
                                                        onClick={async () => {
                                                            try {
                                                                await Native.updatePlugin(
                                                                    plugin.directory!,
                                                                );
                                                                const oldPWU =
                                                                    userpluginInstaller.pluginsWithUpdates.value()
                                                                        .plugins;
                                                                oldPWU.splice(
                                                                    oldPWU.indexOf(
                                                                        plugin.directory!,
                                                                    ),
                                                                    1,
                                                                );
                                                                userpluginInstaller.pluginsWithUpdates.value(
                                                                    {
                                                                        finished: true,
                                                                        plugins: oldPWU,
                                                                    },
                                                                );
                                                                Alerts.show({
                                                                    title: "完了！",
                                                                    body: `${plugin.name} を更新しました。更新を適用するには${plugin.usesNative ? "再起動" : "再読み込み"}が必要です。`,
                                                                    confirmText:
                                                                        plugin.usesNative
                                                                            ? "再起動"
                                                                            : "再読み込み",
                                                                    cancelText: "後で",
                                                                    onConfirm() {
                                                                        plugin.usesNative
                                                                            ? relaunch()
                                                                            : window.location.reload();
                                                                    },
                                                                });
                                                            } catch (e: any) {
                                                                if (
                                                                    e
                                                                        .toString()
                                                                        .includes(
                                                                            "silentStop",
                                                                        )
                                                                )
                                                                    return;
                                                                Alerts.show({
                                                                    title: "更新エラー",
                                                                    body: e.toString(),
                                                                });
                                                            }
                                                        }}
                                                    >
                                                        更新
                                                    </Button>
                                                )}
                                            <Button
                                                variant="secondary"
                                                size="small"
                                                disabled={plugin.remote === ""}
                                                onClick={() =>
                                                    VencordNative.native.openExternal(
                                                        plugin.remote,
                                                    )
                                                }
                                            >
                                                ソース
                                            </Button>
                                            {plugin.supportChannelID && <Button variant="secondary" size="small" onClick={() => {
                                                closeAllModals();
                                                NavigationRouter.transitionTo(`/channels/1015060230222131221/${plugin.supportChannelID}`);
                                            }}>
                                                サポート
                                            </Button>}
                                        </div>
                                    )}
                                />;
                            })}
                    </div>
                ) : (
                    <BaseText>プラグインを読み込んでいます...</BaseText>
                )}
            </div>
        </STab>
    );
}

export default wrapTab(UserPluginsTab, "ユーザープラグイン");
