import { Readable } from "typeorm/platform/PlatformTools"

export type FileStorageUploadParams = {
    fileStream: Readable,
    fileMetaData: FileMetaData,
    resumeUploadData: ResumeUploadData
}

export type FileMetaData = {
    fileName: string,
    mimeType: string, 
    fileSize?: number,
} 

export type ResumeUploadData = {
    resumeUploadUrl: string
    bytesUploaded?: number
}