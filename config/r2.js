import { S3Client } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import https from 'node:https';
import http from 'node:http';
import dotenv from 'dotenv';

dotenv.config();

const agentOptions = {
    keepAlive: true,
    maxSockets: 100,
    maxFreeSockets: 25,
    timeout: 30000,
    keepAliveMsecs: 60000,
};

const r2 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
    requestHandler: new NodeHttpHandler({
        httpsAgent: new https.Agent(agentOptions),
        httpAgent: new http.Agent(agentOptions),
        connectionTimeout: 5000,
        requestTimeout: 20000,
    }),
    requestChecksumCalculation: 'WHEN_REQUIRED', // Disable automatic checksums
});

export default r2;
