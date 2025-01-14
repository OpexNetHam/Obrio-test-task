import { Readable } from "typeorm/platform/PlatformTools"

export type FileStorageUploadParams = {
    fileStream: Readable,
    fileMetaData: FileMetaData
}

export type FileMetaData = {
    fileName: string,
    mimeType: string, 
    resumableStream?: boolean,
    fileSize?: number,
    bytesUploaded?: number
}