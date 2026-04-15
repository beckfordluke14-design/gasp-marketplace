import { r2Client, BUCKET_NAME } from '../src/lib/r2Client';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import fs from 'fs';
import path from 'path';

const files = [
    'chirp3_aoede_sample.mp3',
    'chirp3_kore_sample.mp3',
    'chirp3_leda_sample.mp3',
    'chirp3_zephyr_sample.mp3'
];

async function run() {
    for (const file of files) {
        console.log(`Uploading ${file} to R2...`);
        try {
            const filePath = path.join(process.cwd(), 'public', 'samples', 'vocal-test', file);
            const buffer = fs.readFileSync(filePath);
            const key = `samples/vocal-test/${file}`;
            
            await r2Client.send(new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key,
                Body: buffer,
                ContentType: 'audio/mpeg'
            }));
            
            console.log(`✅ Uploaded to: https://asset.gasp.fun/${key}`);
        } catch (err: any) {
            console.error(`❌ Failed to upload ${file}:`, err.message);
        }
    }
}

run();
