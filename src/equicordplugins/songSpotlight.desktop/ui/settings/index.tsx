/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { BaseText } from "@components/BaseText";
import { Button } from "@components/Button";
import ErrorBoundary from "@components/ErrorBoundary";
import { Flex } from "@components/Flex";
import { apiConstants, deleteData, getData, saveData } from "@equicordplugins/songSpotlight.desktop/lib/api";
import { presentOAuth2Modal } from "@equicordplugins/songSpotlight.desktop/lib/oauth2";
import { useAuthorizationStore } from "@equicordplugins/songSpotlight.desktop/lib/stores/AuthorizationStore";
import { useSongStore } from "@equicordplugins/songSpotlight.desktop/lib/stores/SongStore";
import { cl } from "@equicordplugins/songSpotlight.desktop/lib/utils";
import { Native } from "@equicordplugins/songSpotlight.desktop/service";
import { Spinner } from "@equicordplugins/songSpotlight.desktop/ui/common";
import SongList from "@equicordplugins/songSpotlight.desktop/ui/settings/SongList";
import { UserData, UserDataSchema } from "@song-spotlight/api/structs";
import { sid } from "@song-spotlight/api/util";
import { readClipboard } from "@utils/clipboard";
import { copyWithToast } from "@utils/discord";
import { RenderModalProps } from "@vencord/discord-types";
import { Alerts, Modal, openModal, Parser, showToast, useCallback, useEffect, useMemo, useRef, useState } from "@webpack/common";

interface ImportButtonProps {
    overwrite: boolean;
    pending: boolean;
    setPending(pending: boolean): void;
    onImport(data: UserData): void;
}

function ImportButton({ overwrite, pending, setPending, onImport }: ImportButtonProps) {
    const checkClipboard = useCallback(async () => {
        setPending(true);

        let json: unknown;
        try {
            json = JSON.parse(await readClipboard());
        } catch {
            setPending(false);
            return showToast({ text: "クリップボードにJSONがありません！", variant: "critical" });
        }

        const { error, data } = UserDataSchema.max(apiConstants.songLimit).safeParse(json);
        if (error) {
            setPending(false);
            return showToast({ text: "クリップボード内のSong Spotlightデータが無効です！", variant: "critical" });
        }

        const validated = await Promise.allSettled(data.map(song => Native.validateSong(song)));
        if (!validated.every(x => x.status === "fulfilled" && x.value)) {
            setPending(false);
            return showToast({ text: "インポートした曲の一部が無効でした。", variant: "critical" });
        }

        onImport(data);
        setPending(false);
        showToast({ text: "クリップボードから曲をインポートしました！", variant: "success" });
    }, [pending]);

    return (
        <Button
            variant="secondary"
            onClick={async () => {
                if (overwrite) {
                    Alerts.show({
                        title: "本当によろしいですか？",
                        body: "現在の曲が上書きされます。",
                        onConfirm: checkClipboard,
                        confirmText: "続ける",
                        cancelText: "やめる",
                    });
                } else checkClipboard();
            }}
            disabled={pending}
        >
            クリップボードからインポート
        </Button>
    );
}

interface SettingsProps {
    templateData?: UserData;
}

export default function Settings({ templateData }: SettingsProps) {
    const { isAuthorized, deleteTokens } = useAuthorizationStore();
    const { self } = useSongStore();

    const ticked = useRef(false);
    const [localData, setLocalData] = useState(templateData ?? self?.data);
    useEffect(() => {
        // only setLocalData on the second time this effect runs
        if (ticked.current) setLocalData(self?.data);
        else ticked.current = true;
    }, [self?.data]);
    const [pending, setPending] = useState(!localData);

    const isSame = useMemo(() =>
        self?.data && localData
            ? self.data.length === localData.length && self.data.map(sid).join(",") === localData.map(sid).join(",")
            : true, [self?.data, localData]);

    useEffect(() => {
        if (isAuthorized() && !localData) getData().then(() => setPending(false));
    }, [isAuthorized()]);

    if (!isAuthorized()) return <Button onClick={() => presentOAuth2Modal()}>Song Spotlightにサインイン</Button>;

    return (
        <Flex flexDirection="column" gap="20px">
            <BaseText size="md" weight="normal">
                あなたの曲は {Parser.parse("</songspotlight:1468320979938971802>")} コマンドでも確認できます！
            </BaseText>
            {localData
                ? (
                    <Flex flexDirection="column" gap="12px">
                        <Flex flexDirection="column" gap={0}>
                            <BaseText size="lg" weight="semibold">曲</BaseText>
                            {self?.at
                                && (
                                    <BaseText size="xs" weight="normal" className={cl("sub")}>
                                        最終更新 <b>{Intl.DateTimeFormat().format(new Date(self.at))}</b>
                                    </BaseText>
                                )}
                        </Flex>
                        <Flex flexDirection="column" gap="6px">
                            <SongList
                                localData={localData}
                                setLocalData={setLocalData}
                            />
                        </Flex>
                        <Flex flexDirection="column" gap="8px">
                            <div className={cl("twin-buttons")}>
                                <Button
                                    variant="secondary"
                                    onClick={() => copyWithToast(JSON.stringify(localData))}
                                    disabled={pending}
                                >
                                    クリップボードにコピー
                                </Button>
                                <ImportButton
                                    overwrite={!!localData[0]}
                                    pending={pending}
                                    setPending={setPending}
                                    onImport={setLocalData}
                                />
                            </div>
                            <Button
                                variant="primary"
                                onClick={async () => {
                                    setPending(true);
                                    try {
                                        await saveData(localData);
                                        showToast({ text: "曲を保存しました！", variant: "success" });
                                    } finally {
                                        setPending(false);
                                    }
                                }}
                                disabled={isSame || pending}
                            >
                                保存
                            </Button>
                        </Flex>
                    </Flex>
                )
                : <Spinner type={Spinner.Type.WANDERING_CUBES} />}
            <Flex flexDirection="column" gap="12px">
                <BaseText size="lg" weight="semibold">認証</BaseText>
                <div className={cl("twin-buttons")}>
                    <Button
                        variant="dangerPrimary"
                        onClick={() => {
                            deleteTokens();
                            showToast({ text: "サインアウトしました！", variant: "success" });
                        }}
                        disabled={pending}
                    >
                        サインアウト
                    </Button>
                    <Button
                        variant="dangerSecondary"
                        onClick={() =>
                            Alerts.show({
                                title: "本当によろしいですか？",
                                body: "すべての曲が完全に削除されます。",
                                onConfirm: async () => {
                                    setPending(true);
                                    try {
                                        await deleteData();
                                        deleteTokens();

                                        showToast({ text: "曲を削除しました！", variant: "success" });
                                    } finally {
                                        setPending(false);
                                    }
                                },
                                confirmColor: "danger",
                                confirmText: "削除",
                                cancelText: "やめる",
                            })}
                        disabled={!self?.data[0] || pending}
                    >
                        曲を削除
                    </Button>
                </div>
            </Flex>
        </Flex>
    );
}

export function SettingsModal({ modalProps, ...props }: SettingsProps & { modalProps: RenderModalProps; }) {
    return (
        <ErrorBoundary>
            <Modal {...modalProps} size="lg" title="Song Spotlight">
                <div style={{ marginBottom: "20px" }}>
                    <Settings {...props} />
                </div>
            </Modal>
        </ErrorBoundary>
    );
}

export function openSettingsModal(templateData?: UserData) {
    openModal(modalProps => <SettingsModal modalProps={modalProps} templateData={templateData} />);
}
