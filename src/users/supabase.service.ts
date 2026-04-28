import { Injectable } from '@nestjs/common';
import { StorageClient } from '@supabase/storage-js';

@Injectable()
export class SupabaseStorageService {
    private storageClient: StorageClient;

    constructor() {
        this.storageClient = new StorageClient(
            `${process.env.SUPABASE_PROJECT_URL}/storage/v1`,
            {
                apikey: process.env.SUPABASE_SERVICE_KEY,
                Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
            },
        );
    }

    async uploadAvatar(file: Express.Multer.File, userId: string) {
        const fileExt = file.originalname.split('.').pop();
        const filePath = `${userId}.${fileExt}`;

        const { error } = await this.storageClient
            .from('avatars')
            .upload(filePath, file.buffer, {
                upsert: true,
                contentType: file.mimetype,
            });

        if (error) throw error;

        const { data } = this.storageClient
            .from('avatars')
            .getPublicUrl(filePath);

        return data.publicUrl;
    }
}