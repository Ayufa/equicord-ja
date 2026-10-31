/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button } from "@components/Button";
import { Flex } from "@components/Flex";
import { Heading } from "@components/Heading";
import { Paragraph } from "@components/Paragraph";
import { classes } from "@utils/misc";
import { RenderModalProps } from "@vencord/discord-types";
import { FluxDispatcher, Modal, openModal, TextInput, useCallback, useState } from "@webpack/common";

import { settings } from "../settings";
import { Collection, Gif } from "../types";
import { cache_collections, createCollection, getItemCollectionNameFromId, moveGifToCollection, renameCollection } from "../utils/collectionManager";
import { cl, stripPrefix } from "../utils/misc";

export function openCollectionInfoModal(collection: Collection) {
    openModal(props => (
        <InfoModal props={props} title="コレクション情報" rows={[
            { label: "名前", value: stripPrefix(collection.name) },
            { label: "GIF", value: String(collection.gifs.length) },
            { label: "作成日時", value: collection.createdAt ? new Date(collection.createdAt).toLocaleString() : "Unknown" },
            { label: "最終更新", value: collection.lastUpdated ? new Date(collection.lastUpdated).toLocaleString() : "Unknown" },
        ]} />
    ));
}

export function openGifInfoModal(gif: Gif) {
    openModal(props => (
        <InfoModal props={props} title="情報" rows={[
            { label: "追加日時", value: gif.addedAt ? new Date(gif.addedAt).toLocaleString() : "Unknown" },
            { label: "幅", value: String(gif.width) },
            { label: "高さ", value: String(gif.height) },
        ]} />
    ));
}

export function openMoveToCollectionModal(gifId: string) {
    openModal(props => <MoveToCollectionModal props={props} gifId={gifId} />);
}

export function openCreateCollectionModal(gif: Gif) {
    openModal(props => <CreateCollectionModal props={props} gif={gif} />);
}

export function openRenameCollectionModal(name: string) {
    openModal(props => <RenameCollectionModal props={props} name={name} />);
}

function InfoModal({ props, title, rows }: { props: RenderModalProps; title: string; rows: { label: string; value: string; }[]; }) {
    return (
        <Modal
            {...props}
            size="sm"
            title={title}
            actions={[
                { text: "閉じる", variant: "secondary", onClick: props.onClose }
            ]}
        >
            <section>
                {rows.map(row => (
                    <Flex key={row.label} className={cl("info-row")}>
                        <Heading className={cl("info-title")}>{row.label}</Heading>
                        <Paragraph className={cl("info-text")}>{row.value}</Paragraph>
                    </Flex>
                ))}
            </section>
        </Modal>
    );
}

function MoveToCollectionModal({ props, gifId }: { props: RenderModalProps; gifId: string; }) {
    return (
        <Modal
            {...props}
            size="sm"
            title="コレクションへ移動"
            actions={[
                { text: "閉じる", variant: "secondary", onClick: props.onClose }
            ]}
        >
            <Heading style={{ marginBottom: "10px" }}>アイテムの移動先コレクションを選択してください</Heading>
            <div className={cl("buttons")}>
                {cache_collections
                    .filter(col => col.name !== getItemCollectionNameFromId(gifId))
                    .map(col => (
                        <Button
                            key={col.name}
                            className={cl("button")}
                            onClick={async () => {
                                const fromCollection = getItemCollectionNameFromId(gifId);
                                if (!fromCollection) return;
                                await moveGifToCollection(gifId, fromCollection, col.name);
                                FluxDispatcher.dispatch({ type: "GIF_PICKER_QUERY", query: "" });
                                FluxDispatcher.dispatch({ type: "GIF_PICKER_QUERY", query: fromCollection });
                                props.onClose();
                            }}
                        >
                            {stripPrefix(col.name)}
                        </Button>
                    ))}
            </div>
        </Modal>
    );
}

function CreateCollectionModal({ props, gif }: { props: RenderModalProps; gif: Gif; }) {
    const [name, setName] = useState("");
    const onSubmit = useCallback((e?: React.FormEvent) => {
        e?.preventDefault();
        if (!name.length) return;
        createCollection(name, [gif]);
        props.onClose();
    }, [name, gif, props]);

    return (
        <Modal
            {...props}
            size="sm"
            title="コレクションを作成"
            actions={[
                { text: "作成", onClick: onSubmit, disabled: !name.length, variant: "primary" }
            ]}
        >
            <form onSubmit={onSubmit}>
                <Heading className={cl("rename-text")}>コレクション名</Heading>
                <TextInput onChange={setName} />
            </form>
        </Modal>
    );
}

function RenameCollectionModal({ props, name }: { props: RenderModalProps; name: string; }) {
    const prefix = settings.store.collectionPrefix;
    const strippedName = name.startsWith(prefix) ? name.slice(prefix.length) : name;
    const [newName, setNewName] = useState(strippedName);
    const tooLong = newName.length >= 25;

    const onSubmit = useCallback(async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newName.length || tooLong) return;
        await renameCollection(name, newName);
        props.onClose();
    }, [newName, name, tooLong, props]);

    return (
        <Modal
            {...props}
            size="sm"
            title="コレクションの名前を変更"
            actions={[
                { text: "名前を変更", onClick: onSubmit, disabled: !newName.length || tooLong, variant: "primary" }
            ]}
        >
            <form onSubmit={onSubmit}>
                <Paragraph className={cl("rename-text")}>新しいコレクション名</Paragraph>
                <TextInput value={newName} className={classes(cl("rename-input"), tooLong ? cl("input-warning") : "")} onChange={setNewName} />
                {tooLong && <Paragraph className={cl("warning-text")}>名前は24文字以内にしてください</Paragraph>}
            </form>
        </Modal>
    );
}
