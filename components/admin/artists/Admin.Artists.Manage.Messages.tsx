/// components/admin/artists/Admin.Artists.Manage.Messages.tsx

"use client";

import { Artist, ArtistMessage } from "@prisma/client";
import { useArtistsGet } from "@/app/hooks/useArtists";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CreateArtistMessage from "./Admin.Artists.Manage.CreateArtistMessage";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash } from "lucide-react";
import Image from "next/image";
interface AdminArtistsManageMessagesProps {
    artist: Artist;
}

export default function AdminArtistsManageMessages({
    artist,
}: AdminArtistsManageMessagesProps) {
    const { artistMessages, isLoading, error } = useArtistsGet({
        getArtistMessagesInput: {
            artistId: artist.id,
        },
    });

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <div className="space-y-6">
            <Dialog>
                <DialogTrigger asChild>
                    <Button>메시지 추가</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>메시지 추가</DialogTitle>
                    </DialogHeader>
                    <DialogDescription>
                        <CreateArtistMessage
                            artistId={artist.id}
                            mode="create"
                        />
                    </DialogDescription>
                </DialogContent>
            </Dialog>
            <Table className="max-w-[1300px] rounded-2xl shadow-xl border border-border bg-card animate-fade-in">
                <TableHeader>
                    <TableRow className="align-middle text-center divide-x divide-[rgba(255,255,255,0.2)]">
                        <TableHead
                            className="text-center"
                            style={{ maxWidth: "40%", width: "40%" }}
                        >
                            메시지
                        </TableHead>
                        <TableHead className="text-center">배너</TableHead>
                        <TableHead className="text-center">외부 링크</TableHead>
                        <TableHead className="text-center">활성화</TableHead>
                        <TableHead className="text-center">시작일</TableHead>
                        <TableHead className="text-center">종료일</TableHead>
                        <TableHead className="text-center">작업</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-[rgba(255,255,255,0.1)]">
                    {artistMessages?.map((message) => (
                        <TableRow
                            key={message.id}
                            className="hover:bg-accent/10 transition-colors duration-200 divide-x divide-[rgba(255,255,255,0.2)]"
                        >
                            <TableCell
                                className="font-body break-words"
                                style={{
                                    maxWidth: "40%",
                                    width: "40%",
                                    wordBreak: "break-word",
                                    whiteSpace: "pre-wrap",
                                }}
                            >
                                {message.message}
                            </TableCell>
                            <TableCell className="flex justify-center items-center">
                                {message.bannerUrl ? (
                                    <Image
                                        src={message.bannerUrl}
                                        alt="배너"
                                        width={144}
                                        height={144}
                                    />
                                ) : (
                                    <span className="text-muted-foreground">
                                        -
                                    </span>
                                )}
                            </TableCell>
                            <TableCell className="text-center">
                                {message.externalUrl ? (
                                    <a
                                        href={message.externalUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary underline hover:text-accent transition-colors"
                                    >
                                        링크
                                    </a>
                                ) : (
                                    <span className="text-muted-foreground">
                                        -
                                    </span>
                                )}
                            </TableCell>
                            <TableCell className="align-middle">
                                <Switch checked={message.isActive} disabled />
                            </TableCell>
                            <TableCell className="text-center">
                                {message.startDate
                                    ? new Date(
                                          message.startDate
                                      ).toLocaleString("ko-KR")
                                    : "-"}
                            </TableCell>
                            <TableCell className="text-center">
                                {message.endDate
                                    ? new Date(message.endDate).toLocaleString(
                                          "ko-KR"
                                      )
                                    : "-"}
                            </TableCell>
                            <TableCell>
                                <div className="flex gap-2">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <Pencil />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>
                                                    메시지 수정
                                                </DialogTitle>
                                            </DialogHeader>
                                            <DialogContent>
                                                <CreateArtistMessage
                                                    artistId={artist.id}
                                                    mode="update"
                                                    initialData={message}
                                                />
                                            </DialogContent>
                                        </DialogContent>
                                    </Dialog>
                                    <Button variant="ghost" size="icon">
                                        <Trash />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
