
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type TelegramPhoto = {
    file_id: string;
    file_unique_id: string;
    file_size?: number;
};

type TelegramChannelPost = {
    message_id: number;
    chat: {
        id: number;
        type: string;
    };
    caption?: string;
    photo?: TelegramPhoto[];
};

type TelegramUpdate = {
    channel_post?: TelegramChannelPost;
};

export async function POST(request: NextRequest) {
    try {
        const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
        const receivedSecret = request.headers.get(
            "x-telegram-bot-api-secret-token"
        );

        if (!secret || receivedSecret !== secret) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const token = process.env.TELEGRAM_BOT_TOKEN;

        if (!token) {
            throw new Error("Telegram bot token is missing.");
        }

        const update: TelegramUpdate = await request.json();
        const post = update.channel_post;

        // Abaikan update yang bukan foto dari channel.
        if (!post || !post.photo?.length) {
            return NextResponse.json({ ok: true });
        }

        // Ambil resolusi foto terbesar.
        const photo = post.photo[post.photo.length - 1];

        // Ambil lokasi file dari Telegram.
        const fileResponse = await fetch(
            `https://api.telegram.org/bot${token}/getFile?file_id=${photo.file_id}`
        );

        const fileData = await fileResponse.json();

        if (!fileResponse.ok || !fileData.ok || !fileData.result?.file_path) {
            throw new Error("Failed to retrieve Telegram photo.");
        }

        const filePath = fileData.result.file_path;

        // Download foto dari Telegram.
        const imageResponse = await fetch(
            `https://api.telegram.org/file/bot${token}/${filePath}`
        );

        if (!imageResponse.ok) {
            throw new Error("Failed to download Telegram photo.");
        }

        const imageBuffer = new Uint8Array(
            await imageResponse.arrayBuffer()
        );

        if (imageBuffer.byteLength > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: "Photo exceeds 5 MB." },
                { status: 413 }
            );
        }

        // Simpan foto ke Supabase Storage.
        const storagePath = `${post.chat.id}/${post.message_id}.jpg`;

        const { error: uploadError } = await supabaseAdmin.storage
            .from("gallery")
            .upload(storagePath, imageBuffer, {
                contentType: "image/jpeg",
                upsert: true,
            });

        if (uploadError) {
            throw uploadError;
        }

        // Simpan metadata ke database.
        const { error: databaseError } = await supabaseAdmin
            .from("gallery_photos")
            .upsert(
                {
                    caption: post.caption ?? null,
                    storage_path: storagePath,
                    telegram_chat_id: post.chat.id,
                    telegram_message_id: post.message_id,
                    telegram_file_id: photo.file_id,
                },
                {
                    onConflict: "telegram_chat_id,telegram_message_id",
                }
            );

        if (databaseError) {
            throw databaseError;
        }

        return NextResponse.json({
            ok: true,
            message: "Photo saved successfully.",
        });
    } catch (error) {
        console.error("Telegram webhook error:", error);

        return NextResponse.json(
            { error: "Failed to process Telegram update." },
            { status: 500 }
        );
    }
}
